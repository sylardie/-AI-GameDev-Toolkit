import { useState } from "react";
import { generateDesign } from "../api/designApi";

const exampleIdea = "海边灯塔少女孵化星球的治愈放置游戏";

const templateOptions = [
    { value: "general", label: "通用游戏" },
    { value: "idle", label: "放置游戏" },
    { value: "rpg", label: "RPG" },
    { value: "card", label: "卡牌游戏" },
    { value: "roguelike", label: "Roguelike" },
    { value: "simulation", label: "经营模拟" },
    { value: "tower_defense", label: "塔防" },
    { value: "action_2d", label: "2D 动作" },
  ];

function DesignGeneratorPage() {
  const [idea, setIdea] = useState(exampleIdea);
  const [template, setTemplate] = useState("idle");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("gdd");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const design = result?.data;

  async function handleGenerate() {
    if (!idea.trim()) {
      setError("请先输入游戏想法。");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await generateDesign(idea.trim(), template);
      setResult(data);
      setActiveTab("gdd");
    } catch (err) {
      setError(err.message || "生成失败。");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyJson() {
    if (!result) return;

    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    alert("JSON 已复制到剪贴板。");
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

        <div className="form-grid">
            <label className="form-field">
            <span>游戏类型模板</span>
            <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
            >
                {templateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
                ))}
            </select>
            </label>
        </div>

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
            onClick={() => {
                setIdea(exampleIdea);
                setTemplate("idle");
              }}
            disabled={loading}
          >
            填入示例
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
      </section>

      {result && design && (
        <section className="panel">
          <div className="output-meta">
            <div>
                <strong>Template：</strong>
                <span>{design.template}</span>
            </div>
            <div>
              <strong>Output ID：</strong>
              <span>{result.output_id}</span>
            </div>
            <div>
              <strong>JSON：</strong>
              <span>{result.json_path}</span>
            </div>
            <div>
              <strong>Markdown：</strong>
              <span>{result.markdown_path}</span>
            </div>
          </div>

          <div className="result-header">
            <div>
              <h2>{design.title}</h2>
              <p>{design.pitch}</p>
            </div>
            <div className="genre-list">
              {design.genre.map((item) => (
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

          <div className="action-row compact">
            <button className="secondary-button" onClick={handleCopyJson}>
              复制完整 JSON
            </button>
          </div>

          {activeTab === "gdd" && <GddView result={design} />}
          {activeTab === "systems" && <SystemsView systems={design.systems} />}
          {activeTab === "tables" && <TablesView result={design} />}
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
        <h3>目标用户</h3>
        <p>{result.target_audience}</p>
  
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
          title="Systems"
          columns={["id", "name", "category", "description"]}
          rows={result.systems}
        />
  
        <DataTable
          title="Resources"
          columns={["id", "name", "resource_type", "description"]}
          rows={result.resources}
        />
  
        <DataTable
          title="Items"
          columns={["id", "name", "item_type", "category", "effect", "properties"]}
          rows={result.items}
        />
  
        <DataTable
          title="Entities"
          columns={["id", "name", "entity_type", "category", "rarity", "description", "properties"]}
          rows={result.entities}
        />
  
        <DataTable
          title="Progression"
          columns={["id", "name", "progression_type", "order", "requirement", "unlocks", "description"]}
          rows={result.progression}
        />
  
        <DataTable
          title="Tasks"
          columns={["id", "name", "task_type", "objective", "reward", "unlock_condition"]}
          rows={result.tasks}
        />
  
        <DataTable
          title="Levels"
          columns={["id", "name", "level_type", "order", "goal", "unlock_condition", "description"]}
          rows={result.levels}
        />
  
        <DataTable
          title="Balance Notes"
          columns={["target", "note"]}
          rows={result.balance_notes}
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
                  <td key={column}>{formatCellValue(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function formatCellValue(value) {
    if (value === null || value === undefined) {
      return "";
    }
  
    if (Array.isArray(value)) {
      return value.join(", ");
    }
  
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
  
    return String(value);
  }

function JsonView({ result }) {
  return (
    <pre className="json-view">{JSON.stringify(result, null, 2)}</pre>
  );
}

export default DesignGeneratorPage;