import io
import json
import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException

from app.api.files import resolve_output_file
from app.modules.art_pipeline import style_profile_store
from app.modules.shared.llm_client import _normalize_json_content
from app.modules.shared.uploads import UploadTooLargeError, copy_upload_with_limit
from app.schemas.art import ArtStyleProfileCreate


class ReleaseSafetyTests(unittest.TestCase):
    def test_json_markdown_fence_is_removed(self):
        content = _normalize_json_content('```json\n{"ok": true}\n```')
        self.assertEqual(json.loads(content), {"ok": True})

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


if __name__ == "__main__":
    unittest.main()
