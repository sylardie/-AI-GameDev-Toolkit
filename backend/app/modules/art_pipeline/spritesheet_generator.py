import json
import math
import zipfile
from datetime import datetime
from pathlib import Path

import imageio.v3 as iio
from PIL import Image, ImageChops, ImageStat

from app.core.config import OUTPUTS_DIR


def generate_spritesheet_from_video(
    video_path: Path,
    filename: str,
    fps: float,
    max_frames: int,
    target_frame_count: int,
    columns: int,
    frame_width: int,
    frame_height: int,
    metadata_target: str,
    start_time: float,
    end_time: float,
    extraction_mode: str,
    frame_interval: int,
    dedupe_enabled: bool,
    dedupe_threshold: float,
    transparent_enabled: bool,
    transparent_color: str,
    transparent_tolerance: int,
    transparent_feather: int,
    export_gif: bool,
) -> dict:
    output_id = f"spritesheet_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
    output_dir = OUTPUTS_DIR / "assets" / output_id
    frames_dir = output_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    source = _source_info(video_path, filename)
    _save_source(output_dir, source)
    frames = _extract_frames(
        video_path=video_path,
        frames_dir=frames_dir,
        source_fps=source["fps"],
        fps=fps,
        max_frames=max_frames,
        target_frame_count=target_frame_count,
        frame_width=frame_width,
        frame_height=frame_height,
        start_time=start_time,
        end_time=end_time,
        extraction_mode=extraction_mode,
        frame_interval=frame_interval,
        dedupe_enabled=dedupe_enabled,
        dedupe_threshold=dedupe_threshold,
        transparent_enabled=transparent_enabled,
        transparent_color=transparent_color,
        transparent_tolerance=transparent_tolerance,
        transparent_feather=transparent_feather,
    )
    if not frames:
        raise ValueError("No frames could be extracted from the video.")
    _save_frame_manifest(output_dir, frames)

    return export_spritesheet(
        output_id=output_id,
        selected_indices=[frame["index"] for frame in frames],
        columns=columns,
        frame_width=frame_width,
        frame_height=frame_height,
        metadata_target=metadata_target,
        export_gif=export_gif,
        gif_fps=fps,
        source=source,
    )


def export_spritesheet(
    output_id: str,
    selected_indices: list[int],
    columns: int,
    frame_width: int,
    frame_height: int,
    metadata_target: str,
    export_gif: bool,
    gif_fps: float,
    source: dict | None = None,
) -> dict:
    output_dir = _resolve_output_dir(output_id)
    frames_dir = output_dir / "frames"
    frame_files = _selected_frame_files(frames_dir, selected_indices)
    if not frame_files:
        raise ValueError("No selected frames are available for export.")

    rows = math.ceil(len(frame_files) / columns)
    sheet = Image.new("RGBA", (columns * frame_width, rows * frame_height), (0, 0, 0, 0))
    frame_items = []
    frame_manifest = _load_frame_manifest(output_dir)

    for output_index, frame_file in enumerate(frame_files, start=1):
        image = Image.open(frame_file).convert("RGBA").resize((frame_width, frame_height), Image.Resampling.LANCZOS)
        x = ((output_index - 1) % columns) * frame_width
        y = ((output_index - 1) // columns) * frame_height
        sheet.paste(image, (x, y), image)
        frame_items.append(_frame_info_from_file(output_index, frame_file, output_id, frame_manifest))

    spritesheet_file = output_dir / f"{output_id}.png"
    metadata_file = output_dir / f"{output_id}_meta.json"
    gif_file = output_dir / f"{output_id}.gif"
    zip_file = output_dir / f"{output_id}.zip"

    sheet.save(spritesheet_file)
    metadata = _build_metadata(
        output_id=output_id,
        frame_count=len(frame_files),
        columns=columns,
        rows=rows,
        frame_width=frame_width,
        frame_height=frame_height,
        metadata_target=metadata_target,
        frames=frame_items,
    )
    with metadata_file.open("w", encoding="utf-8") as file:
        json.dump(metadata, file, ensure_ascii=False, indent=2)

    gif_path = None
    if export_gif:
        _save_gif(frame_files, gif_file, frame_width, frame_height, gif_fps)
        gif_path = _output_path(output_id, gif_file.name)

    _save_zip(zip_file, [spritesheet_file, metadata_file] + ([gif_file] if gif_path else []))

    return {
        "output_id": output_id,
        "spritesheet_path": _output_path(output_id, spritesheet_file.name),
        "metadata_path": _output_path(output_id, metadata_file.name),
        "gif_path": gif_path,
        "zip_path": _output_path(output_id, zip_file.name),
        "frames": frame_items,
        "source": source or _load_source(output_dir),
        "frame_count": len(frame_files),
        "columns": columns,
        "rows": rows,
        "frame_width": frame_width,
        "frame_height": frame_height,
    }


def apply_transparency_to_frames(
    output_id: str,
    selected_indices: list[int],
    apply_to_all: bool,
    transparent_color: str,
    transparent_tolerance: int,
    transparent_feather: int,
    columns: int,
    frame_width: int,
    frame_height: int,
    metadata_target: str,
    export_gif: bool,
    gif_fps: float,
) -> dict:
    output_dir = _resolve_output_dir(output_id)
    frames_dir = output_dir / "frames"
    frame_files = sorted(frames_dir.glob("frame_*.png"))
    if not frame_files:
        raise ValueError("No extracted frames are available.")

    selected = set(selected_indices)
    target_files = frame_files if apply_to_all or not selected else [
        file for file in frame_files if _frame_number(file) in selected
    ]
    if not target_files:
        raise ValueError("No selected frames are available for transparency processing.")

    for frame_file in target_files:
        image = Image.open(frame_file).convert("RGBA")
        image = _apply_transparency(image, transparent_color, transparent_tolerance, transparent_feather)
        image.save(frame_file)

    export_indices = [_frame_number(file) for file in frame_files]
    return export_spritesheet(
        output_id=output_id,
        selected_indices=export_indices,
        columns=columns,
        frame_width=frame_width,
        frame_height=frame_height,
        metadata_target=metadata_target,
        export_gif=export_gif,
        gif_fps=gif_fps,
    )


def remove_image_background(
    image_path: Path,
    filename: str,
    transparent_color: str,
    transparent_tolerance: int,
    transparent_feather: int,
) -> dict:
    output_id = f"image_transparent_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
    output_dir = OUTPUTS_DIR / "assets" / output_id
    output_dir.mkdir(parents=True, exist_ok=True)

    image = Image.open(image_path).convert("RGBA")
    image = _apply_transparency(image, transparent_color, transparent_tolerance, transparent_feather)
    image_file = output_dir / f"{_safe_stem(filename)}_transparent.png"
    zip_file = output_dir / f"{output_id}.zip"

    image.save(image_file)
    _save_zip(zip_file, [image_file])

    return {
        "output_id": output_id,
        "image_path": _output_path(output_id, image_file.name),
        "zip_path": _output_path(output_id, zip_file.name),
        "width": image.width,
        "height": image.height,
    }


def _source_info(video_path: Path, filename: str) -> dict:
    metadata = iio.immeta(video_path)
    fps = float(metadata.get("fps") or 30)
    duration = float(metadata.get("duration") or 0)
    size = metadata.get("size") or (0, 0)
    return {
        "filename": filename,
        "width": int(size[0]) if len(size) > 0 else 0,
        "height": int(size[1]) if len(size) > 1 else 0,
        "duration": duration,
        "fps": fps,
    }


def _extract_frames(
    video_path: Path,
    frames_dir: Path,
    source_fps: float,
    fps: float,
    max_frames: int,
    target_frame_count: int,
    frame_width: int,
    frame_height: int,
    start_time: float,
    end_time: float,
    extraction_mode: str,
    frame_interval: int,
    dedupe_enabled: bool,
    dedupe_threshold: float,
    transparent_enabled: bool,
    transparent_color: str,
    transparent_tolerance: int,
    transparent_feather: int,
) -> list[dict]:
    if target_frame_count > 0:
        return _extract_evenly_sampled_frames(
            video_path=video_path,
            frames_dir=frames_dir,
            source_fps=source_fps,
            target_frame_count=target_frame_count,
            frame_width=frame_width,
            frame_height=frame_height,
            start_time=start_time,
            end_time=end_time,
            transparent_enabled=transparent_enabled,
            transparent_color=transparent_color,
            transparent_tolerance=transparent_tolerance,
            transparent_feather=transparent_feather,
        )

    step = max(1, frame_interval if extraction_mode == "interval" else round(source_fps / fps))
    frames = []
    previous_kept: Image.Image | None = None

    for source_index, frame in enumerate(iio.imiter(video_path)):
        timestamp = source_index / source_fps
        if timestamp < start_time:
            continue
        if end_time > 0 and timestamp > end_time:
            break
        if source_index % step != 0:
            continue

        image = Image.fromarray(frame).convert("RGBA")
        image = image.resize((frame_width, frame_height), Image.Resampling.LANCZOS)
        if transparent_enabled:
            image = _apply_transparency(image, transparent_color, transparent_tolerance, transparent_feather)
        if dedupe_enabled and previous_kept is not None:
            similarity = _image_similarity(previous_kept, image)
            if similarity >= dedupe_threshold:
                continue

        frame_index = len(frames) + 1
        frame_file = frames_dir / f"frame_{frame_index:04d}.png"
        image.save(frame_file)
        previous_kept = image
        frames.append(
            {
                "index": frame_index,
                "source_frame": source_index,
                "timestamp": timestamp,
                "path": _frame_output_path(frames_dir.parent.name, frame_file.name),
            }
        )

        if len(frames) >= max_frames:
            break

    return frames


def _extract_evenly_sampled_frames(
    video_path: Path,
    frames_dir: Path,
    source_fps: float,
    target_frame_count: int,
    frame_width: int,
    frame_height: int,
    start_time: float,
    end_time: float,
    transparent_enabled: bool,
    transparent_color: str,
    transparent_tolerance: int,
    transparent_feather: int,
) -> list[dict]:
    eligible_frames = []
    for source_index, _frame in enumerate(iio.imiter(video_path)):
        timestamp = source_index / source_fps
        if timestamp < start_time:
            continue
        if end_time > 0 and timestamp > end_time:
            break
        eligible_frames.append((source_index, timestamp))

    total_frames = len(eligible_frames)
    if total_frames == 0:
        return []
    if target_frame_count > total_frames:
        raise ValueError(
            f"Target frame count ({target_frame_count}) cannot be greater than source frame count ({total_frames})."
        )

    selected_positions = _even_sample_positions(total_frames, target_frame_count)
    selected_lookup = {
        eligible_frames[position][0]: {
            "position": position,
            "timestamp": eligible_frames[position][1],
        }
        for position in selected_positions
    }
    frames = []
    for source_index, frame in enumerate(iio.imiter(video_path)):
        selected = selected_lookup.get(source_index)
        if not selected:
            continue

        timestamp = selected["timestamp"]
        image = Image.fromarray(frame).convert("RGBA")
        image = image.resize((frame_width, frame_height), Image.Resampling.LANCZOS)
        if transparent_enabled:
            image = _apply_transparency(image, transparent_color, transparent_tolerance, transparent_feather)

        frame_index = len(frames) + 1
        frame_file = frames_dir / f"frame_{frame_index:04d}.png"
        image.save(frame_file)
        frames.append(
            {
                "index": frame_index,
                "source_frame": source_index,
                "timestamp": timestamp,
                "path": _frame_output_path(frames_dir.parent.name, frame_file.name),
            }
        )

        if len(frames) >= target_frame_count:
            break

    return frames


def _even_sample_positions(total_frames: int, target_frame_count: int) -> list[int]:
    if target_frame_count <= 1:
        return [0]
    if target_frame_count == total_frames:
        return list(range(total_frames))

    last_index = total_frames - 1
    positions = [
        round(index * last_index / (target_frame_count - 1))
        for index in range(target_frame_count)
    ]

    deduped = []
    used = set()
    for position in positions:
        candidate = min(max(position, 0), last_index)
        while candidate in used and candidate < last_index:
            candidate += 1
        while candidate in used and candidate > 0:
            candidate -= 1
        deduped.append(candidate)
        used.add(candidate)

    deduped[0] = 0
    deduped[-1] = last_index
    return sorted(deduped)


def _apply_transparency(image: Image.Image, color: str, tolerance: int, feather: int = 16) -> Image.Image:
    target = _hex_to_rgb(color)
    pixels = image.load()
    width, height = image.size
    feather = max(0, feather)
    soft_limit = tolerance + feather
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            distance = math.sqrt(
                (r - target[0]) ** 2
                + (g - target[1]) ** 2
                + (b - target[2]) ** 2
            )
            if distance <= tolerance:
                pixels[x, y] = (r, g, b, 0)
            elif feather > 0 and distance <= soft_limit:
                alpha_ratio = (distance - tolerance) / feather
                pixels[x, y] = (
                    _remove_background_tint(r, target[0], alpha_ratio),
                    _remove_background_tint(g, target[1], alpha_ratio),
                    _remove_background_tint(b, target[2], alpha_ratio),
                    round(a * alpha_ratio),
                )
    return image


def _remove_background_tint(channel: int, background: int, alpha_ratio: float) -> int:
    if alpha_ratio <= 0:
        return channel
    value = (channel - background * (1 - alpha_ratio)) / alpha_ratio
    return max(0, min(255, round(value)))


def _image_similarity(left: Image.Image, right: Image.Image) -> float:
    left_small = left.convert("L").resize((32, 32))
    right_small = right.convert("L").resize((32, 32))
    diff = ImageChops.difference(left_small, right_small)
    mean = ImageStat.Stat(diff).mean[0]
    return max(0.0, 100.0 - (mean / 255.0 * 100.0))


def _hex_to_rgb(value: str) -> tuple[int, int, int]:
    cleaned = value.strip().lstrip("#")
    if len(cleaned) != 6:
        return (0, 0, 0)
    return tuple(int(cleaned[index:index + 2], 16) for index in (0, 2, 4))


def _safe_stem(filename: str) -> str:
    stem = Path(filename or "image").stem.strip()
    cleaned = "".join(char if char.isalnum() or char in ("-", "_") else "_" for char in stem)
    return cleaned[:80] or "image"


def _selected_frame_files(frames_dir: Path, selected_indices: list[int]) -> list[Path]:
    selected = set(selected_indices)
    files = sorted(frames_dir.glob("frame_*.png"))
    if not selected:
        return files
    return [file for file in files if _frame_number(file) in selected]


def _frame_number(path: Path) -> int:
    return int(path.stem.split("_")[-1])


def _frame_info_from_file(index: int, frame_file: Path, output_id: str, frame_manifest: dict[int, dict] | None = None) -> dict:
    saved_frame_number = _frame_number(frame_file)
    manifest_item = (frame_manifest or {}).get(saved_frame_number, {})
    return {
        "index": index,
        "source_frame": manifest_item.get("source_frame", max(0, saved_frame_number - 1)),
        "timestamp": manifest_item.get("timestamp", 0),
        "path": _frame_output_path(output_id, frame_file.name),
    }


def _save_gif(frame_files: list[Path], gif_file: Path, frame_width: int, frame_height: int, gif_fps: float) -> None:
    frames = [
        Image.open(file).convert("RGBA").resize((frame_width, frame_height), Image.Resampling.LANCZOS)
        for file in frame_files
    ]
    duration = max(20, round(1000 / gif_fps))
    frames[0].save(gif_file, save_all=True, append_images=frames[1:], duration=duration, loop=0, disposal=2)


def _save_zip(zip_file: Path, files: list[Path]) -> None:
    with zipfile.ZipFile(zip_file, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file in files:
            if file.exists():
                archive.write(file, arcname=file.name)


def _build_metadata(
    output_id: str,
    frame_count: int,
    columns: int,
    rows: int,
    frame_width: int,
    frame_height: int,
    metadata_target: str,
    frames: list[dict],
) -> dict:
    common = {
        "output_id": output_id,
        "target": metadata_target,
        "frame_count": frame_count,
        "columns": columns,
        "rows": rows,
        "frame_width": frame_width,
        "frame_height": frame_height,
        "frames": frames,
    }

    if metadata_target == "godot":
        common["godot_import_hint"] = {
            "node": "AnimatedSprite2D or Sprite2D",
            "hframes": columns,
            "vframes": rows,
            "frame_count": frame_count,
        }
    elif metadata_target == "unity":
        common["unity_import_hint"] = {
            "texture_type": "Sprite (2D and UI)",
            "sprite_mode": "Multiple",
            "cell_size": [frame_width, frame_height],
            "frame_count": frame_count,
        }
    else:
        common["import_hint"] = "Slice the sheet by fixed cell size."

    return common


def _save_source(output_dir: Path, source: dict) -> None:
    with (output_dir / "source.json").open("w", encoding="utf-8") as file:
        json.dump(source, file, ensure_ascii=False, indent=2)


def _save_frame_manifest(output_dir: Path, frames: list[dict]) -> None:
    with (output_dir / "frames.json").open("w", encoding="utf-8") as file:
        json.dump({"frames": frames}, file, ensure_ascii=False, indent=2)


def _load_frame_manifest(output_dir: Path) -> dict[int, dict]:
    manifest_file = output_dir / "frames.json"
    if not manifest_file.exists():
        return {}
    with manifest_file.open("r", encoding="utf-8") as file:
        data = json.load(file)
    items = data.get("frames", [])
    if not isinstance(items, list):
        return {}
    return {
        int(item.get("index")): item
        for item in items
        if isinstance(item, dict) and item.get("index") is not None
    }


def _load_source(output_dir: Path) -> dict | None:
    source_file = output_dir / "source.json"
    if not source_file.exists():
        return None
    with source_file.open("r", encoding="utf-8") as file:
        return json.load(file)


def _resolve_output_dir(output_id: str) -> Path:
    output_dir = (OUTPUTS_DIR / "assets" / output_id).resolve()
    assets_root = (OUTPUTS_DIR / "assets").resolve()
    if assets_root not in output_dir.parents and output_dir != assets_root:
        raise ValueError("Invalid output id.")
    if not output_dir.exists():
        raise ValueError("Output does not exist.")
    return output_dir


def _output_path(output_id: str, filename: str) -> str:
    return f"outputs/assets/{output_id}/{filename}"


def _frame_output_path(output_id: str, filename: str) -> str:
    return f"outputs/assets/{output_id}/frames/{filename}"
