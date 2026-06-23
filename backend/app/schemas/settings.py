from typing import Literal

from pydantic import BaseModel, Field


LLMProvider = Literal["openai", "deepseek", "qwen", "custom"]
ImageProvider = Literal["none", "openai", "gemini", "custom"]


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


class ImageProviderSettings(BaseModel):
    enabled: bool = False
    provider: ImageProvider = "none"
    api_base_url: str = ""
    model: str = ""
    api_key: str = ""
    timeout: int = Field(default=60, ge=5, le=300)


class LocalSettings(BaseModel):
    llm: LLMSettings = Field(default_factory=LLMSettings)
    comfyui: ComfyUISettings = Field(default_factory=ComfyUISettings)
    image_provider: ImageProviderSettings = Field(default_factory=ImageProviderSettings)


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


class LocalSettingsPublic(BaseModel):
    llm: LLMSettingsPublic
    comfyui: ComfyUISettings
    image_provider: ImageProviderSettingsPublic


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


class LocalSettingsUpdate(BaseModel):
    llm: LLMSettingsUpdate
    comfyui: ComfyUISettings
    image_provider: ImageProviderSettingsUpdate = Field(default_factory=ImageProviderSettingsUpdate)


class ConnectionTestResponse(BaseModel):
    ok: bool
    message: str
