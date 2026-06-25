from pathlib import Path
from typing import BinaryIO

from fastapi import UploadFile


COPY_CHUNK_SIZE = 1024 * 1024


class UploadTooLargeError(ValueError):
    pass


def copy_upload_with_limit(
    source: BinaryIO,
    destination: BinaryIO,
    max_bytes: int,
) -> int:
    total = 0
    while chunk := source.read(COPY_CHUNK_SIZE):
        total += len(chunk)
        if total > max_bytes:
            raise UploadTooLargeError(f"Upload exceeds the {format_size(max_bytes)} limit.")
        destination.write(chunk)
    return total


async def read_upload_with_limit(upload: UploadFile, max_bytes: int) -> bytes:
    chunks: list[bytes] = []
    total = 0
    while chunk := await upload.read(COPY_CHUNK_SIZE):
        total += len(chunk)
        if total > max_bytes:
            raise UploadTooLargeError(f"Upload exceeds the {format_size(max_bytes)} limit.")
        chunks.append(chunk)
    return b"".join(chunks)


def remove_file(path: str | Path) -> None:
    Path(path).unlink(missing_ok=True)


def format_size(size_bytes: int) -> str:
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes // (1024 * 1024)} MB"
    return f"{size_bytes // 1024} KB"
