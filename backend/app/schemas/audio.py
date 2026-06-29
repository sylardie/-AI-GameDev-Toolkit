from typing import Literal, Optional

from pydantic import BaseModel


AudioOutputFormat = Literal["wav", "ogg", "mp3"]
AudioGenerationEngine = Literal["custom_api", "comfyui"]
AudioGenerationKind = Literal["music", "sfx"]


class AudioProcessResponse(BaseModel):
    output_id: str
    audio_path: str
    metadata_path: str
    duration: float
    format: AudioOutputFormat
    sample_rate: int
    zip_path: Optional[str] = None


class AudioGenerateRequest(BaseModel):
    engine: AudioGenerationEngine = "custom_api"
    kind: AudioGenerationKind = "sfx"
    prompt: str
    duration: float = 5.0
    loopable: bool = False
    style: str = ""
    scene: str = ""
    negative_prompt: str = ""
    output_format: AudioOutputFormat = "wav"


class AudioGenerateResponse(BaseModel):
    output_id: str
    audio_path: str
    metadata_path: str
    duration: float
    format: str
    engine: AudioGenerationEngine
    kind: AudioGenerationKind
    sample_rate: Optional[int] = None
    zip_path: Optional[str] = None
