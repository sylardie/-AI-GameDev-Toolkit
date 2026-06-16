from app.schemas.design import (
    BalanceNote,
    DesignData,
    EntityItem,
    GameItem,
    LevelItem,
    ProgressionItem,
    ResourceItem,
    SystemItem,
    TaskItem,
)


TEMPLATE_LABELS = {
    "general": "通用游戏",
    "idle": "放置游戏",
    "rpg": "RPG",
    "card": "卡牌游戏",
    "roguelike": "Roguelike",
    "simulation": "经营模拟",
    "tower_defense": "塔防",
    "action_2d": "2D 动作",
}


def generate_mock_design(idea: str, template: str = "general") -> DesignData:
    """
    Phase 1 mock generator with template support.

    The schema is generic. Different templates only change the generated content.
    Later this will be replaced by a real LLM workflow.
    """
    template = normalize_template(template)

    if template == "idle":
        return generate_idle_mock(idea, template)

    if template == "rpg":
        return generate_rpg_mock(idea, template)

    if template == "card":
        return generate_card_mock(idea, template)

    if template == "roguelike":
        return generate_roguelike_mock(idea, template)

    if template == "simulation":
        return generate_simulation_mock(idea, template)

    if template == "tower_defense":
        return generate_tower_defense_mock(idea, template)

    if template == "action_2d":
        return generate_action_2d_mock(idea, template)

    return generate_general_mock(idea, template)


def normalize_template(template: str) -> str:
    if template in TEMPLATE_LABELS:
        return template

    return "general"


def base_resources() -> list[ResourceItem]:
    return [
        ResourceItem(
            id="res_soft_currency",
            name="基础货币",
            resource_type="currency",
            description="用于基础升级、购买常规道具和推进核心循环的通用货币。",
        ),
        ResourceItem(
            id="res_premium",
            name="稀有资源",
            resource_type="premium",
            description="用于高级解锁、加速或稀有内容兑换的高价值资源。",
        ),
        ResourceItem(
            id="res_material",
            name="通用材料",
            resource_type="material",
            description="用于制造、强化、升级或任务提交的基础材料。",
        ),
    ]


def generate_general_mock(idea: str, template: str) -> DesignData:
    return DesignData(
        title="未命名游戏方案",
        template=template,
        genre=["通用", "可扩展"],
        target_audience="希望体验清晰目标、稳定成长和轻量策略选择的玩家。",
        pitch=f"基于「{idea}」生成的通用游戏方案。该方案保留较高扩展性，可继续细化为 RPG、放置、卡牌、经营等具体方向。",
        core_loop=[
            "玩家进入主要玩法场景",
            "完成核心操作并获得资源",
            "使用资源强化能力或解锁内容",
            "挑战更高目标或进入新区域",
            "通过长期成长形成持续追求",
        ],
        systems=[
            SystemItem(
                id="system_core",
                name="核心玩法系统",
                category="core",
                description="承载玩家最频繁操作和主要乐趣来源的系统。",
            ),
            SystemItem(
                id="system_growth",
                name="成长系统",
                category="progression",
                description="提供等级、解锁、强化或收集等长期成长目标。",
            ),
            SystemItem(
                id="system_reward",
                name="奖励系统",
                category="economy",
                description="定义玩家完成行为后的资源、道具和内容反馈。",
            ),
        ],
        resources=base_resources(),
        items=[
            GameItem(
                id="item_basic_boost",
                name="基础强化道具",
                item_type="consumable",
                category="boost",
                effect="临时提升核心玩法效率。",
                properties={"duration": 60, "bonus": "10%"},
            )
        ],
        entities=[
            EntityItem(
                id="entity_player_unit",
                name="玩家单位",
                entity_type="player",
                category="character",
                rarity=None,
                description="玩家主要控制或培养的核心对象。",
                properties={"role": "main"},
            ),
            EntityItem(
                id="entity_target",
                name="目标对象",
                entity_type="target",
                category="objective",
                rarity=None,
                description="玩家需要互动、击败、收集或完成的主要目标。",
                properties={},
            ),
        ],
        progression=[
            ProgressionItem(
                id="prog_001",
                name="初始解锁",
                progression_type="feature_unlock",
                order=1,
                requirement="game_start",
                unlocks=["system_core"],
                description="进入游戏后立即解锁核心玩法。",
            ),
            ProgressionItem(
                id="prog_002",
                name="进阶目标",
                progression_type="milestone",
                order=2,
                requirement="complete first task",
                unlocks=["system_growth"],
                description="玩家完成第一轮核心循环后解锁成长系统。",
            ),
        ],
        tasks=[
            TaskItem(
                id="task_001",
                name="完成第一次核心操作",
                task_type="tutorial",
                objective="完成一次核心玩法行为。",
                reward="res_soft_currency x 100",
                unlock_condition="game_start",
            )
        ],
        levels=[
            LevelItem(
                id="level_001",
                name="初始区域",
                level_type="stage",
                order=1,
                goal="让玩家理解核心操作和奖励反馈。",
                unlock_condition="game_start",
                description="低压力的新手区域，用于教学和建立第一轮正反馈。",
            )
        ],
        balance_notes=[
            BalanceNote(
                target="first_session",
                note="第一轮完整正反馈建议控制在 1 分钟内。",
            ),
            BalanceNote(
                target="economy",
                note="基础货币应保证稳定获得，稀有资源应控制投放节奏。",
            ),
        ],
    )


def generate_idle_mock(idea: str, template: str) -> DesignData:
    return DesignData(
        title="放置养成游戏方案",
        template=template,
        genre=["放置", "养成", "轻策略"],
        target_audience="喜欢低压力、离线收益、收集养成和长期成长的玩家。",
        pitch=f"基于「{idea}」生成的放置游戏方案。玩家通过收集对象、放入生产或养成系统、等待产出并持续升级来获得长期成长。",
        core_loop=[
            "获得生产对象或养成对象",
            "放入生产槽位或养成槽位",
            "等待产出或通过互动加速",
            "收获资源并升级设施",
            "解锁更高阶对象、区域和自动化能力",
        ],
        systems=[
            SystemItem(
                id="system_collection",
                name="收集系统",
                category="core",
                description="玩家通过抽取、探索、掉落或任务获得新的生产对象。",
            ),
            SystemItem(
                id="system_idle_output",
                name="离线收益系统",
                category="core",
                description="玩家离线期间持续累积资源，回归时获得结算反馈。",
            ),
            SystemItem(
                id="system_upgrade",
                name="设施升级系统",
                category="progression",
                description="玩家通过资源升级生产效率、容量和自动化能力。",
            ),
        ],
        resources=base_resources(),
        items=[
            GameItem(
                id="item_speedup",
                name="加速券",
                item_type="consumable",
                category="speedup",
                effect="立即减少一段生产或养成等待时间。",
                properties={"reduce_seconds": 300},
            ),
            GameItem(
                id="item_auto_collector",
                name="自动收集器",
                item_type="facility",
                category="automation",
                effect="自动收集已完成的产出。",
                properties={"unlock_level": 3},
            ),
        ],
        entities=[
            EntityItem(
                id="entity_generator_001",
                name="基础生产单元",
                entity_type="producer",
                category="facility",
                rarity="common",
                description="早期主要产出基础货币的生产对象。",
                properties={"output_resource": "res_soft_currency", "output_per_minute": 10},
            ),
            EntityItem(
                id="entity_generator_002",
                name="稀有生产单元",
                entity_type="producer",
                category="facility",
                rarity="rare",
                description="较低频率产出稀有资源的高级生产对象。",
                properties={"output_resource": "res_premium", "output_per_hour": 1},
            ),
        ],
        progression=[
            ProgressionItem(
                id="prog_idle_001",
                name="解锁第二槽位",
                progression_type="slot_unlock",
                order=1,
                requirement="res_soft_currency >= 100",
                unlocks=["slot_2"],
                description="玩家可以同时培养或生产两个对象。",
            ),
            ProgressionItem(
                id="prog_idle_002",
                name="解锁离线收益",
                progression_type="feature_unlock",
                order=2,
                requirement="complete task_idle_002",
                unlocks=["offline_reward"],
                description="玩家离线后也可以获得基础产出。",
            ),
        ],
        tasks=[
            TaskItem(
                id="task_idle_001",
                name="第一次收获",
                task_type="tutorial",
                objective="完成一次生产并领取奖励。",
                reward="res_soft_currency x 50",
                unlock_condition="game_start",
            ),
            TaskItem(
                id="task_idle_002",
                name="升级生产设施",
                task_type="progression",
                objective="将任意生产设施提升到 2 级。",
                reward="item_speedup x 1",
                unlock_condition="task_idle_001_completed",
            ),
        ],
        levels=[
            LevelItem(
                id="level_idle_001",
                name="初始生产区",
                level_type="area",
                order=1,
                goal="教学生产、收获和升级。",
                unlock_condition="game_start",
                description="提供基础资源和初始生产对象的区域。",
            )
        ],
        balance_notes=[
            BalanceNote(
                target="offline_reward",
                note="离线收益上限建议从 2 小时开始，后续通过升级扩展。",
            ),
            BalanceNote(
                target="first_upgrade",
                note="第一次升级应在 2 到 3 分钟内完成。",
            ),
        ],
    )


def generate_rpg_mock(idea: str, template: str) -> DesignData:
    return DesignData(
        title="RPG 游戏方案",
        template=template,
        genre=["RPG", "冒险", "成长"],
        target_audience="喜欢角色成长、装备收集、剧情推进和关卡挑战的玩家。",
        pitch=f"基于「{idea}」生成的 RPG 方案。玩家培养角色、获得装备、挑战敌人并推进章节区域。",
        core_loop=[
            "进入关卡或区域",
            "遭遇敌人并进行战斗",
            "获得经验、金币和装备",
            "强化角色、技能和装备",
            "挑战更高难度区域或 Boss",
        ],
        systems=[
            SystemItem(
                id="system_battle",
                name="战斗系统",
                category="core",
                description="玩家通过角色属性、技能和装备配置击败敌人。",
            ),
            SystemItem(
                id="system_character_growth",
                name="角色成长系统",
                category="progression",
                description="角色通过经验、等级、技能点和装备提升战斗能力。",
            ),
            SystemItem(
                id="system_equipment",
                name="装备系统",
                category="collection",
                description="装备提供属性、词条和构筑差异。",
            ),
        ],
        resources=base_resources(),
        items=[
            GameItem(
                id="item_sword_001",
                name="训练长剑",
                item_type="equipment",
                category="weapon",
                effect="提升角色攻击力。",
                properties={"attack": 8, "slot": "weapon"},
            ),
            GameItem(
                id="item_potion_001",
                name="小型治疗药水",
                item_type="consumable",
                category="healing",
                effect="恢复少量生命值。",
                properties={"heal": 50},
            ),
        ],
        entities=[
            EntityItem(
                id="entity_hero_001",
                name="新手冒险者",
                entity_type="player_character",
                category="hero",
                rarity="common",
                description="基础可操作角色，属性均衡。",
                properties={"hp": 120, "attack": 12, "defense": 5},
            ),
            EntityItem(
                id="entity_enemy_001",
                name="森林史莱姆",
                entity_type="enemy",
                category="monster",
                rarity="common",
                description="新手区域常见敌人。",
                properties={"hp": 40, "attack": 5, "drop": "res_soft_currency"},
            ),
            EntityItem(
                id="entity_boss_001",
                name="古树守卫",
                entity_type="boss",
                category="monster",
                rarity="rare",
                description="第一章区域 Boss，考验玩家基础成长。",
                properties={"hp": 500, "attack": 25, "weakness": "fire"},
            ),
        ],
        progression=[
            ProgressionItem(
                id="prog_rpg_001",
                name="角色等级 2",
                progression_type="character_level",
                order=1,
                requirement="exp >= 100",
                unlocks=["skill_power_strike"],
                description="解锁第一个主动技能。",
            ),
            ProgressionItem(
                id="prog_rpg_002",
                name="装备强化",
                progression_type="feature_unlock",
                order=2,
                requirement="complete task_rpg_002",
                unlocks=["equipment_upgrade"],
                description="允许玩家消耗材料强化装备。",
            ),
        ],
        tasks=[
            TaskItem(
                id="task_rpg_001",
                name="第一次战斗",
                task_type="tutorial",
                objective="击败 3 个普通敌人。",
                reward="res_soft_currency x 100",
                unlock_condition="game_start",
            ),
            TaskItem(
                id="task_rpg_002",
                name="挑战小队长",
                task_type="main",
                objective="击败新手区域精英敌人。",
                reward="item_sword_001",
                unlock_condition="task_rpg_001_completed",
            ),
        ],
        levels=[
            LevelItem(
                id="level_rpg_001",
                name="新手森林",
                level_type="area",
                order=1,
                goal="教学移动、战斗、掉落和升级。",
                unlock_condition="game_start",
                description="包含普通敌人、基础宝箱和一个小型 Boss。",
            ),
            LevelItem(
                id="level_rpg_002",
                name="古树遗迹",
                level_type="dungeon",
                order=2,
                goal="引入装备强化和元素弱点。",
                unlock_condition="task_rpg_002_completed",
                description="第一章正式副本区域。",
            ),
        ],
        balance_notes=[
            BalanceNote(
                target="battle",
                note="新手战斗应控制在 20 到 40 秒内，避免前期节奏过慢。",
            ),
            BalanceNote(
                target="equipment",
                note="早期装备差异不宜过大，避免数值膨胀。",
            ),
        ],
    )


def generate_card_mock(idea: str, template: str) -> DesignData:
    return DesignData(
        title="卡牌游戏方案",
        template=template,
        genre=["卡牌", "策略", "构筑"],
        target_audience="喜欢构筑组合、策略选择和局内资源规划的玩家。",
        pitch=f"基于「{idea}」生成的卡牌游戏方案。玩家通过卡组构筑、费用管理和效果联动完成对局目标。",
        core_loop=[
            "选择或编辑卡组",
            "进入对局并抽取手牌",
            "消耗费用打出卡牌",
            "通过伤害、防御、增益或特殊机制推进胜利",
            "获得新卡牌并优化构筑",
        ],
        systems=[
            SystemItem(
                id="system_deck",
                name="卡组系统",
                category="core",
                description="玩家围绕卡牌费用、类型和联动效果构建卡组。",
            ),
            SystemItem(
                id="system_battle_card",
                name="卡牌战斗系统",
                category="core",
                description="玩家每回合抽牌、获得费用并打出卡牌解决敌人或目标。",
            ),
            SystemItem(
                id="system_card_pool",
                name="卡池系统",
                category="collection",
                description="定义卡牌获取、稀有度和构筑方向。",
            ),
        ],
        resources=[
            ResourceItem(
                id="res_energy",
                name="费用",
                resource_type="turn_resource",
                description="每回合用于打出卡牌的临时资源。",
            ),
            ResourceItem(
                id="res_gold",
                name="金币",
                resource_type="currency",
                description="用于购买卡牌、移除卡牌或升级卡牌。",
            ),
            ResourceItem(
                id="res_card_shard",
                name="卡牌碎片",
                resource_type="material",
                description="用于解锁或升级指定卡牌。",
            ),
        ],
        items=[
            GameItem(
                id="item_relic_001",
                name="战术徽记",
                item_type="relic",
                category="passive",
                effect="每场战斗开始时额外抽 1 张牌。",
                properties={"draw_bonus": 1},
            )
        ],
        entities=[
            EntityItem(
                id="card_attack_001",
                name="快速打击",
                entity_type="card",
                category="attack",
                rarity="common",
                description="低费用攻击卡。",
                properties={"cost": 1, "damage": 6},
            ),
            EntityItem(
                id="card_defense_001",
                name="架势防御",
                entity_type="card",
                category="defense",
                rarity="common",
                description="获得护甲并保留少量费用。",
                properties={"cost": 1, "block": 5},
            ),
            EntityItem(
                id="enemy_card_001",
                name="训练假人",
                entity_type="enemy",
                category="tutorial_enemy",
                rarity="common",
                description="用于教学卡牌战斗流程的低威胁敌人。",
                properties={"hp": 30, "intent": "attack"},
            ),
        ],
        progression=[
            ProgressionItem(
                id="prog_card_001",
                name="解锁基础卡包",
                progression_type="card_pool_unlock",
                order=1,
                requirement="complete first battle",
                unlocks=["basic_card_pack"],
                description="完成首次对局后解锁基础卡包。",
            )
        ],
        tasks=[
            TaskItem(
                id="task_card_001",
                name="赢得第一场对局",
                task_type="tutorial",
                objective="使用基础卡组击败训练敌人。",
                reward="res_gold x 50",
                unlock_condition="game_start",
            )
        ],
        levels=[
            LevelItem(
                id="level_card_001",
                name="教学对局",
                level_type="battle",
                order=1,
                goal="教学抽牌、费用、出牌和回合结束。",
                unlock_condition="game_start",
                description="低难度教学战斗。",
            )
        ],
        balance_notes=[
            BalanceNote(
                target="card_cost",
                note="早期卡牌费用以 0 到 2 为主，方便玩家理解费用规划。",
            ),
            BalanceNote(
                target="deck_size",
                note="初始卡组不宜超过 10 到 12 张，降低理解成本。",
            ),
        ],
    )


def generate_roguelike_mock(idea: str, template: str) -> DesignData:
    data = generate_card_mock(idea, template)
    data.title = "Roguelike 构筑游戏方案"
    data.genre = ["Roguelike", "构筑", "随机事件"]
    data.target_audience = "喜欢随机性、Build 构筑、短局体验和失败后成长的玩家。"
    data.pitch = f"基于「{idea}」生成的 Roguelike 方案。玩家在单局中通过随机事件、奖励选择和构筑组合形成不同路线。"
    data.systems.append(
        SystemItem(
            id="system_random_event",
            name="随机事件系统",
            category="roguelike",
            description="玩家在路线中遇到随机事件，获得奖励、风险或构筑变化。",
        )
    )
    data.entities.append(
        EntityItem(
            id="entity_relic_001",
            name="回响核心",
            entity_type="relic",
            category="build_modifier",
            rarity="rare",
            description="改变玩家核心构筑方向的遗物。",
            properties={"effect": "first_card_each_turn_cost_minus_1"},
        )
    )
    data.levels.append(
        LevelItem(
            id="level_rogue_002",
            name="随机事件节点",
            level_type="event_node",
            order=2,
            goal="提供构筑选择和风险收益判断。",
            unlock_condition="after_first_battle",
            description="玩家从多个事件结果中选择一个。",
        )
    )
    data.balance_notes.append(
        BalanceNote(
            target="run_length",
            note="MVP 单局时长建议控制在 8 到 15 分钟。",
        )
    )
    return data


def generate_simulation_mock(idea: str, template: str) -> DesignData:
    return DesignData(
        title="经营模拟游戏方案",
        template=template,
        genre=["经营模拟", "养成", "资源管理"],
        target_audience="喜欢规划布局、资源分配、效率优化和渐进扩张的玩家。",
        pitch=f"基于「{idea}」生成的经营模拟方案。玩家管理设施、员工、顾客和商品，通过收益循环扩展经营规模。",
        core_loop=[
            "接待顾客或处理订单",
            "分配员工与设施完成生产",
            "获得金币、评价和材料",
            "升级设施、雇佣员工或解锁新商品",
            "扩展店铺区域和经营规模",
        ],
        systems=[
            SystemItem(
                id="system_order",
                name="订单系统",
                category="core",
                description="顾客产生订单需求，玩家通过设施和员工完成订单。",
            ),
            SystemItem(
                id="system_staff",
                name="员工系统",
                category="management",
                description="员工拥有不同效率、技能和岗位适配。",
            ),
            SystemItem(
                id="system_facility",
                name="设施系统",
                category="progression",
                description="设施决定生产能力、容量和自动化水平。",
            ),
        ],
        resources=base_resources(),
        items=[
            GameItem(
                id="item_recipe_001",
                name="基础商品配方",
                item_type="recipe",
                category="production",
                effect="解锁一个基础商品。",
                properties={"product": "basic_product"},
            )
        ],
        entities=[
            EntityItem(
                id="entity_customer_001",
                name="普通顾客",
                entity_type="customer",
                category="visitor",
                rarity="common",
                description="基础顾客，需求简单，等待时间较长。",
                properties={"patience": 60, "base_tip": 5},
            ),
            EntityItem(
                id="entity_staff_001",
                name="新手员工",
                entity_type="staff",
                category="worker",
                rarity="common",
                description="基础员工，适合执行普通生产任务。",
                properties={"speed": 1.0, "skill": "basic"},
            ),
        ],
        progression=[
            ProgressionItem(
                id="prog_sim_001",
                name="解锁第二工作台",
                progression_type="facility_unlock",
                order=1,
                requirement="res_soft_currency >= 200",
                unlocks=["workbench_2"],
                description="提升同时处理订单的能力。",
            )
        ],
        tasks=[
            TaskItem(
                id="task_sim_001",
                name="完成第一份订单",
                task_type="tutorial",
                objective="成功完成 1 份顾客订单。",
                reward="res_soft_currency x 80",
                unlock_condition="game_start",
            )
        ],
        levels=[
            LevelItem(
                id="level_sim_001",
                name="小店起步",
                level_type="business_stage",
                order=1,
                goal="教学接单、生产、交付和收益。",
                unlock_condition="game_start",
                description="经营规模较小，适合学习基础循环。",
            )
        ],
        balance_notes=[
            BalanceNote(
                target="customer_waiting",
                note="新手顾客等待时间应足够宽松，避免早期挫败。",
            )
        ],
    )


def generate_tower_defense_mock(idea: str, template: str) -> DesignData:
    return DesignData(
        title="塔防游戏方案",
        template=template,
        genre=["塔防", "策略", "关卡"],
        target_audience="喜欢路线规划、防御塔搭配、波次挑战和策略布阵的玩家。",
        pitch=f"基于「{idea}」生成的塔防方案。玩家在地图上布置防御单位，抵御多波敌人并通过升级构建防线。",
        core_loop=[
            "进入关卡并观察敌人路线",
            "消耗资源建造防御塔",
            "抵御敌人波次并获得资源",
            "升级或调整防御布局",
            "完成关卡并解锁新塔和新敌人",
        ],
        systems=[
            SystemItem(
                id="system_tower_build",
                name="防御塔建造系统",
                category="core",
                description="玩家在可建造点位放置不同类型的防御塔。",
            ),
            SystemItem(
                id="system_wave",
                name="波次系统",
                category="core",
                description="关卡由多个敌人波次构成，逐步提高压力。",
            ),
            SystemItem(
                id="system_tower_upgrade",
                name="防御塔升级系统",
                category="progression",
                description="玩家在局内或局外强化防御塔能力。",
            ),
        ],
        resources=[
            ResourceItem(
                id="res_build_cost",
                name="建造点数",
                resource_type="battle_resource",
                description="局内用于建造和升级防御塔的资源。",
            ),
            ResourceItem(
                id="res_meta_currency",
                name="研发点",
                resource_type="meta_currency",
                description="局外用于解锁新防御塔和强化路线。",
            ),
        ],
        items=[],
        entities=[
            EntityItem(
                id="tower_basic_001",
                name="基础箭塔",
                entity_type="tower",
                category="single_target",
                rarity="common",
                description="攻击单个敌人的基础防御塔。",
                properties={"damage": 10, "range": 3, "attack_speed": 1.0},
            ),
            EntityItem(
                id="enemy_basic_001",
                name="普通入侵者",
                entity_type="enemy",
                category="ground",
                rarity="common",
                description="基础地面敌人。",
                properties={"hp": 50, "speed": 1.0, "reward": 5},
            ),
        ],
        progression=[
            ProgressionItem(
                id="prog_td_001",
                name="解锁范围塔",
                progression_type="tower_unlock",
                order=1,
                requirement="clear level_td_001",
                unlocks=["tower_aoe_001"],
                description="通关第一关后解锁范围伤害防御塔。",
            )
        ],
        tasks=[
            TaskItem(
                id="task_td_001",
                name="守住第一波",
                task_type="tutorial",
                objective="在第一关中成功抵御 3 波敌人。",
                reward="res_meta_currency x 50",
                unlock_condition="game_start",
            )
        ],
        levels=[
            LevelItem(
                id="level_td_001",
                name="草地入口",
                level_type="stage",
                order=1,
                goal="教学路线、防御塔建造和波次奖励。",
                unlock_condition="game_start",
                description="路线简单、敌人数量少的新手关卡。",
            )
        ],
        balance_notes=[
            BalanceNote(
                target="wave_curve",
                note="第一关前三波应逐步增加敌人数量，但避免同时引入过多敌人类型。",
            )
        ],
    )


def generate_action_2d_mock(idea: str, template: str) -> DesignData:
    return DesignData(
        title="2D 动作游戏方案",
        template=template,
        genre=["2D 动作", "关卡", "战斗"],
        target_audience="喜欢即时操作、角色动作、打击反馈和关卡挑战的玩家。",
        pitch=f"基于「{idea}」生成的 2D 动作游戏方案。玩家控制角色通过移动、攻击、闪避和技能击败敌人并推进关卡。",
        core_loop=[
            "进入横版关卡",
            "移动、跳跃、攻击并躲避敌人",
            "击败敌人获得资源或道具",
            "解锁技能和强化角色",
            "挑战更复杂关卡和 Boss",
        ],
        systems=[
            SystemItem(
                id="system_movement",
                name="移动系统",
                category="core",
                description="包含移动、跳跃、冲刺、受击和平台交互。",
            ),
            SystemItem(
                id="system_combat",
                name="动作战斗系统",
                category="core",
                description="包含普通攻击、技能、闪避、硬直和打击反馈。",
            ),
            SystemItem(
                id="system_stage",
                name="关卡系统",
                category="level",
                description="通过敌人配置、地形和机关形成挑战。",
            ),
        ],
        resources=base_resources(),
        items=[
            GameItem(
                id="item_skill_scroll",
                name="技能卷轴",
                item_type="unlock",
                category="skill",
                effect="解锁一个新的主动技能。",
                properties={"skill_id": "skill_dash_attack"},
            )
        ],
        entities=[
            EntityItem(
                id="entity_player_action",
                name="玩家角色",
                entity_type="player_character",
                category="hero",
                rarity=None,
                description="可移动、攻击、闪避的主控角色。",
                properties={"hp": 100, "attack": 10, "move_speed": 4.5},
            ),
            EntityItem(
                id="entity_enemy_action_001",
                name="巡逻敌人",
                entity_type="enemy",
                category="melee",
                rarity="common",
                description="在固定范围内巡逻并近战攻击玩家。",
                properties={"hp": 35, "attack": 8, "patrol_range": 5},
            ),
        ],
        progression=[
            ProgressionItem(
                id="prog_action_001",
                name="解锁冲刺攻击",
                progression_type="skill_unlock",
                order=1,
                requirement="clear level_action_001",
                unlocks=["skill_dash_attack"],
                description="玩家通关第一关后获得更高机动性的攻击方式。",
            )
        ],
        tasks=[
            TaskItem(
                id="task_action_001",
                name="完成基础训练",
                task_type="tutorial",
                objective="完成移动、跳跃、攻击和闪避教学。",
                reward="res_soft_currency x 50",
                unlock_condition="game_start",
            )
        ],
        levels=[
            LevelItem(
                id="level_action_001",
                name="训练海岸",
                level_type="stage",
                order=1,
                goal="教学基础移动和战斗。",
                unlock_condition="game_start",
                description="低难度横版关卡，包含少量敌人和基础平台。",
            )
        ],
        balance_notes=[
            BalanceNote(
                target="combat_feel",
                note="早期敌人攻击前摇要明显，给玩家足够反应时间。",
            )
        ],
    )