import { useEffect, useMemo, useState } from "react";

import { openConfigWorkbook, scanConfigFolder } from "../api/configsApi";
import RuntimeNotice from "../components/RuntimeNotice";
import { useI18n } from "../i18n/I18nContext";

const SAVED_CONFIG_PATHS_KEY = "ai-gamedev-config-manager-paths";
const FAVORITE_WORKBOOKS_KEY = "ai-gamedev-config-manager-favorite-workbooks";

function ConfigManagerPage() {
  const { texts } = useI18n();
  const configText = texts.configs;
  const [path, setPath] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [selectedWorkbookPath, setSelectedWorkbookPath] = useState("");
  const [selectedSheetName, setSelectedSheetName] = useState("");
  const [workbookQuery, setWorkbookQuery] = useState("");
  const [sheetQuery, setSheetQuery] = useState("");
  const [savedPaths, setSavedPaths] = useState([]);
  const [favoriteWorkbooks, setFavoriteWorkbooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(SAVED_CONFIG_PATHS_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setSavedPaths(parsed);
      }
    } catch {
      setSavedPaths([]);
    }

    const storedFavorites = window.localStorage.getItem(FAVORITE_WORKBOOKS_KEY);
    if (!storedFavorites) return;

    try {
      const parsedFavorites = JSON.parse(storedFavorites);
      if (Array.isArray(parsedFavorites)) {
        setFavoriteWorkbooks(parsedFavorites);
      }
    } catch {
      setFavoriteWorkbooks([]);
    }
  }, []);

  const selectedWorkbook = useMemo(() => {
    if (!scanResult) return null;
    return (
      scanResult.workbooks.find((workbook) => workbook.relative_path === selectedWorkbookPath) ||
      scanResult.workbooks[0] ||
      null
    );
  }, [scanResult, selectedWorkbookPath]);

  const selectedSheet = useMemo(() => {
    if (!selectedWorkbook) return null;
    return (
      selectedWorkbook.sheets.find((sheet) => sheet.name === selectedSheetName) ||
      selectedWorkbook.sheets[0] ||
      null
    );
  }, [selectedSheetName, selectedWorkbook]);

  const filteredSheets = useMemo(() => {
    if (!selectedWorkbook) return [];
    const query = sheetQuery.trim().toLowerCase();
    if (!query) return selectedWorkbook.sheets;
    return selectedWorkbook.sheets.filter((sheet) => sheet.name.toLowerCase().includes(query));
  }, [selectedWorkbook, sheetQuery]);

  const filteredWorkbooks = useMemo(() => {
    if (!scanResult) return [];
    const query = workbookQuery.trim().toLowerCase();
    if (!query) return scanResult.workbooks;

    return scanResult.workbooks
      .map((workbook, index) => ({
        workbook,
        index,
        score: scoreWorkbook(workbook, query),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .map((item) => item.workbook);
  }, [scanResult, workbookQuery]);

  async function scanPath(targetPath) {
    if (!targetPath.trim()) {
      setError(configText.emptyPath);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setScanResult(null);
    setWorkbookQuery("");
    setSelectedWorkbookPath("");
    setSelectedSheetName("");

    try {
      const data = await scanConfigFolder(targetPath.trim());
      setPath(targetPath.trim());
      setScanResult(data);
      setSelectedWorkbookPath(data.workbooks[0]?.relative_path || "");
      setSelectedSheetName(data.workbooks[0]?.sheets[0]?.name || "");
    } catch (err) {
      setError(err.message || configText.scanError);
    } finally {
      setLoading(false);
    }
  }

  async function handleScan() {
    await scanPath(path);
  }

  function saveCurrentPath() {
    const value = path.trim();
    if (!value) {
      setError(configText.emptyPath);
      return;
    }

    const item = {
      id: value.toLowerCase(),
      name: derivePathName(value),
      path: value,
      savedAt: new Date().toISOString(),
    };
    const next = [item, ...savedPaths.filter((saved) => saved.id !== item.id)].slice(0, 20);
    setSavedPaths(next);
    window.localStorage.setItem(SAVED_CONFIG_PATHS_KEY, JSON.stringify(next));
    setError("");
    setMessage(configText.pathSaved);
  }

  function removeSavedPath(id) {
    const next = savedPaths.filter((item) => item.id !== id);
    setSavedPaths(next);
    window.localStorage.setItem(SAVED_CONFIG_PATHS_KEY, JSON.stringify(next));
  }

  function selectWorkbook(workbook) {
    setSelectedWorkbookPath(workbook.relative_path);
    setSelectedSheetName(workbook.sheets[0]?.name || "");
    setSheetQuery("");
  }

  async function handleOpenWorkbook() {
    if (!selectedWorkbook) return;

    setOpening(true);
    setError("");
    setMessage("");

    try {
      const result = await openConfigWorkbook(selectedWorkbook.path);
      setMessage(result.message || configText.opened);
    } catch (err) {
      setError(err.message || configText.openError);
    } finally {
      setOpening(false);
    }
  }

  function saveFavoriteWorkbook(workbook) {
    const favorite = {
      id: workbook.path.toLowerCase(),
      name: workbook.name,
      path: workbook.path,
      relativePath: workbook.relative_path,
      savedAt: new Date().toISOString(),
    };
    const next = [favorite, ...favoriteWorkbooks.filter((item) => item.id !== favorite.id)].slice(0, 30);
    setFavoriteWorkbooks(next);
    window.localStorage.setItem(FAVORITE_WORKBOOKS_KEY, JSON.stringify(next));
    setMessage(configText.favoriteSaved);
    setError("");
  }

  function removeFavoriteWorkbook(id) {
    const next = favoriteWorkbooks.filter((item) => item.id !== id);
    setFavoriteWorkbooks(next);
    window.localStorage.setItem(FAVORITE_WORKBOOKS_KEY, JSON.stringify(next));
  }

  async function openFavoriteWorkbook(workbook) {
    setOpening(true);
    setError("");
    setMessage("");

    try {
      const result = await openConfigWorkbook(workbook.path);
      setMessage(result.message || configText.opened);
    } catch (err) {
      setError(err.message || configText.openError);
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">{configText.eyebrow}</div>
          <h1>{configText.title}</h1>
          <p>{configText.intro}</p>
        </div>
      </div>

      <section className="panel">
        <div className="section-header-row">
          <h2>{configText.scanTitle}</h2>
          <span className="runtime-badge">Local-only</span>
        </div>
        <RuntimeNotice title="Local Excel folder scan" badge="Local-only">
          The backend reads this path from the same machine running the app. A cloud version should replace this with Excel file upload or ZIP upload.
        </RuntimeNotice>
        <div className="search-row config-path-row">
          <label className="form-field">
            <span>{configText.pathLabel}</span>
            <input
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder={configText.pathPlaceholder}
            />
          </label>
          <button onClick={handleScan} disabled={loading}>
            {loading ? configText.scanning : configText.scan}
          </button>
          <button className="secondary-button" onClick={saveCurrentPath} disabled={loading}>
            {configText.savePath}
          </button>
        </div>
        {savedPaths.length > 0 && (
          <div className="saved-path-list">
            <div className="block-header">
              <h3>{configText.savedPaths}</h3>
              <span>{configText.savedPathsHint}</span>
            </div>
            {savedPaths.map((item) => (
              <div className="saved-path-row" key={item.id}>
                <button className="saved-path-main" onClick={() => setPath(item.path)}>
                  <strong>{item.name}</strong>
                  <span>{item.path}</span>
                </button>
                <button className="secondary-button" onClick={() => scanPath(item.path)} disabled={loading}>
                  {configText.scanSaved}
                </button>
                <button className="secondary-button" onClick={() => removeSavedPath(item.id)}>
                  {configText.removePath}
                </button>
              </div>
            ))}
          </div>
        )}
        {favoriteWorkbooks.length > 0 && (
          <div className="favorite-workbook-panel inline-favorites">
            <div className="block-header">
              <h3>{configText.favoriteWorkbooks}</h3>
              <span>{configText.favoriteWorkbooksHint}</span>
            </div>
            <div className="favorite-workbook-list">
              {favoriteWorkbooks.map((workbook) => (
                <div className="saved-path-row" key={workbook.id}>
                  <button
                    className="saved-path-main"
                    onClick={() => openFavoriteWorkbook(workbook)}
                    disabled={opening}
                  >
                    <strong>{workbook.name}</strong>
                    <span>{workbook.path}</span>
                  </button>
                  <button className="secondary-button" onClick={() => openFavoriteWorkbook(workbook)} disabled={opening}>
                    {configText.openInExcel}
                  </button>
                  <button className="secondary-button" onClick={() => removeFavoriteWorkbook(workbook.id)}>
                    {configText.removePath}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <div className="error-box">{error}</div>}
        {message && <div className="scan-note">{message}</div>}
      </section>

      {scanResult && (
        <>
          <div className="summary-grid">
            <SummaryCard label={configText.summary.workbooks} value={scanResult.summary.workbook_count} />
            <SummaryCard label={configText.summary.sheets} value={scanResult.summary.sheet_count} />
            <SummaryCard label={configText.summary.issues} value={scanResult.summary.issue_count} />
            <SummaryCard label={configText.summary.skipped} value={scanResult.summary.skipped_temp_files} />
          </div>

          <div className="module-grid config-manager-grid">
            <section className="panel">
              <h2>{configText.workbooks}</h2>
              <label className="form-field workbook-search">
                <span>{configText.searchFiles}</span>
                <input
                  value={workbookQuery}
                  onChange={(event) => setWorkbookQuery(event.target.value)}
                  placeholder={configText.searchPlaceholder}
                />
              </label>
              <div className="file-list">
                {filteredWorkbooks.map((workbook) => (
                  <button
                    className={selectedWorkbook?.relative_path === workbook.relative_path ? "file-row active" : "file-row"}
                    key={workbook.relative_path}
                    onClick={() => selectWorkbook(workbook)}
                  >
                    <div>
                      <strong>{workbook.name}</strong>
                      <span>{workbook.relative_path}</span>
                    </div>
                    <code>
                      {workbook.sheet_count} / {countWorkbookIssues(workbook)}
                    </code>
                  </button>
                ))}
                {filteredWorkbooks.length === 0 && (
                  <div className="empty-state">{configText.noMatches}</div>
                )}
              </div>
            </section>

            <section className="panel config-detail-panel">
              <div className="section-header-row">
                <h2>{configText.sheetDetails}</h2>
                {selectedWorkbook && (
                  <div className="inline-action-group">
                    <button
                      className="secondary-button inline-action-button"
                      onClick={() => saveFavoriteWorkbook(selectedWorkbook)}
                      disabled={!selectedWorkbook.openable}
                      title={selectedWorkbook.openable ? configText.favoriteWorkbook : configText.openUnavailable}
                    >
                      {configText.favoriteWorkbook}
                    </button>
                    <button
                      className="secondary-button inline-action-button"
                      onClick={handleOpenWorkbook}
                      disabled={opening || !selectedWorkbook.openable}
                      title={selectedWorkbook.openable ? configText.openInExcel : configText.openUnavailable}
                    >
                      {opening ? configText.opening : configText.openInExcel}
                    </button>
                  </div>
                )}
              </div>
              {selectedWorkbook && selectedSheet ? (
                <>
                  <label className="form-field sheet-search">
                    <span>{configText.searchSheets}</span>
                    <input
                      value={sheetQuery}
                      onChange={(event) => setSheetQuery(event.target.value)}
                      placeholder={configText.searchSheetsPlaceholder}
                    />
                  </label>
                  <div className="tabs sheet-tabs">
                    {filteredSheets.map((sheet) => (
                      <button
                        className={selectedSheet.name === sheet.name ? "tab-button active" : "tab-button"}
                        key={sheet.name}
                        onClick={() => setSelectedSheetName(sheet.name)}
                      >
                        {sheet.name}
                      </button>
                    ))}
                    {filteredSheets.length === 0 && (
                      <div className="empty-state compact-empty">{configText.noSheetMatches}</div>
                    )}
                  </div>

                  <div className="summary-grid compact-summary">
                    <SummaryCard label={configText.rows} value={selectedSheet.row_count} />
                    <SummaryCard label={configText.columns} value={selectedSheet.column_count} />
                    <SummaryCard label={configText.summary.issues} value={selectedSheet.issues.length} />
                  </div>

                  <div className="result-block">
                    <h3>{configText.headers}</h3>
                    <div className="tag-list">
                      {selectedSheet.headers.map((header, index) => (
                        <span key={`${header}-${index}`}>{header || `(blank ${index + 1})`}</span>
                      ))}
                    </div>
                  </div>

                  <div className="result-block">
                    <h3>{configText.diagnostics}</h3>
                    {selectedSheet.issues.length > 0 ? (
                      <div className="rule-list">
                        {selectedSheet.issues.map((issue, index) => (
                          <div className={`issue-row ${issue.severity}`} key={`${issue.code}-${index}`}>
                            <strong>{configText.issueCodes[issue.code] || issue.code}</strong>
                            <span>{issue.message}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>{configText.noIssues}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-state">{configText.noWorkbook}</div>
              )}
            </section>
          </div>
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

function countWorkbookIssues(workbook) {
  return workbook.issues.length + workbook.sheets.reduce((total, sheet) => total + sheet.issues.length, 0);
}

function derivePathName(path) {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  return normalized.split("/").filter(Boolean).pop() || path;
}

function scoreWorkbook(workbook, query) {
  const fileName = workbook.name.toLowerCase();
  const baseName = fileName.replace(/\.xlsx$/i, "");
  const relativePath = workbook.relative_path.toLowerCase();

  let score = 0;
  if (baseName === query || fileName === query || fileName === `${query}.xlsx`) score += 1000;
  if (baseName.startsWith(query) || fileName.startsWith(query)) score += 800;
  if (wordStartsWith(baseName, query)) score += 700;
  if (baseName.includes(query)) score += 520;
  if (relativePath.includes(query)) score += 260;

  for (const sheet of workbook.sheets) {
    const sheetName = sheet.name.toLowerCase();
    if (sheetName === query) score += 240;
    else if (sheetName.startsWith(query)) score += 180;
    else if (sheetName.includes(query)) score += 90;

    for (const header of sheet.headers) {
      const value = header.toLowerCase();
      if (value === query) score += 120;
      else if (value.startsWith(query)) score += 80;
      else if (value.includes(query)) score += 30;
    }
  }

  return score;
}

function wordStartsWith(value, query) {
  return value
    .split(/[^a-z0-9]+|(?=[A-Z])/i)
    .filter(Boolean)
    .some((part) => part.toLowerCase().startsWith(query));
}

export default ConfigManagerPage;
