import json
import shutil
import subprocess
import zipfile
from datetime import datetime
from pathlib import Path
from uuid import uuid4

import imageio_ffmpeg

from app.core.config import OUTPUTS_DIR
from app.schemas.audio import AudioOutputFormat, AudioProcessResponse


class AudioProcessError(Exception):
    pass


SUPPORTED_FORMATS: set[AudioOutputFormat] = {"wav", "ogg", "mp3"}


def process_audio_file(
    audio_path: Path,
    filename: str,
    start_time: float,
    end_time: float,
    normalize_enabled: bool,
    target_lufs: float,
    output_format: AudioOutputFormat,
) -> AudioProcessResponse:
    if output_format not in SUPPORTED_FORMATS:
        raise AudioProcessError("Unsupported output format.")

    output_id = f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:8]}"
    output_dir = OUTPUTS_DIR / "audio" / output_id
    output_dir.mkdir(parents=True, exist_ok=True)

    safe_stem = _safe_file_stem(filename)
    source_path = output_dir / f"source{audio_path.suffix.lower() or '.audio'}"
    shutil.copyfile(audio_path, source_path)

    output_name = f"{safe_stem}_processed.{output_format}"
    output_path = output_dir / output_name
    metadata_path = output_dir / "metadata.json"
    zip_path = output_dir / f"{output_id}.zip"

    duration = max(0.0, end_time - start_time) if end_time > start_time else 0.0
    command = _build_ffmpeg_command(
        source_path=source_path,
        output_path=output_path,
        start_time=start_time,
        end_time=end_time,
        normalize_enabled=normalize_enabled,
        target_lufs=target_lufs,
        output_format=output_format,
    )

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )
    except subprocess.SubprocessError as exc:
        raise AudioProcessError(f"ffmpeg failed to process audio: {exc}") from exc

    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        raise AudioProcessError(f"ffmpeg error: {detail}")

    metadata = {
        "output_id": output_id,
        "source_filename": filename,
        "start_time": start_time,
        "end_time": end_time,
        "duration": duration,
        "normalize_enabled": normalize_enabled,
        "target_lufs": target_lufs,
        "format": output_format,
        "sample_rate": 44100,
        "audio_file": output_name,
    }
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as package:
        package.write(output_path, arcname=output_name)
        package.write(metadata_path, arcname="metadata.json")

    return AudioProcessResponse(
        output_id=output_id,
        audio_path=f"outputs/audio/{output_id}/{output_name}",
        metadata_path=f"outputs/audio/{output_id}/metadata.json",
        zip_path=f"outputs/audio/{output_id}/{output_id}.zip",
        duration=duration,
        format=output_format,
        sample_rate=44100,
    )


def _build_ffmpeg_command(
    source_path: Path,
    output_path: Path,
    start_time: float,
    end_time: float,
    normalize_enabled: bool,
    target_lufs: float,
    output_format: AudioOutputFormat,
) -> list[str]:
    command = [imageio_ffmpeg.get_ffmpeg_exe(), "-y"]

    if start_time > 0:
        command.extend(["-ss", f"{start_time:.3f}"])

    command.extend(["-i", str(source_path)])

    if end_time > start_time:
        command.extend(["-t", f"{end_time - start_time:.3f}"])

    if normalize_enabled:
        command.extend(["-af", f"loudnorm=I={target_lufs}:TP=-1.5:LRA=11"])

    command.extend(["-vn", "-ar", "44100"])

    if output_format == "mp3":
        command.extend(["-codec:a", "libmp3lame", "-b:a", "192k"])
    elif output_format == "ogg":
        command.extend(["-codec:a", "libvorbis", "-q:a", "5"])
    else:
        command.extend(["-codec:a", "pcm_s16le"])

    command.append(str(output_path))
    return command


def _safe_file_stem(filename: str) -> str:
    stem = Path(filename).stem
    cleaned = "".join(char if char.isalnum() or char in {"-", "_"} else "_" for char in stem)
    return cleaned.strip("_") or "audio"
