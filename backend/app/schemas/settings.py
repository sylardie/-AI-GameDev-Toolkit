from typing import Any, Dict, Literal

from pydantic import BaseModel, Field


LLMProvider = Literal["openai", "deepseek", "qwen", "custom"]
ImageProvider = Literal["none", "openai", "gemini", "custom"]
AudioProvider = Literal["custom"]


class LLMSettings(BaseModel):
    enabled: bool = False
    provider: LLMProvider = "custom"
    api_base_url: str = ""
    model: str = "deepseek-chat"
    api_key: str = ""
    timeout: int = Field(default=60, ge=5, le=300)


class ComfyUISettings(BaseModel):
    enabled: bool = False
    base_url: str = "http://127.0.0.1:8188"
    timeout: int = Field(default=60, ge=5, le=300)
    width: int = Field(default=512, ge=64, le=2048)
    height: int = Field(default=512, ge=64, le=2048)
    steps: int = Field(default=20, ge=1, le=100)
    cfg: float = Field(default=7.0, ge=1.0, le=30.0)
    seed: int = Field(default=-1, ge=-1)
    workflow: Dict[str, Any] = Field(default_factory=dict)
    positive_prompt_node_id: str = ""
    negative_prompt_node_id: str = ""
    sampler_node_id: str = ""
    latent_node_id: str = ""
    audio_workflows: Dict[str, "ComfyUIAudioWorkflowProfile"] = Field(
        default_factory=lambda: {
            "music": ComfyUIAudioWorkflowProfile(),
            "sfx": ComfyUIAudioWorkflowProfile(),
        }
    )


class ComfyUIAudioWorkflowProfile(BaseModel):
    enabled: bool = False
    workflow: Dict[str, Any] = Field(default_factory=dict)
    prompt_node_id: str = ""
    prompt_input_name: str = "text"
    negative_prompt_node_id: str = ""
    negative_prompt_input_name: str = "text"
    seed_node_id: str = ""
    seed_input_name: str = "seed"
    duration_node_id: str = ""
    duration_input_name: str = "duration"
    output_kind: Literal["audio", "file"] = "audio"


class ImageProviderSettings(BaseModel):
    enabled: bool = False
    provider: ImageProvider = "none"
    api_base_url: str = ""
    model: str = ""
    api_key: str = ""
    timeout: int = Field(default=60, ge=5, le=300)


class AudioProviderSettings(BaseModel):
    enabled: bool = False
    provider: AudioProvider = "custom"
    api_base_url: str = ""
    model: str = ""
    api_key: str = ""
    timeout: int = Field(default=120, ge=5, le=600)


class StorageSettings(BaseModel):
    data_root: str = ""


class LocalSettings(BaseModel):
    llm: LLMSettings = Field(default_factory=LLMSettings)
    comfyui: ComfyUISettings = Field(default_factory=ComfyUISettings)
    image_provider: ImageProviderSettings = Field(default_factory=ImageProviderSettings)
    audio_provider: AudioProviderSettings = Field(default_factory=AudioProviderSettings)
    storage: StorageSettings = Field(default_factory=StorageSettings)


class SecretState(BaseModel):
    configured: bool
    preview: str = ""


class LLMSettingsPublic(BaseModel):
    enabled: bool
    provider: LLMProvider
    api_base_url: str
    model: str
    timeout: int
    api_key: SecretState


class ImageProviderSettingsPublic(BaseModel):
    enabled: bool
    provider: ImageProvider
    api_base_url: str
    model: str
    timeout: int
    api_key: SecretState


class AudioProviderSettingsPublic(BaseModel):
    enabled: bool
    provider: AudioProvider
    api_base_url: str
    model: str
    timeout: int
    api_key: SecretState


class LocalSettingsPublic(BaseModel):
    llm: LLMSettingsPublic
    comfyui: ComfyUISettings
    image_provider: ImageProviderSettingsPublic
    audio_provider: AudioProviderSettingsPublic
    storage: StorageSettings
    default_data_root: str
    active_data_root: str
    storage_env_override: bool


class LLMSettingsUpdate(BaseModel):
    enabled: bool
    provider: LLMProvider
    api_base_url: str = ""
    model: str = "deepseek-chat"
    api_key: str = ""
    keep_existing_api_key: bool = True
    timeout: int = Field(default=60, ge=5, le=300)


class ImageProviderSettingsUpdate(BaseModel):
    enabled: bool = False
    provider: ImageProvider = "none"
    api_base_url: str = ""
    model: str = ""
    api_key: str = ""
    keep_existing_api_key: bool = True
    timeout: int = Field(default=60, ge=5, le=300)


class AudioProviderSettingsUpdate(BaseModel):
    enabled: bool = False
    provider: AudioProvider = "custom"
    api_base_url: str = ""
    model: str = ""
    api_key: str = ""
    keep_existing_api_key: bool = True
    timeout: int = Field(default=120, ge=5, le=600)


class LocalSettingsUpdate(BaseModel):
    llm: LLMSettingsUpdate
    comfyui: ComfyUISettings
    image_provider: ImageProviderSettingsUpdate = Field(default_factory=ImageProviderSettingsUpdate)
    audio_provider: AudioProviderSettingsUpdate = Field(default_factory=AudioProviderSettingsUpdate)
    storage: StorageSettings = Field(default_factory=StorageSettings)


class ConnectionTestResponse(BaseModel):
    ok: bool
    message: str
