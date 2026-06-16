from pydantic import BaseModel, Field
from typing import List


class DesignGenerateRequest(BaseModel):
    idea: str = Field(..., min_length=2, description="用户输入的游戏想法")


class ResourceItem(BaseModel):
    id: str
    name: str
    type: str
    description: str


class GameItem(BaseModel):
    id: str
    name: str
    category: str
    effect: str


class SystemItem(BaseModel):
    name: str
    description: str


class DesignGenerateResponse(BaseModel):
    title: str
    genre: List[str]
    pitch: str
    core_loop: List[str]
    systems: List[SystemItem]
    resources: List[ResourceItem]
    items: List[GameItem]