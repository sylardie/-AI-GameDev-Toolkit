import { useState } from "react";
import { generateDesign } from "../api/designApi";

const exampleIdea = "海边灯塔少女孵化星球的治愈放置游戏";

function DesignGeneratorPage() {
  const [idea, setIdea] = useState(exampleIdea);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("gdd");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!idea.trim()) {
      setError("请先输入游戏想法。");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await generateDesign(idea.trim());
      setResult(data);
      setActiveTab("gdd");
    } catch (err) {
      setError(err.message || "生成失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Phase 1</div>
          <h1>Design Generator</h1>
          <p>输入一句玩法想法，生成结构化 GDD、系统拆解和配置表预览。</p>
        </div>
      </div>

      <section className="panel">
        <h2>游戏想法</h2>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="例如：我想做一个海边灯塔少女孵化星球的治愈放置游戏"
          rows={5}
        />

        <div className="action-row">
          <button onClick={handleGenerate} disabled={loading}>
            {loading ? "生成中..." : "生成设计方案"}
          </button>
          <button
            className="secondary-button"
            onClick={() => setIdea(exampleIdea)}
            disabled={loading}
          >
            填入示例
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
      </section>

      {result && (
        <section className="panel">
          <div className="result-header">
            <div>
              <h2>{result.title}</h2>
              <p>{result.pitch}</p>
            </div>
            <div className="genre-list">
              {result.genre.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="tabs">
            <TabButton
              active={activeTab === "gdd"}
              onClick={() => setActiveTab("gdd")}
            >
              GDD 概览
            </TabButton>
            <TabButton
              active={activeTab === "systems"}
              onClick={() => setActiveTab("systems")}
            >
              系统拆解
            </TabButton>
            <TabButton
              active={activeTab === "tables"}
              onClick={() => setActiveTab("tables")}
            >
              配置表预览
            </TabButton>
            <TabButton
              active={activeTab === "json"}
              onClick={() => setActiveTab("json")}
            >
              JSON
            </TabButton>
          </div>

          {activeTab === "gdd" && <GddView result={result} />}
          {activeTab === "systems" && <SystemsView systems={result.systems} />}
          {activeTab === "tables" && <TablesView result={result} />}
          {activeTab === "json" && <JsonView result={result} />}
        </section>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button className={active ? "tab-button active" : "tab-button"} onClick={onClick}>
      {children}
    </button>
  );
}

function GddView({ result }) {
  return (
    <div className="result-block">
      <h3>核心循环</h3>
      <ol className="loop-list">
        {result.core_loop.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

function SystemsView({ systems }) {
  return (
    <div className="card-list">
      {systems.map((system) => (
        <div className="info-card" key={system.name}>
          <h3>{system.name}</h3>
          <p>{system.description}</p>
        </div>
      ))}
    </div>
  );
}

function TablesView({ result }) {
  return (
    <div className="tables-view">
      <DataTable
        title="Resources"
        columns={["id", "name", "type", "description"]}
        rows={result.resources}
      />

      <DataTable
        title="Items"
        columns={["id", "name", "category", "effect"]}
        rows={result.items}
      />
    </div>
  );
}

function DataTable({ title, columns, rows }) {
  return (
    <div className="table-wrap">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${title}-${index}`}>
              {columns.map((column) => (
                <td key={column}>{row[column]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JsonView({ result }) {
  return (
    <pre className="json-view">{JSON.stringify(result, null, 2)}</pre>
  );
}

export default DesignGeneratorPage;