function SettingsPage() {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">Config</div>
            <h1>Settings</h1>
            <p>后续用于配置 LLM Provider、API Key、本地模型地址和 ComfyUI 地址。</p>
          </div>
        </div>
  
        <section className="panel">
          <h2>计划支持</h2>
          <div className="todo-list">
            <div>云模型 API：OpenAI / DeepSeek / Qwen / Gemini</div>
            <div>本地模型：Ollama / LM Studio</div>
            <div>ComfyUI 地址：http://127.0.0.1:8188</div>
            <div>输出目录配置</div>
            <div>Trace 日志开关</div>
          </div>
        </section>
      </div>
    );
  }
  
  export default SettingsPage;