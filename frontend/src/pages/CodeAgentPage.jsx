import { useState } from "react";

import {
  analyzeErrorLog,
  analyzeProjectFile,
  readProjectFile,
  scanProject,
  searchProject,
} from "../api/codeApi";
import { isLlmReady } from "../api/localSettings";
import { useLocalSettings } from "../api/useLocalSettings";
import {
  canShowItemInFolder,
  chooseFolder,
  isDesktopRuntime,
  showProjectFileInFolder,
} from "../api/desktopApi";
import AiRequiredNotice from "../components/AiRequiredNotice";
import PageTabs from "../components/PageTabs";
import { useI18n } from "../i18n/I18nContext";

const SAVED_PROJECT_PATHS_KEY = "ai-gamedev-code-agent-project-paths";

function CodeAgentPage() {
  const { texts } = useI18n();
  const codeText = texts.code;
  const { settings } = useLocalSettings();
  const llmReady = isLlmReady(settings);
  const [activeTab, setActiveTab] = useState("scan");
  const [projectPath, setProjectPath] = useState("");
  const [savedProjects, setSavedProjects] = useState(loadSavedProjects);
  const [scanResult, setScanResult] = useState(null);
  const [activeGroup, setActiveGroup] = useState("scripts");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [fileStructure, setFileStructure] = useState(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const [structureError, setStructureError] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [errorLog, setErrorLog] = useState("");
  const [errorAnalysis, setErrorAnalysis] = useState(null);
  const [errorAnalysisLoading, setErrorAnalysisLoading] = useState(false);
  const [errorAnalysisError, setErrorAnalysisError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function scanPath(targetPath) {
    const value = targetPath.trim();
    if (!value) {
      setError(codeText.errors.emptyPath);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setScanResult(null);
    setSelectedFile(null);
    setFilePreview(null);
    setPreviewError("");
    setFileStructure(null);
    setStructureError("");
    setSelectedLine(null);
    setSearchResult(null);
    setSearchError("");
    setErrorAnalysis(null);
    setErrorAnalysisError("");

    try {
      const data = await scanProject(value);
      setProjectPath(value);
      setScanResult(data);
      setActiveGroup("scripts");
      setActiveTab("files");
    } catch (err) {
      setError(err.message || codeText.errors.scan);
    } finally {
      setLoading(false);
    }
  }

  async function handleScan() {
    await scanPath(projectPath);
  }

  async function handleChooseProjectFolder() {
    const selectedPath = await chooseFolder("Choose Unity or Godot Project Folder");
    if (!selectedPath) return;
    setProjectPath(selectedPath);
    setError("");
  }

  function saveCurrentProject() {
    const value = projectPath.trim();
    if (!value) {
      setError(codeText.errors.emptyPath);
      return;
    }

    const item = {
      id: value.toLowerCase(),
      name: derivePathName(value),
      path: value,
      savedAt: new Date().toISOString(),
    };
    const next = [item, ...savedProjects.filter((project) => project.id !== item.id)].slice(0, 20);
    setSavedProjects(next);
    window.localStorage.setItem(SAVED_PROJECT_PATHS_KEY, JSON.stringify(next));
    setError("");
    setMessage(codeText.pathSaved);
  }

  function removeSavedProject(id) {
    const next = savedProjects.filter((project) => project.id !== id);
    setSavedProjects(next);
    window.localStorage.setItem(SAVED_PROJECT_PATHS_KEY, JSON.stringify(next));
  }

  async function handleShowFileInFolder(file) {
    if (!scanResult || !file) return;
    await showProjectFileInFolder(scanResult.project_path, file.relative_path);
  }

  async function handleSelectFile(file, lineNumber = null) {
    if (!scanResult) return;

    setSelectedFile(file);
    setSelectedLine(lineNumber);
    setPreviewLoading(true);
    setStructureLoading(true);
    setPreviewError("");
    setStructureError("");
    setFilePreview(null);
    setFileStructure(null);

    try {
      const data = await readProjectFile(scanResult.project_path, file.relative_path);
      setFilePreview(data);
    } catch (err) {
      setPreviewError(err.message || codeText.errors.preview);
    } finally {
      setPreviewLoading(false);
    }

    try {
      const data = await analyzeProjectFile(scanResult.project_path, file.relative_path);
      setFileStructure(data);
    } catch (err) {
      setStructureError(err.message || codeText.errors.structure);
    } finally {
      setStructureLoading(false);
    }
  }

  async function handleSearch() {
    if (!scanResult) return;

    if (searchQuery.trim().length < 2) {
      setSearchError(codeText.errors.searchQuery);
      return;
    }

    setSearchLoading(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const data = await searchProject(scanResult.project_path, searchQuery.trim());
      setSearchResult(data);
    } catch (err) {
      setSearchError(err.message || codeText.errors.search);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  async function handleAnalyzeErrorLog() {
    if (!scanResult) return;

    if (errorLog.trim().length < 5) {
      setErrorAnalysisError(codeText.errors.logShort);
      return;
    }

    setErrorAnalysisLoading(true);
    setErrorAnalysisError("");
    setErrorAnalysis(null);

    try {
      const data = await analyzeErrorLog(scanResult.project_path, errorLog.trim());
      setErrorAnalysis(data);
    } catch (err) {
      setErrorAnalysisError(err.message || codeText.errors.logAnalyze);
    } finally {
      setErrorAnalysisLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">{texts.common.phase2}</div>
          <h1>{codeText.title}</h1>
          <p>{codeText.intro}</p>
        </div>
      </div>

      <section className="panel">
        <PageTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "scan", label: codeText.scanTitle },
            { id: "files", label: codeText.filesTab || "Files" },
            { id: "search", label: codeText.searchTitle },
            { id: "logs", label: codeText.errorLogTitle },
          ]}
        />
      </section>

      {activeTab === "scan" && (
      <section className="panel">
        <h2>{codeText.scanTitle}</h2>
        <label className="form-field">
          <span>{codeText.pathLabel}</span>
          <input
            value={projectPath}
            onChange={(event) => setProjectPath(event.target.value)}
            placeholder={codeText.pathPlaceholder}
          />
        </label>

        <div className="action-row">
          {isDesktopRuntime() && (
            <button className="secondary-button" onClick={handleChooseProjectFolder} disabled={loading}>
              {codeText.chooseProjectFolder}
            </button>
          )}
          <button onClick={handleScan} disabled={loading}>
            {loading ? codeText.scanning : codeText.scan}
          </button>
          <button className="secondary-button" onClick={saveCurrentProject} disabled={loading}>
            {codeText.savePath}
          </button>
        </div>

        {savedProjects.length > 0 && (
          <div className="saved-path-list">
            <div className="block-header">
              <h3>{codeText.savedProjects}</h3>
              <span>{codeText.savedProjectsHint}</span>
            </div>
            {savedProjects.map((project) => (
              <div className="saved-path-row" key={project.id}>
                <button className="saved-path-main" onClick={() => setProjectPath(project.path)}>
                  <strong>{project.name}</strong>
                  <span>{project.path}</span>
                </button>
                <button
                  className="secondary-button inline-action-button"
                  onClick={() => scanPath(project.path)}
                  disabled={loading}
                >
                  {codeText.scanSaved}
                </button>
                <button
                  className="secondary-button inline-action-button danger-action-button"
                  onClick={() => removeSavedProject(project.id)}
                >
                  {codeText.removePath}
                </button>
              </div>
            ))}
          </div>
        )}

        {message && <div className="scan-note">{message}</div>}
        {error && <div className="error-box">{error}</div>}
      </section>
      )}

      {scanResult && activeTab === "scan" && (
          <section className="panel">
            <div className="result-header">
              <div>
                <h2>{scanResult.project_name}</h2>
                <p>{scanResult.project_path}</p>
              </div>
              <div className="project-type-pill">
                {formatProjectType(scanResult.project_type, texts.common)}
              </div>
            </div>

            <div className="summary-grid">
              <SummaryCard label={codeText.summary.totalFiles} value={scanResult.summary.total_files} />
              <SummaryCard label={codeText.summary.scripts} value={scanResult.summary.script_count} />
              <SummaryCard label={codeText.summary.scenes} value={scanResult.summary.scene_count} />
              <SummaryCard label={codeText.summary.resources} value={scanResult.summary.resource_count} />
              <SummaryCard label={codeText.summary.configs} value={scanResult.summary.config_count} />
              <SummaryCard label={codeText.summary.size} value={formatBytes(scanResult.summary.total_size_bytes)} />
            </div>

            {scanResult.summary.skipped_directories.length > 0 && (
              <div className="scan-note">
                {codeText.summary.skipped} {scanResult.summary.skipped_directories.join(", ")}
              </div>
            )}
          </section>
      )}

      {scanResult && activeTab === "search" && (
          <section className="panel">
            <h2>{codeText.searchTitle}</h2>
            <div className="search-row">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={codeText.searchPlaceholder}
              />
              <button onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? codeText.searching : codeText.search}
              </button>
            </div>

            {searchError && <div className="error-box">{searchError}</div>}
            {searchResult && (
              <SearchResults
                result={searchResult}
                texts={texts}
                onSelectMatch={(match) =>
                  handleSelectFile(
                    {
                      name: match.name,
                      relative_path: match.relative_path,
                      extension: match.extension,
                      size_bytes: 0,
                    },
                    match.line_number,
                  )
                }
              />
            )}
          </section>
      )}

      {scanResult && activeTab === "logs" && (
          <section className="panel">
            <h2>{codeText.errorLogTitle}</h2>
            {!llmReady && (
              <AiRequiredNotice
                title={texts.ai?.requiredTitle || "AI is not configured"}
                message={texts.ai?.llmRequired || "Configure an LLM before using this AI feature."}
                actionLabel={texts.ai?.goSettings || "Open Settings"}
              />
            )}
            <textarea
              value={errorLog}
              onChange={(event) => setErrorLog(event.target.value)}
              placeholder={codeText.errorLogPlaceholder}
              rows={6}
            />
            <div className="action-row">
              <button onClick={handleAnalyzeErrorLog} disabled={errorAnalysisLoading || !llmReady}>
                {errorAnalysisLoading ? codeText.analyzing : codeText.analyzeLog}
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setErrorLog("");
                  setErrorAnalysis(null);
                  setErrorAnalysisError("");
                }}
                disabled={errorAnalysisLoading}
              >
                {texts.common.clear}
              </button>
            </div>

            {errorAnalysisError && <div className="error-box">{errorAnalysisError}</div>}
            {errorAnalysis && (
              <ErrorAnalysisResult
                result={errorAnalysis}
                texts={texts}
                onSelectFile={(file) =>
                  handleSelectFile(
                    {
                      name: file.name,
                      relative_path: file.relative_path,
                      extension: file.extension,
                      size_bytes: 0,
                    },
                    file.line_number,
                  )
                }
              />
            )}
          </section>
      )}

      {scanResult && activeTab === "files" && (
        <>
          <section className="panel">
            <div className="tabs">
              {Object.entries(codeText.groups).map(([group, label]) => (
                <button
                  key={group}
                  className={activeGroup === group ? "tab-button active" : "tab-button"}
                  onClick={() => setActiveGroup(group)}
                >
                  {label} ({scanResult.files[group].length})
                </button>
              ))}
            </div>

            <FileList
              files={scanResult.files[activeGroup]}
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
              onShowInFolder={handleShowFileInFolder}
              texts={codeText}
            />
          </section>

          <FilePreview
            file={selectedFile}
            preview={filePreview}
            loading={previewLoading}
            error={previewError}
            structure={fileStructure}
            structureLoading={structureLoading}
            structureError={structureError}
            selectedLine={selectedLine}
            onSelectLine={setSelectedLine}
            onShowInFolder={() => handleShowFileInFolder(selectedFile)}
            texts={texts}
          />
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="summary-card">
      <div>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

function loadSavedProjects() {
  try {
    const stored = window.localStorage.getItem(SAVED_PROJECT_PATHS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function derivePathName(path) {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  return normalized.split("/").filter(Boolean).pop() || path;
}

function FileList({ files, selectedFile, onSelectFile, onShowInFolder, texts }) {
  if (files.length === 0) {
    return <div className="empty-state">{texts.emptyCategory}</div>;
  }

  return (
    <div className="file-list">
      {files.map((file) => (
        <div
          role="button"
          tabIndex={0}
          className={
            selectedFile?.relative_path === file.relative_path
              ? "file-row active"
              : "file-row"
          }
          key={file.relative_path}
          onClick={() => onSelectFile(file)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectFile(file);
            }
          }}
        >
          <div>
            <strong>{file.name}</strong>
            <span>{file.relative_path}</span>
          </div>
          <div className="file-row-actions">
            <span>{formatBytes(file.size_bytes)}</span>
            {canShowItemInFolder() && (
              <button
                className="secondary-button inline-action-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onShowInFolder(file);
                }}
              >
                {texts.openFolder}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchResults({ result, texts, onSelectMatch }) {
  const codeText = texts.code;

  if (result.matches.length === 0) {
    return (
      <div className="empty-state">
        {codeText.noMatches.replace("{count}", result.summary.scanned_files)}
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="scan-note">
        {codeText.matches
          .replace("{matches}", result.summary.match_count)
          .replace("{files}", result.summary.scanned_files)}
        {result.summary.truncated ? codeText.limited : ""}
      </div>

      {result.matches.map((match, index) => (
        <button
          className="search-result-row"
          key={`${match.relative_path}-${match.line_number}-${index}`}
          onClick={() => onSelectMatch(match)}
        >
          <div>
            <strong>{match.relative_path}</strong>
            <span>{formatLineLabel(texts.common, match.line_number)}</span>
          </div>
          <code>{match.line_text}</code>
        </button>
      ))}
    </div>
  );
}

function ErrorAnalysisResult({ result, texts, onSelectFile }) {
  const codeText = texts.code;

  return (
    <div className="error-analysis">
      <div className="scan-note">
        {codeText.engine} {formatProjectType(result.summary.detected_engine, texts.common)} ·{" "}
        {result.summary.reference_count} {codeText.references} ·{" "}
        {result.summary.related_file_count} {codeText.relatedFiles}
      </div>

      {result.summary.keywords.length > 0 && (
        <div className="keyword-list">
          {result.summary.keywords.map((keyword) => (
            <span key={keyword}>{keyword}</span>
          ))}
        </div>
      )}

      {result.related_files.length > 0 ? (
        <div className="related-file-list">
          {result.related_files.map((file) => (
            <button
              className="related-file-row"
              key={file.relative_path}
              onClick={() => onSelectFile(file)}
            >
              <div>
                <strong>{file.relative_path}</strong>
                <span>
                  {file.reason}
                  {file.line_number ? ` · ${formatLineLabel(texts.common, file.line_number)}` : ""}
                </span>
              </div>
              <code>{file.score}</code>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">{codeText.noRelated}</div>
      )}

      {result.references.length > 0 && (
        <div className="reference-list">
          <h3>{codeText.parsedReferences}</h3>
          {result.references.map((reference, index) => (
            <div className="reference-row" key={`${reference.source}-${index}`}>
              <strong>{reference.source}</strong>
              <span>
                {reference.line_number
                  ? formatLineLabel(texts.common, reference.line_number)
                  : codeText.lineUnknown}
                {reference.matched_file ? ` · ${reference.matched_file}` : ""}
              </span>
              <small>{reference.message}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilePreview({
  file,
  preview,
  loading,
  error,
  structure,
  structureLoading,
  structureError,
  selectedLine,
  onSelectLine,
  onShowInFolder,
  texts,
}) {
  if (!file) {
    return null;
  }

  const sizeBytes = preview?.size_bytes ?? file.size_bytes;
  const codeText = texts.code;

  return (
    <section className="panel">
      <div className="preview-header">
        <div>
          <h2>{file.name}</h2>
          <p>{file.relative_path}</p>
        </div>
        <div className="preview-actions">
          <span>{formatBytes(sizeBytes)}</span>
          {canShowItemInFolder() && (
            <button className="secondary-button inline-action-button" onClick={onShowInFolder}>
              {codeText.openContainingFolder}
            </button>
          )}
        </div>
      </div>

      {loading && <div className="empty-state">{codeText.loadingPreview}</div>}
      {error && <div className="error-box">{error}</div>}
      {preview && !preview.is_text && (
        <div className="empty-state">{preview.message || codeText.cannotPreview}</div>
      )}
      {preview?.is_text && (
        <CodePreview content={preview.content} selectedLine={selectedLine} />
      )}

      <StructureOutline
        structure={structure}
        loading={structureLoading}
        error={structureError}
        onSelectLine={onSelectLine}
        texts={texts}
      />
    </section>
  );
}

function CodePreview({ content, selectedLine }) {
  return (
    <pre className="file-preview">
      {content.split("\n").map((line, index) => {
        const lineNumber = index + 1;
        return (
          <span
            className={selectedLine === lineNumber ? "code-line active" : "code-line"}
            key={lineNumber}
          >
            <span className="code-line-number">{lineNumber}</span>
            <span className="code-line-text">{line || " "}</span>
          </span>
        );
      })}
    </pre>
  );
}

function StructureOutline({ structure, loading, error, onSelectLine, texts }) {
  const codeText = texts.code;

  if (loading) {
    return <div className="empty-state">{codeText.analyzingStructure}</div>;
  }

  if (error) {
    return <div className="error-box">{error}</div>;
  }

  if (!structure) {
    return null;
  }

  if (!structure.supported) {
    return <div className="empty-state">{structure.message}</div>;
  }

  if (structure.symbols.length === 0) {
    return <div className="empty-state">{structure.message || codeText.noSymbols}</div>;
  }

  return (
    <div className="structure-panel">
      <h3>{codeText.structureTitle}</h3>
      <div className="structure-list">
        {structure.symbols.map((symbol, index) => (
          <button
            className="structure-row"
            key={`${symbol.kind}-${symbol.name}-${symbol.line_number}-${index}`}
            onClick={() => onSelectLine(symbol.line_number)}
          >
            <span>{symbol.kind}</span>
            <strong>{symbol.name}</strong>
            <code>{formatLineLabel(texts.common, symbol.line_number)}</code>
            <small>{symbol.signature}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatProjectType(projectType, commonTexts) {
  if (projectType === "godot") return commonTexts.godot;
  if (projectType === "unity") return commonTexts.unity;
  return commonTexts.unknown;
}

function formatLineLabel(commonTexts, lineNumber) {
  return commonTexts.line.replace("{line}", lineNumber);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default CodeAgentPage;
