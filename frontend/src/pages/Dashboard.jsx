function Dashboard() {
    return (
      <div className="page">
        <section className="hero-card">
          <div>
            <div className="eyebrow">Portfolio Project</div>
            <h1>AI GameDev Toolkit</h1>
            <p>
              一个面向游戏开发者的 AI 辅助研发工具箱，覆盖策划生成、代码理解、
              美术资源生产三个核心流程。
            </p>
          </div>
        </section>
  
        <section className="module-grid">
          <ModuleCard
            title="Design Generator"
            tag="Phase 1"
            description="从一句玩法想法生成 GDD、系统拆解、资源表、道具表和配置 JSON。"
          />
          <ModuleCard
            title="Code Agent"
            tag="Phase 2"
            description="扫描 Godot / Unity 项目结构，辅助代码问答、报错分析和修改建议。"
          />
          <ModuleCard
            title="Art Pipeline"
            tag="Phase 3"
            description="生成 ComfyUI 提示词、素材命名规范和 Godot / Unity 导入说明。"
          />
        </section>
  
        <section className="panel">
          <h2>推荐工作流</h2>
          <div className="workflow">
            <WorkflowStep index="01" title="输入游戏想法" />
            <WorkflowStep index="02" title="生成策划文档与配置表" />
            <WorkflowStep index="03" title="生成角色 / 道具 / 场景提示词" />
            <WorkflowStep index="04" title="扫描项目并生成代码实现建议" />
          </div>
        </section>
      </div>
    );
  }
  
  function ModuleCard({ title, tag, description }) {
    return (
      <div className="module-card">
        <div className="module-header">
          <h3>{title}</h3>
          <span>{tag}</span>
        </div>
        <p>{description}</p>
      </div>
    );
  }
  
  function WorkflowStep({ index, title }) {
    return (
      <div className="workflow-step">
        <div className="workflow-index">{index}</div>
        <div>{title}</div>
      </div>
    );
  }
  
  export default Dashboard;