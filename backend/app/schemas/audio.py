from typing import Literal, Optional

from pydantic import BaseModel


AudioOutputFormat = Literal["wav", "ogg", "mp3"]


class AudioProcessResponse(BaseModel):
    output_id: str
    audio_path: str
    metadata_path: str
    duration: float
    format: AudioOutputFormat
    sample_rate: int
    zip_path: Optional[str] = None
