import { useEffect, useState } from "react";

import { generateDesign, getDesignTemplates } from "../api/designApi";
import { downloadFile } from "../api/fileApi";
import { useI18n } from "../i18n/I18nContext";

function DesignGeneratorPage() {
  const { texts } = useI18n();
  const designText = texts.design;
  const [idea, setIdea] = useState(designText.exampleIdea);
  const [template, setTemplate] = useState("idle");
  const [templates, setTemplates] = useState([]);
  const [templateError, setTemplateError] = useState("");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("gdd");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const design = result?.data;

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await getDesignTemplates();
        setTemplates(data);
      } catch (err) {
        setTemplateError(err.message || designText.errors.templateLoad);
      }
    }

    loadTemplates();
  }, []);

  async function handleGenerate() {
    if (!idea.trim()) {
      setError(designText.errors.emptyIdea);
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
      setError(err.message || designText.errors.generate);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyJson() {
    if (!result) return;

    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">{texts.common.phase1}</div>
          <h1>{designText.title}</h1>
          <p>{designText.intro}</p>
        </div>
      </div>

      <section className="panel">
        <h2>{designText.ideaTitle}</h2>

        <div className="form-grid">
          <label className="form-field">
            <span>{designText.templateLabel}</span>
            <select value={template} onChange={(event) => setTemplate(event.target.value)}>
              {templates.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {templateError && <div className="small-error">{templateError}</div>}
            <TemplateHint templates={templates} template={template} />
          </label>
        </div>

        <textarea
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder={designText.placeholder}
          rows={5}
        />

        <div className="action-row">
          <button onClick={handleGenerate} disabled={loading}>
            {loading ? texts.common.generating : designText.generate}
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              setIdea(designText.exampleIdea);
              setTemplate("idle");
            }}
            disabled={loading}
          >
            {texts.common.fillExample}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
      </section>

      {result && design && (
        <section className="panel">
          <div className="output-meta">
            <div>
              <strong>{designText.meta.template} </strong>
              <span>{design.template}</span>
            </div>
            <div>
              <strong>{designText.meta.outputId} </strong>
              <span>{result.output_id}</span>
            </div>
            <div>
              <strong>JSON: </strong>
              <span>{result.json_path}</span>
            </div>
            <div>
              <strong>Markdown: </strong>
              <span>{result.markdown_path}</span>
            </div>
            <div>
              <strong>Excel: </strong>
              <span>{result.excel_path}</span>
            </div>
          </div>

          <div className="download-row">
            <button
              className="secondary-button"
              onClick={() => downloadFile(result.json_path)}
            >
              {designText.downloads.json}
            </button>

            <button
              className="secondary-button"
              onClick={() => downloadFile(result.markdown_path)}
            >
              {designText.downloads.markdown}
            </button>

            <button
              className="secondary-button"
              onClick={() => downloadFile(result.excel_path)}
            >
              {designText.downloads.excel}
            </button>
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
            <TabButton active={activeTab === "gdd"} onClick={() => setActiveTab("gdd")}>
              {designText.tabs.gdd}
            </TabButton>
            <TabButton
              active={activeTab === "systems"}
              onClick={() => setActiveTab("systems")}
            >
              {designText.tabs.systems}
            </TabButton>
            <TabButton
              active={activeTab === "tables"}
              onClick={() => setActiveTab("tables")}
            >
              {designText.tabs.tables}
            </TabButton>
            <TabButton active={activeTab === "json"} onClick={() => setActiveTab("json")}>
              JSON
            </TabButton>
          </div>

          <div className="action-row compact">
            <button className="secondary-button" onClick={handleCopyJson}>
              {designText.copyJson}
            </button>
          </div>

          {activeTab === "gdd" && <GddView result={design} texts={designText} />}
          {activeTab === "systems" && <SystemsView systems={design.systems} />}
          {activeTab === "tables" && <TablesView result={design} texts={designText} />}
          {activeTab === "json" && <JsonView result={result} />}
        </section>
      )}
    </div>
  );
}

function TemplateHint({ templates, template }) {
  const current = templates.find((item) => item.id === template);

  if (!current) {
    return null;
  }

  return (
    <div className="template-hint">
      <div>{current.description}</div>
      <div className="template-focus">
        {current.focus.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
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

function GddView({ result, texts }) {
  return (
    <div className="result-block">
      <h3>{texts.targetAudience}</h3>
      <p>{result.target_audience}</p>

      <h3>{texts.coreLoop}</h3>
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

function TablesView({ result, texts }) {
  return (
    <div className="tables-view">
      <DataTable
        title={texts.tableTitles.systems}
        columns={["id", "name", "category", "description"]}
        rows={result.systems}
      />

      <DataTable
        title={texts.tableTitles.resources}
        columns={["id", "name", "resource_type", "description"]}
        rows={result.resources}
      />

      <DataTable
        title={texts.tableTitles.items}
        columns={["id", "name", "item_type", "category", "effect", "properties"]}
        rows={result.items}
      />

      <DataTable
        title={texts.tableTitles.entities}
        columns={["id", "name", "entity_type", "category", "rarity", "description", "properties"]}
        rows={result.entities}
      />

      <DataTable
        title={texts.tableTitles.progression}
        columns={["id", "name", "progression_type", "order", "requirement", "unlocks", "description"]}
        rows={result.progression}
      />

      <DataTable
        title={texts.tableTitles.tasks}
        columns={["id", "name", "task_type", "objective", "reward", "unlock_condition"]}
        rows={result.tasks}
      />

      <DataTable
        title={texts.tableTitles.levels}
        columns={["id", "name", "level_type", "order", "goal", "unlock_condition", "description"]}
        rows={result.levels}
      />

      <DataTable
        title={texts.tableTitles.balanceNotes}
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
  return <pre className="json-view">{JSON.stringify(result, null, 2)}</pre>;
}

export default DesignGeneratorPage;
