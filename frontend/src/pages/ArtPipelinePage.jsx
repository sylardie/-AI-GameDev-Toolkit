function ArtPipelinePage() {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">Phase 3</div>
            <h1>Art Pipeline</h1>
            <p>游戏美术生产管线。后续将支持提示词生成、ComfyUI workflow、资源导入说明。</p>
          </div>
        </div>
  
        <section className="panel">
          <h2>即将实现</h2>
          <div className="todo-list">
            <div>输入角色 / 道具 / 场景设定</div>
            <div>生成 Positive / Negative Prompt</div>
            <div>生成风格标签与命名规范</div>
            <div>接入 ComfyUI API</div>
            <div>生成 Godot / Unity 导入说明</div>
          </div>
        </section>
      </div>
    );
  }
  
  export default ArtPipelinePage;