from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.modules.art_pipeline.audio_processor import AudioProcessError, process_audio_file
from app.schemas.audio import AudioOutputFormat, AudioProcessResponse
from app.modules.shared.uploads import UploadTooLargeError, copy_upload_with_limit


router = APIRouter(prefix="/api/audio", tags=["Audio Tools"])
MAX_AUDIO_UPLOAD_BYTES = 250 * 1024 * 1024


@router.post("/process", response_model=AudioProcessResponse)
def process_audio(
    audio: UploadFile = File(...),
    start_time: float = Form(default=0.0),
    end_time: float = Form(default=0.0),
    normalize_enabled: bool = Form(default=True),
    target_lufs: float = Form(default=-16.0),
    output_format: AudioOutputFormat = Form(default="wav"),
):
    if start_time < 0 or end_time < 0:
        raise HTTPException(status_code=400, detail="Start and end time must be non-negative.")
    if end_time > 0 and end_time <= start_time:
        raise HTTPException(status_code=400, detail="End time must be greater than start time.")
    if target_lufs < -40 or target_lufs > -1:
        raise HTTPException(status_code=400, detail="Target LUFS must be between -40 and -1.")

    suffix = _safe_audio_suffix(audio.filename or "")
    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            copy_upload_with_limit(audio.file, temp_file, MAX_AUDIO_UPLOAD_BYTES)
    except UploadTooLargeError as exc:
        Path(temp_path).unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail=str(exc)) from exc

    try:
        return process_audio_file(
            audio_path=Path(temp_path),
            filename=audio.filename or "audio",
            start_time=start_time,
            end_time=end_time,
            normalize_enabled=normalize_enabled,
            target_lufs=target_lufs,
            output_format=output_format,
        )
    except AudioProcessError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        Path(temp_path).unlink(missing_ok=True)


def _safe_audio_suffix(filename: str) -> str:
    lowered = filename.lower()
    for suffix in [".wav", ".mp3", ".ogg", ".flac", ".m4a", ".aac"]:
        if lowered.endswith(suffix):
            return suffix
    return ".wav"
