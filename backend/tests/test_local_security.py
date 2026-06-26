import base64
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.modules.shared import settings_store
from app.modules.shared.credential_crypto import (
    CredentialEncryptionError,
    decrypt_credential,
    encrypt_credential,
)
from app.schemas.settings import (
    ComfyUISettings,
    ImageProviderSettingsUpdate,
    LLMSettingsUpdate,
    LocalSettingsUpdate,
)


class LocalSecurityTests(unittest.TestCase):
    def test_api_authentication_protects_api_routes_but_not_health(self):
        with patch.dict(os.environ, {"AI_GAMEDEV_API_TOKEN": "expected"}, clear=False):
            client = TestClient(app)
            self.assertEqual(client.get("/api/health").status_code, 200)
            self.assertEqual(client.get("/api/settings").status_code, 401)
            self.assertEqual(
                client.get(
                    "/api/settings",
                    headers={"X-AI-Toolkit-Token": "wrong"},
                ).status_code,
                401,
            )
            self.assertEqual(
                client.get(
                    "/api/settings",
                    headers={"X-AI-Toolkit-Token": "expected"},
                ).status_code,
                200,
            )

    def test_api_authentication_is_disabled_without_environment_token(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("AI_GAMEDEV_API_TOKEN", None)
            client = TestClient(app)
            self.assertEqual(client.get("/api/settings").status_code, 200)

    def test_aes_gcm_round_trip_and_tamper_rejection(self):
        key = os.urandom(32)
        encrypted = encrypt_credential("secret-key", key)
        self.assertEqual(decrypt_credential(encrypted, key), "secret-key")

        tampered = dict(encrypted)
        ciphertext = bytearray(base64.urlsafe_b64decode(tampered["ciphertext"]))
        ciphertext[-1] ^= 1
        tampered["ciphertext"] = base64.urlsafe_b64encode(ciphertext).decode("ascii")
        with self.assertRaises(CredentialEncryptionError):
            decrypt_credential(tampered, key)

    def test_unpadded_node_base64url_settings_key_is_supported(self):
        key = os.urandom(32)
        encoded_key = base64.urlsafe_b64encode(key).decode("ascii").rstrip("=")
        with patch.dict(
            os.environ,
            {"AI_GAMEDEV_SETTINGS_KEY": encoded_key},
            clear=False,
        ):
            from app.modules.shared.credential_crypto import load_settings_key

            self.assertEqual(load_settings_key(), key)

    def test_secure_save_omits_plaintext_and_loads_decrypted_keys(self):
        with self._temporary_settings() as (settings_path, key):
            saved = settings_store.save_settings(self._settings_update())
            self.assertEqual(saved.llm.api_key, "llm-secret")

            raw = json.loads(settings_path.read_text(encoding="utf-8"))
            self.assertNotIn("api_key", raw["llm"])
            self.assertNotIn("api_key", raw["image_provider"])
            self.assertIn("api_key_encrypted", raw["llm"])
            self.assertNotIn("llm-secret", settings_path.read_text(encoding="utf-8"))

            loaded = settings_store.load_settings()
            self.assertEqual(loaded.llm.api_key, "llm-secret")
            self.assertEqual(loaded.image_provider.api_key, "image-secret")
            self.assertEqual(len(key), 32)

    def test_legacy_plaintext_keys_are_migrated_atomically(self):
        with self._temporary_settings() as (settings_path, _key):
            settings_path.write_text(
                json.dumps(
                    {
                        "llm": {
                            "enabled": True,
                            "provider": "custom",
                            "api_base_url": "https://example.com",
                            "model": "model",
                            "api_key": "legacy-secret",
                            "timeout": 60,
                        },
                        "comfyui": ComfyUISettings().model_dump(),
                        "image_provider": {
                            "enabled": False,
                            "provider": "none",
                            "api_base_url": "",
                            "model": "",
                            "api_key": "",
                            "timeout": 60,
                        },
                    }
                ),
                encoding="utf-8",
            )

            loaded = settings_store.load_settings()
            raw = json.loads(settings_path.read_text(encoding="utf-8"))

            self.assertEqual(loaded.llm.api_key, "legacy-secret")
            self.assertNotIn("api_key", raw["llm"])
            self.assertIn("api_key_encrypted", raw["llm"])
            self.assertNotIn("legacy-secret", settings_path.read_text(encoding="utf-8"))

    def test_corrupt_encrypted_settings_are_not_rewritten(self):
        with self._temporary_settings() as (settings_path, _key):
            original = {
                "llm": {
                    "enabled": True,
                    "provider": "custom",
                    "api_base_url": "https://example.com",
                    "model": "model",
                    "api_key_encrypted": {
                        "version": 1,
                        "algorithm": "AES-256-GCM",
                        "nonce": "invalid",
                        "ciphertext": "invalid",
                    },
                    "timeout": 60,
                },
                "comfyui": ComfyUISettings().model_dump(),
                "image_provider": {
                    "enabled": False,
                    "provider": "none",
                    "api_base_url": "",
                    "model": "",
                    "timeout": 60,
                },
            }
            serialized = json.dumps(original)
            settings_path.write_text(serialized, encoding="utf-8")

            with self.assertRaises(CredentialEncryptionError):
                settings_store.load_settings()
            self.assertEqual(settings_path.read_text(encoding="utf-8"), serialized)

    def _temporary_settings(self):
        return TemporarySettingsContext()

    @staticmethod
    def _settings_update() -> LocalSettingsUpdate:
        return LocalSettingsUpdate(
            llm=LLMSettingsUpdate(
                enabled=True,
                provider="custom",
                api_base_url="https://example.com",
                model="model",
                api_key="llm-secret",
                keep_existing_api_key=False,
                timeout=60,
            ),
            comfyui=ComfyUISettings(),
            image_provider=ImageProviderSettingsUpdate(
                enabled=True,
                provider="custom",
                api_base_url="https://images.example.com",
                model="image-model",
                api_key="image-secret",
                keep_existing_api_key=False,
                timeout=60,
            ),
        )


class TemporarySettingsContext:
    def __enter__(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        config_dir = Path(self.temp_dir.name)
        self.settings_path = config_dir / "local_settings.json"
        self.key = os.urandom(32)
        encoded_key = base64.urlsafe_b64encode(self.key).decode("ascii")
        self.environment = patch.dict(
            os.environ,
            {"AI_GAMEDEV_SETTINGS_KEY": encoded_key},
            clear=False,
        )
        self.config_patch = patch.object(settings_store, "CONFIG_DIR", config_dir)
        self.path_patch = patch.object(
            settings_store,
            "SETTINGS_PATH",
            self.settings_path,
        )
        self.environment.start()
        self.config_patch.start()
        self.path_patch.start()
        return self.settings_path, self.key

    def __exit__(self, exc_type, exc_value, traceback):
        self.path_patch.stop()
        self.config_patch.stop()
        self.environment.stop()
        self.temp_dir.cleanup()
