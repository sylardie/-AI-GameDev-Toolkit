import base64
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from fastapi import HTTPException

from app.api.files import resolve_output_file
from app.modules.art_pipeline import style_profile_store
from app.modules.shared.llm_client import (
    _build_chat_completions_url,
    _normalize_json_content,
    chat_completion_json,
    chat_completion_json_with_image,
)
from app.modules.art_pipeline.audio_generator import parse_custom_audio_response
from app.modules.art_pipeline.comfyui_workflow import build_audio_workflow
from app.modules.shared.uploads import UploadTooLargeError, copy_upload_with_limit
from app.schemas.art import ArtStyleProfileCreate
from app.schemas.settings import ComfyUIAudioWorkflowProfile, LLMSettings


class ReleaseSafetyTests(unittest.TestCase):
    def test_json_markdown_fence_is_removed(self):
        content = _normalize_json_content('```json\n{"ok": true}\n```')
        self.assertEqual(json.loads(content), {"ok": True})

    def test_llm_base_url_without_version_gets_v1_endpoint(self):
        self.assertEqual(
            _build_chat_completions_url("https://example.com"),
            "https://example.com/v1/chat/completions",
        )

    def test_llm_base_url_with_trailing_slash_gets_v1_endpoint(self):
        self.assertEqual(
            _build_chat_completions_url("https://example.com/"),
            "https://example.com/v1/chat/completions",
        )

    def test_llm_base_url_with_v1_does_not_duplicate_version(self):
        self.assertEqual(
            _build_chat_completions_url("https://example.com/v1/"),
            "https://example.com/v1/chat/completions",
        )

    def test_llm_proxy_path_keeps_existing_append_behavior(self):
        self.assertEqual(
            _build_chat_completions_url("https://example.com/proxy"),
            "https://example.com/proxy/v1/chat/completions",
        )

    def test_llm_path_ending_in_v1_characters_is_not_version_segment(self):
        self.assertEqual(
            _build_chat_completions_url("https://example.com/proxy-v1"),
            "https://example.com/proxy-v1/v1/chat/completions",
        )

    @patch("app.modules.shared.llm_client.requests.post")
    def test_text_llm_payload_omits_response_format(self, post: Mock):
        post.return_value.status_code = 200
        post.return_value.json.return_value = {
            "choices": [{"message": {"content": '{"ok": true}'}}],
        }

        result = chat_completion_json(
            "Return JSON only.",
            "Return an object.",
            settings=self._llm_settings(),
        )

        self.assertEqual(json.loads(result), {"ok": True})
        self.assertNotIn("response_format", post.call_args.kwargs["json"])

    @patch("app.modules.shared.llm_client.requests.post")
    def test_vision_llm_payload_omits_response_format(self, post: Mock):
        post.return_value.status_code = 200
        post.return_value.json.return_value = {
            "choices": [{"message": {"content": '{"ok": true}'}}],
        }

        result = chat_completion_json_with_image(
            "Return JSON only.",
            "Describe the image.",
            "data:image/png;base64,AA==",
            settings=self._llm_settings(),
        )

        self.assertEqual(json.loads(result), {"ok": True})
        self.assertNotIn("response_format", post.call_args.kwargs["json"])

    def test_output_download_rejects_path_traversal(self):
        with self.assertRaises(HTTPException) as context:
            resolve_output_file("outputs/../../secret.env")
        self.assertEqual(context.exception.status_code, 400)

    def test_upload_limit_stops_oversized_stream(self):
        source = io.BytesIO(b"123456")
        destination = io.BytesIO()
        with self.assertRaises(UploadTooLargeError):
            copy_upload_with_limit(source, destination, max_bytes=5)

    def test_style_profile_update_preserves_identity(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            original_path = style_profile_store.STYLE_PROFILES_PATH
            style_profile_store.STYLE_PROFILES_PATH = Path(temp_dir) / "profiles.json"
            try:
                created = style_profile_store.create_style_profile(
                    ArtStyleProfileCreate(
                        name="Original",
                        style_spec_prompt="Original prompt",
                    )
                )
                updated = style_profile_store.update_style_profile(
                    created.id,
                    ArtStyleProfileCreate(
                        name="Edited",
                        style_spec_prompt="Edited prompt",
                    ),
                )
                self.assertIsNotNone(updated)
                self.assertEqual(updated.id, created.id)
                self.assertEqual(updated.created_at, created.created_at)
                self.assertEqual(updated.name, "Edited")
                self.assertEqual(updated.style_spec_prompt, "Edited prompt")
            finally:
                style_profile_store.STYLE_PROFILES_PATH = original_path

    def test_custom_audio_binary_response_is_saved(self):
        response = Mock()
        response.headers = {"content-type": "audio/wav"}
        response.content = b"RIFF"

        with tempfile.TemporaryDirectory() as temp_dir:
            result = parse_custom_audio_response(response, Path(temp_dir), "wav")
            self.assertEqual(result.response_mode, "binary")
            self.assertEqual(result.path.read_bytes(), b"RIFF")
            self.assertEqual(result.path.suffix, ".wav")

    def test_custom_audio_base64_response_is_saved(self):
        response = Mock()
        response.headers = {"content-type": "application/json"}
        response.json.return_value = {
            "audio_base64": base64.b64encode(b"audio").decode("ascii"),
            "mime_type": "audio/mpeg",
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            result = parse_custom_audio_response(response, Path(temp_dir), "mp3")
            self.assertEqual(result.response_mode, "audio_base64")
            self.assertEqual(result.path.read_bytes(), b"audio")
            self.assertEqual(result.path.suffix, ".mp3")

    def test_comfyui_audio_workflow_replaces_mapped_inputs(self):
        workflow = {
            "1": {"inputs": {"text": ""}},
            "2": {"inputs": {"seed": 0}},
            "3": {"inputs": {"duration": 0}},
        }
        profile = ComfyUIAudioWorkflowProfile(
            enabled=True,
            workflow=workflow,
            prompt_node_id="1",
            prompt_input_name="text",
            seed_node_id="2",
            seed_input_name="seed",
            duration_node_id="3",
            duration_input_name="duration",
        )

        result = build_audio_workflow(
            profile=profile,
            prompt="menu confirm",
            negative_prompt="noise",
            duration=2.5,
            seed=42,
        )

        self.assertEqual(result["1"]["inputs"]["text"], "menu confirm")
        self.assertEqual(result["2"]["inputs"]["seed"], 42)
        self.assertEqual(result["3"]["inputs"]["duration"], 2.5)
        self.assertEqual(workflow["1"]["inputs"]["text"], "")

    @staticmethod
    def _llm_settings() -> LLMSettings:
        return LLMSettings(
            enabled=True,
            provider="custom",
            api_base_url="https://example.com/v1",
            model="test-model",
            api_key="test-key",
            timeout=30,
        )


if __name__ == "__main__":
    unittest.main()
