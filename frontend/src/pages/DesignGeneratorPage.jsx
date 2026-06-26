import { useState } from "react";

import { generateDesign } from "../api/designApi";
import { downloadFile } from "../api/fileApi";
import { isLlmReady } from "../api/localSettings";
import { useLocalSettings } from "../api/useLocalSettings";
import AiRequiredNotice from "../components/AiRequiredNotice";
import WorkspaceHeader from "../components/WorkspaceHeader";
import { useI18n } from "../i18n/useI18n";

function DesignGeneratorPage() {
  const { texts } = useI18n();
  const designText = texts.design;
  const { settings } = useLocalSettings();
  const llmReady = isLlmReady(settings);
  const [idea, setIdea] = useState(designText.exampleIdea);
  const [result, setResult] = useState(null);
  const [selectedTableIndex, setSelectedTableIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const design = result?.data;
  const tables = design?.tables || [];
  const selectedTable = tables[selectedTableIndex] || tables[0];

  async function handleGenerate() {
    if (!idea.trim()) {
      setError(designText.errors.emptyIdea);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSelectedTableIndex(0);

    try {
      const data = await generateDesign(idea.trim(), "general");
      setResult(data);
    } catch (err) {
      setError(err.message || designText.errors.generate);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page workspace-page">
      <WorkspaceHeader
        capability="ai"
        capabilityLabel={texts.sidebar.capabilities.ai}
        eyebrow={designText.eyebrow}
        icon="design"
        intro={designText.intro}
        title={designText.title}
      />

      <section className="panel primary-workspace-panel">
        <h2>{designText.ideaTitle}</h2>
        {!llmReady && (
          <AiRequiredNotice
            title={texts.ai?.requiredTitle || "AI is not configured"}
            message={texts.ai?.llmRequired || "Configure an LLM before using this AI feature."}
            actionLabel={texts.ai?.goSettings || "Open Settings"}
          />
        )}
        <textarea
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder={designText.placeholder}
          rows={5}
        />

        <div className="action-row">
          <button onClick={handleGenerate} disabled={loading || !llmReady}>
            {loading ? texts.common.generating : designText.generate}
          </button>
          <button
            className="secondary-button"
            onClick={() => setIdea(designText.exampleIdea)}
            disabled={loading}
          >
            {texts.common.fillExample}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
      </section>

      {result && design && (
        <section className="panel">
          <div className="result-header compact-result-header">
            <div>
              <h2>{design.title}</h2>
              <p>{design.gameplay_summary}</p>
            </div>
            <div className="output-meta compact-output-meta">
              <div>
                <strong>{designText.meta.outputId} </strong>
                <span>{result.output_id}</span>
              </div>
              <div>
                <strong>{designText.meta.tableCount} </strong>
                <span>{tables.length}</span>
              </div>
            </div>
          </div>

          <div className="download-row">
            <button className="secondary-button" onClick={() => downloadFile(result.excel_zip_path)}>
              {designText.downloads.excelPackage}
            </button>
            <button className="secondary-button" onClick={() => downloadFile(result.godot_zip_path)}>
              {designText.downloads.godot}
            </button>
          </div>

          <div className="table-selector">
            {tables.map((table, index) => (
              <button
                key={table.name}
                className={index === selectedTableIndex ? "tab-button active" : "tab-button"}
                onClick={() => setSelectedTableIndex(index)}
              >
                {table.display_name || table.name}
              </button>
            ))}
          </div>

          {selectedTable && <ConfigTableView table={selectedTable} texts={designText} />}

          {design.export_notes?.length > 0 && (
            <div className="result-block">
              <h3>{designText.exportNotes}</h3>
              <ul className="compact-list">
                {design.export_notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ConfigTableView({ table, texts }) {
  const fieldNames = table.fields.map((field) => field.name);

  return (
    <div className="config-table-detail">
      <div className="result-block">
        <div className="block-header">
          <div>
            <h3>{table.display_name || table.name}</h3>
            <p>{table.purpose}</p>
          </div>
          <span>{table.engine_usage}</span>
        </div>

        <h4>{texts.fieldSpec}</h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{texts.fieldColumns.name}</th>
                <th>{texts.fieldColumns.type}</th>
                <th>{texts.fieldColumns.required}</th>
                <th>{texts.fieldColumns.default}</th>
                <th>{texts.fieldColumns.enum}</th>
                <th>{texts.fieldColumns.reference}</th>
                <th>{texts.fieldColumns.description}</th>
              </tr>
            </thead>
            <tbody>
              {table.fields.map((field) => (
                <tr key={field.name}>
                  <td>{field.name}</td>
                  <td>{field.type}</td>
                  <td>{field.required ? "true" : "false"}</td>
                  <td>{formatCellValue(field.default)}</td>
                  <td>{field.enum?.join(", ")}</td>
                  <td>{field.reference}</td>
                  <td>{field.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4>{texts.exampleRows}</h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {fieldNames.map((fieldName) => (
                  <th key={fieldName}>{fieldName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {fieldNames.map((fieldName) => (
                    <td key={fieldName}>{formatCellValue(row[fieldName])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {table.notes?.length > 0 && (
          <>
            <h4>{texts.tableNotes}</h4>
            <ul className="compact-list">
              {table.notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </>
        )}
      </div>
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

export default DesignGeneratorPage;
