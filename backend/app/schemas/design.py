from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class DesignGenerateRequest(BaseModel):
    idea: str = Field(..., min_length=2, description="用户输入的游戏想法")
    template: str = Field(default="general", description="游戏类型模板")

class SystemItem(BaseModel):
    id: str
    name: str
    category: str
    description: str


class ResourceItem(BaseModel):
    id: str
    name: str
    resource_type: str
    description: str


class GameItem(BaseModel):
    id: str
    name: str
    item_type: str
    category: str
    effect: str
    properties: Dict[str, Any] = Field(default_factory=dict)


class EntityItem(BaseModel):
    id: str
    name: str
    entity_type: str
    category: str
    rarity: Optional[str] = None
    description: str
    properties: Dict[str, Any] = Field(default_factory=dict)


class ProgressionItem(BaseModel):
    id: str
    name: str
    progression_type: str
    order: int
    requirement: str
    unlocks: List[str] = Field(default_factory=list)
    description: str


class TaskItem(BaseModel):
    id: str
    name: str
    task_type: str
    objective: str
    reward: str
    unlock_condition: str


class LevelItem(BaseModel):
    id: str
    name: str
    level_type: str
    order: int
    goal: str
    unlock_condition: str
    description: str


class BalanceNote(BaseModel):
    target: str
    note: str


class DesignData(BaseModel):
    title: str
    template: str
    genre: List[str]
    target_audience: str
    pitch: str
    core_loop: List[str]
    systems: List[SystemItem]
    resources: List[ResourceItem]
    items: List[GameItem]
    entities: List[EntityItem]
    progression: List[ProgressionItem]
    tasks: List[TaskItem]
    levels: List[LevelItem]
    balance_notes: List[BalanceNote]


class DesignGenerateResponse(BaseModel):
    output_id: str
    json_path: str
    markdown_path: str
    data: DesignData