function CodeAgentPage() {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">Phase 2</div>
            <h1>Code Agent</h1>
            <p>Godot / Unity 项目代码助手。下一阶段将支持项目扫描、代码搜索、报错分析。</p>
          </div>
        </div>
  
        <section className="panel">
          <h2>即将实现</h2>
          <div className="todo-list">
            <div>输入本地 Godot / Unity 项目路径</div>
            <div>识别项目类型</div>
            <div>扫描脚本、场景、资源</div>
            <div>代码搜索与文件摘要</div>
            <div>AI 报错分析与修改建议</div>
          </div>
        </section>
      </div>
    );
  }
  
  export default CodeAgentPage;