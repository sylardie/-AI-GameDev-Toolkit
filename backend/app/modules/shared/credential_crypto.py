import base64
import os
from typing import Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


SETTINGS_KEY_ENV = "AI_GAMEDEV_SETTINGS_KEY"
ENCRYPTED_VERSION = 1
ENCRYPTED_ALGORITHM = "AES-256-GCM"
ASSOCIATED_DATA = b"ai-gamedev-toolkit-settings-v1"


class CredentialEncryptionError(ValueError):
    pass


def load_settings_key() -> bytes | None:
    encoded = os.getenv(SETTINGS_KEY_ENV, "").strip()
    if not encoded:
        return None

    try:
        padded = encoded + ("=" * (-len(encoded) % 4))
        key = base64.urlsafe_b64decode(padded.encode("ascii"))
    except Exception as exc:
        raise CredentialEncryptionError("Settings encryption key is invalid.") from exc

    if len(key) != 32:
        raise CredentialEncryptionError("Settings encryption key must contain 32 bytes.")
    return key


def encrypt_credential(value: str, key: bytes) -> dict[str, Any]:
    nonce = os.urandom(12)
    ciphertext = AESGCM(key).encrypt(
        nonce,
        value.encode("utf-8"),
        ASSOCIATED_DATA,
    )
    return {
        "version": ENCRYPTED_VERSION,
        "algorithm": ENCRYPTED_ALGORITHM,
        "nonce": base64.urlsafe_b64encode(nonce).decode("ascii"),
        "ciphertext": base64.urlsafe_b64encode(ciphertext).decode("ascii"),
    }


def decrypt_credential(payload: dict[str, Any], key: bytes) -> str:
    if payload.get("version") != ENCRYPTED_VERSION:
        raise CredentialEncryptionError("Unsupported encrypted credential version.")
    if payload.get("algorithm") != ENCRYPTED_ALGORITHM:
        raise CredentialEncryptionError("Unsupported encrypted credential algorithm.")

    try:
        nonce = base64.urlsafe_b64decode(str(payload["nonce"]).encode("ascii"))
        ciphertext = base64.urlsafe_b64decode(
            str(payload["ciphertext"]).encode("ascii")
        )
        plaintext = AESGCM(key).decrypt(nonce, ciphertext, ASSOCIATED_DATA)
        return plaintext.decode("utf-8")
    except CredentialEncryptionError:
        raise
    except Exception as exc:
        raise CredentialEncryptionError(
            "Encrypted credential could not be decrypted."
        ) from exc
