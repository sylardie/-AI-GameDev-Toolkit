from app.schemas.design import (
    DesignGenerateResponse,
    SystemItem,
    ResourceItem,
    GameItem,
)


def generate_mock_design(idea: str) -> DesignGenerateResponse:
    """
    Phase 0 mock generator.
    Later this will be replaced by a real LLM workflow.
    """
    return DesignGenerateResponse(
        title="星屑温室",
        genre=["放置", "治愈", "轻探索"],
        pitch=f"基于「{idea}」生成的治愈系放置游戏。玩家在海边灯塔中打捞星球种子，并在温室中孵化微型星球。",
        core_loop=[
            "在夜海中打捞星球种子",
            "将种子放入温室生态仓",
            "通过浇水和施肥加速成长",
            "成熟星球产出资源",
            "使用资源升级灯塔和解锁新区域",
        ],
        systems=[
            SystemItem(
                name="打捞系统",
                description="玩家派遣小船在海面打捞星球种子、星尘和特殊道具。",
            ),
            SystemItem(
                name="温室孵化系统",
                description="星球种子在生态仓中经历多个成长阶段，最终成为成熟星球。",
            ),
            SystemItem(
                name="灯塔升级系统",
                description="灯塔等级决定可探索区域、温室容量和资源产出效率。",
            ),
        ],
        resources=[
            ResourceItem(
                id="stardust",
                name="星尘",
                type="currency",
                description="基础升级货币，用于灯塔和温室升级。",
            ),
            ResourceItem(
                id="stardew",
                name="星露",
                type="accelerator",
                description="用于加速星球成长的稀有资源。",
            ),
            ResourceItem(
                id="nutrient",
                name="养料",
                type="material",
                description="用于改变星球成长倾向的培养材料。",
            ),
        ],
        items=[
            GameItem(
                id="watering_can",
                name="星露壶",
                category="tool",
                effect="提升当前星球成长速度。",
            ),
            GameItem(
                id="telescope",
                name="观测望远镜",
                category="facility",
                effect="解锁夜海观测和更远区域。",
            ),
            GameItem(
                id="star_seed",
                name="星球种子",
                category="seed",
                effect="可放入生态仓孵化为微型星球。",
            ),
        ],
    )