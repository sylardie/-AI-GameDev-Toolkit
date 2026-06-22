import { useEffect, useMemo, useState } from "react";

import {
  applyFrameTransparency,
  exportSelectedSpritesheet,
  generateSpritesheet,
  removeImageBackground,
} from "../api/assetsApi";
import { downloadFile, getDownloadUrl } from "../api/fileApi";
import { useI18n } from "../i18n/I18nContext";

function AssetToolsPage() {
  const { language, texts } = useI18n();
  const assetText = texts.assets;
  const tr = (en, zh) => (language === "zh" ? zh : en);

  const [video, setVideo] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [fps, setFps] = useState(16);
  const [maxFrames, setMaxFrames] = useState(16);
  const [columns, setColumns] = useState(4);
  const [frameWidth, setFrameWidth] = useState(128);
  const [frameHeight, setFrameHeight] = useState(128);
  const [metadataTarget, setMetadataTarget] = useState("godot");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [extractionMode, setExtractionMode] = useState("fps");
  const [frameInterval, setFrameInterval] = useState(2);
  const [dedupeEnabled, setDedupeEnabled] = useState(false);
  const [dedupeThreshold, setDedupeThreshold] = useState(96);
  const [transparentColor, setTransparentColor] = useState("#000000");
  const [transparentTolerance, setTransparentTolerance] = useState(24);
  const [transparentFeather, setTransparentFeather] = useState(16);
  const [selectedFrames, setSelectedFrames] = useState([]);
  const [result, setResult] = useState(null);
  const [cacheBust, setCacheBust] = useState(Date.now());
  const [copyMessage, setCopyMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [processingTransparency, setProcessingTransparency] = useState(false);
  const [error, setError] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageColor, setImageColor] = useState("#000000");
  const [imageTolerance, setImageTolerance] = useState(24);
  const [imageFeather, setImageFeather] = useState(16);
  const [imageResult, setImageResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  const estimatedFrames = useMemo(() => {
    const duration = Math.max(0, (endTime || videoInfo?.duration || 0) - startTime);
    if (!duration) return 0;
    const estimate =
      extractionMode === "fps"
        ? Math.ceil(duration * fps)
        : Math.ceil(duration * (videoInfo?.fps || 30) / frameInterval);
    return Math.min(maxFrames, Math.max(0, estimate));
  }, [endTime, extractionMode, fps, frameInterval, maxFrames, startTime, videoInfo]);

  const selectedFrameItems = useMemo(
    () => result?.frames.filter((frame) => selectedFrames.includes(frame.index)) || [],
    [result, selectedFrames],
  );

  const importSettings = useMemo(
    () => (result ? buildImportSettings(result, metadataTarget, texts, tr) : null),
    [metadataTarget, result, texts, tr],
  );

  function outputUrl(path) {
    return `${getDownloadUrl(path)}&v=${cacheBust}`;
  }

  function handleVideoChange(file) {
    setVideo(file);
    setResult(null);
    setSelectedFrames([]);
    setCopyMessage("");
    setError("");

    if (!file) {
      setVideoInfo(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const element = document.createElement("video");
    element.preload = "metadata";
    element.src = url;
    element.onloadedmetadata = () => {
      const width = element.videoWidth || 128;
      const height = element.videoHeight || 128;
      const size = fitWithinLimit(width, height, 2048);
      const duration = element.duration || 0;
      setVideoInfo({ name: file.name, width, height, duration, fps: 30 });
      setFrameWidth(size.width);
      setFrameHeight(size.height);
      setEndTime(Number(duration.toFixed(2)));
      URL.revokeObjectURL(url);
    };
  }

  function handleImageChange(file) {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImageResult(null);
    setImageError("");
    setImagePreviewUrl(file ? URL.createObjectURL(file) : "");
  }

  async function handleGenerate() {
    if (!video) {
      setError(assetText.errors.noFile);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSelectedFrames([]);
    setCopyMessage("");

    try {
      const data = await generateSpritesheet({
        video,
        fps,
        maxFrames,
        columns,
        frameWidth,
        frameHeight,
        metadataTarget,
        startTime,
        endTime,
        extractionMode,
        frameInterval,
        dedupeEnabled,
        dedupeThreshold,
      });
      setResult(data);
      setSelectedFrames(data.frames.map((frame) => frame.index));
      setCacheBust(Date.now());
    } catch (err) {
      setError(err.message || assetText.errors.generate);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportSelected() {
    if (!result || selectedFrames.length === 0) return;

    setExporting(true);
    setError("");
    setCopyMessage("");

    try {
      const data = await exportSelectedSpritesheet({
        outputId: result.output_id,
        selectedIndices: selectedFrames,
        columns,
        frameWidth,
        frameHeight,
        metadataTarget,
        gifFps: fps,
      });
      setResult(data);
      setSelectedFrames(data.frames.map((frame) => frame.index));
      setCacheBust(Date.now());
    } catch (err) {
      setError(err.message || assetText.errors.generate);
    } finally {
      setExporting(false);
    }
  }

  async function handleApplyTransparency() {
    if (!result) return;

    setProcessingTransparency(true);
    setError("");
    setCopyMessage("");

    try {
      const data = await applyFrameTransparency({
        outputId: result.output_id,
        selectedIndices: selectedFrames,
        applyToAll: true,
        columns,
        frameWidth,
        frameHeight,
        metadataTarget,
        gifFps: fps,
        transparentColor,
        transparentTolerance,
        transparentFeather,
      });
      setResult(data);
      setSelectedFrames(data.frames.map((frame) => frame.index));
      setCacheBust(Date.now());
    } catch (err) {
      setError(err.message || assetText.errors.generate);
    } finally {
      setProcessingTransparency(false);
    }
  }

  async function handleRemoveImageBackground() {
    if (!imageFile) {
      setImageError(tr("Please choose an image first.", "请先选择图片。"));
      return;
    }

    setImageLoading(true);
    setImageError("");
    setImageResult(null);

    try {
      const data = await removeImageBackground({
        image: imageFile,
        transparentColor: imageColor,
        transparentTolerance: imageTolerance,
        transparentFeather: imageFeather,
      });
      setImageResult(data);
    } catch (err) {
      setImageError(err.message || tr("Unable to remove image background.", "无法去除图片背景。"));
    } finally {
      setImageLoading(false);
    }
  }

  async function copyImportSettings() {
    if (!importSettings) return;

    await navigator.clipboard.writeText(importSettings.copyText);
    setCopyMessage(tr("Import settings copied.", "导入参数已复制。"));
  }

  function toggleFrame(index) {
    setSelectedFrames((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index].sort((left, right) => left - right),
    );
  }

  function selectAll() {
    setSelectedFrames(result?.frames.map((frame) => frame.index) || []);
  }

  function invertSelection() {
    if (!result) return;
    setSelectedFrames(result.frames.filter((frame) => !selectedFrames.includes(frame.index)).map((frame) => frame.index));
  }

  function clearSelection() {
    setSelectedFrames([]);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">{assetText.eyebrow}</div>
          <h1>{assetText.title}</h1>
          <p>{assetText.intro}</p>
        </div>
      </div>

      <section className="panel">
        <div className="section-step">
          <span>1</span>
          <h2>{tr("Video to Spritesheet", "视频转精灵表")}</h2>
        </div>

        <div className="settings-grid">
          <label className="form-field span-2">
            <span>{assetText.videoFile}</span>
            <input type="file" accept="video/*" onChange={(event) => handleVideoChange(event.target.files?.[0] || null)} />
          </label>

          {videoInfo && (
            <div className="asset-info span-2">
              <strong>{videoInfo.name}</strong>
              <span>
                {videoInfo.width}x{videoInfo.height} / {formatSeconds(videoInfo.duration)} / {tr("estimated", "预计")} {estimatedFrames} {tr("frames", "帧")}
              </span>
            </div>
          )}

          <NumberField label={tr("Start time (s)", "开始时间（秒）")} value={startTime} onChange={setStartTime} />
          <NumberField label={tr("End time (s)", "结束时间（秒）")} value={endTime} onChange={setEndTime} />

          <label className="form-field">
            <span>{tr("Extraction mode", "抽帧方式")}</span>
            <select value={extractionMode} onChange={(event) => setExtractionMode(event.target.value)}>
              <option value="fps">{tr("Target FPS", "目标 FPS")}</option>
              <option value="interval">{tr("Every N source frames", "每 N 帧取 1 帧")}</option>
            </select>
          </label>

          {extractionMode === "fps" ? (
            <NumberField label={assetText.fps} value={fps} onChange={setFps} />
          ) : (
            <NumberField label={tr("Frame interval", "抽帧间隔")} value={frameInterval} onChange={setFrameInterval} />
          )}

          <NumberField label={assetText.maxFrames} value={maxFrames} onChange={setMaxFrames} />
          <NumberField label={assetText.columns} value={columns} onChange={setColumns} />
          <NumberField label={assetText.frameWidth} value={frameWidth} onChange={setFrameWidth} />
          <NumberField label={assetText.frameHeight} value={frameHeight} onChange={setFrameHeight} />

          <label className="form-field">
            <span>{assetText.metadataTarget}</span>
            <select value={metadataTarget} onChange={(event) => setMetadataTarget(event.target.value)}>
              <option value="godot">{texts.common.godot}</option>
              <option value="unity">{texts.common.unity}</option>
              <option value="generic">{texts.common.generic}</option>
            </select>
          </label>

          <ToggleField label={tr("Remove similar frames", "相似帧去重")} checked={dedupeEnabled} onChange={setDedupeEnabled} />
          <NumberField label={tr("Similarity threshold", "相似阈值")} value={dedupeThreshold} onChange={setDedupeThreshold} />
        </div>

        <div className="action-row">
          <button onClick={handleGenerate} disabled={loading}>
            {loading ? texts.common.generating : assetText.generate}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
      </section>

      {result && (
        <section className="panel">
          <div className="section-step">
            <span>2</span>
            <h2>{tr("Preview and Cleanup", "预览与整理")}</h2>
          </div>

          <div className="scan-note">
            {assetText.summary
              .replace("{frames}", result.frame_count)
              .replace("{columns}", result.columns)
              .replace("{rows}", result.rows)
              .replace("{width}", result.frame_width)
              .replace("{height}", result.frame_height)}
            {" / "}
            {tr("selected", "已选")} {selectedFrames.length}
          </div>

          <div className="cleanup-panel">
            <div>
              <h3>{tr("Transparent Background", "背景透明处理")}</h3>
              <p>{tr("Pick the background color, then tune tolerance and edge softness before applying it to all extracted frames.", "选择背景色，再调整容差和边缘柔化，然后一键应用到全部已抽取帧。")}</p>
            </div>
            <div className="cleanup-controls">
              <button className="secondary-button" onClick={() => setTransparentColor("#000000")}>{tr("Black", "黑色")}</button>
              <button className="secondary-button" onClick={() => setTransparentColor("#ffffff")}>{tr("White", "白色")}</button>
              <input type="color" value={transparentColor} onChange={(event) => setTransparentColor(event.target.value)} />
              <label className="form-field">
                <span>{tr("Tolerance", "容差")}: {transparentTolerance}</span>
                <input type="range" min="0" max="120" value={transparentTolerance} onChange={(event) => setTransparentTolerance(Number(event.target.value))} />
              </label>
              <label className="form-field">
                <span>{tr("Edge softness", "边缘柔化")}: {transparentFeather}</span>
                <input type="range" min="0" max="80" value={transparentFeather} onChange={(event) => setTransparentFeather(Number(event.target.value))} />
              </label>
              <button onClick={handleApplyTransparency} disabled={processingTransparency}>
                {processingTransparency ? texts.common.generating : tr("Apply to all frames", "应用到全部帧")}
              </button>
            </div>
          </div>

          <div className="action-row compact">
            <button className="secondary-button" onClick={selectAll}>{tr("Select all", "全选")}</button>
            <button className="secondary-button" onClick={invertSelection}>{tr("Invert", "反选")}</button>
            <button className="secondary-button" onClick={clearSelection}>{tr("Clear", "清空")}</button>
            <button onClick={handleExportSelected} disabled={exporting || selectedFrames.length === 0}>
              {exporting ? texts.common.generating : tr("Export selected", "导出选中帧")}
            </button>
          </div>

          <div className="asset-workbench">
            <div className="frame-grid">
              {result.frames.map((frame) => (
                <button
                  className={selectedFrames.includes(frame.index) ? "frame-tile selected" : "frame-tile"}
                  key={`${result.output_id}-${frame.index}`}
                  onClick={() => toggleFrame(frame.index)}
                >
                  <img src={outputUrl(frame.path)} alt={`frame ${frame.index}`} />
                  <span>#{String(frame.index).padStart(3, "0")}</span>
                </button>
              ))}
            </div>

            <AnimationPreview
              frames={selectedFrameItems}
              getUrl={outputUrl}
              label={tr("Animation Preview", "动画预览")}
              playText={tr("Play", "播放")}
              pauseText={tr("Pause", "暂停")}
            />
          </div>
        </section>
      )}

      {result && (
        <section className="panel">
          <div className="section-step">
            <span>3</span>
            <h2>{assetText.resultTitle}</h2>
          </div>

          <div className="asset-output-grid">
            <div className="spritesheet-preview">
              <div className="block-header">
                <h3>{assetText.spritesheet}</h3>
                <span>{result.columns * result.frame_width}x{result.rows * result.frame_height}</span>
              </div>
              <div className="spritesheet-stage">
                <img src={outputUrl(result.spritesheet_path)} alt="generated spritesheet" />
              </div>
            </div>

            <div className="import-settings-card">
              <h3>{tr("Output Summary", "输出摘要")}</h3>
              <div className="output-summary-grid">
                <SummaryItem label={tr("Output ID", "输出 ID")} value={result.output_id} />
                <SummaryItem label={tr("Frames", "帧数")} value={result.frame_count} />
                <SummaryItem label={tr("Grid", "行列")} value={`${result.columns} x ${result.rows}`} />
                <SummaryItem label={tr("Frame size", "单帧尺寸")} value={`${result.frame_width}x${result.frame_height}`} />
                <SummaryItem label={tr("Sheet size", "整图尺寸")} value={`${result.columns * result.frame_width}x${result.rows * result.frame_height}`} />
                <SummaryItem label={tr("Metadata target", "元数据目标")} value={formatTarget(metadataTarget, texts)} />
              </div>

              {importSettings && (
                <>
                  <div className="block-header import-header">
                    <h3>{tr("Import Settings", "导入参数")}</h3>
                    <button className="secondary-button" onClick={copyImportSettings}>{texts.common.copy}</button>
                  </div>
                  <div className="import-setting-list">
                    {importSettings.items.map((item) => (
                      <div key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                  {copyMessage && <div className="scan-note compact-note">{copyMessage}</div>}
                </>
              )}

              <div className="download-row output-downloads">
                <button onClick={() => downloadFile(result.spritesheet_path)}>
                  {texts.common.download} {assetText.spritesheet}
                </button>
                <button className="secondary-button" onClick={() => downloadFile(result.metadata_path)}>
                  {texts.common.download} {assetText.metadata}
                </button>
                {result.zip_path && (
                  <button className="secondary-button" onClick={() => downloadFile(result.zip_path)}>
                    {texts.common.download} ZIP
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-step">
          <span>4</span>
          <h2>{tr("Single Image Background Removal", "单张图片去背景")}</h2>
        </div>

        <div className="settings-grid">
          <label className="form-field span-2">
            <span>{tr("Image file", "图片文件")}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleImageChange(event.target.files?.[0] || null)} />
          </label>

          <div className="cleanup-panel span-2">
            <div>
              <h3>{tr("Background Color", "背景颜色")}</h3>
              <p>{tr("Choose the color to make transparent. Increase edge softness when you see leftover color around the subject.", "选择要变透明的背景色。如果主体边缘还有残色，就适当增加边缘柔化。")}</p>
            </div>
            <div className="cleanup-controls">
              <button className="secondary-button" onClick={() => setImageColor("#000000")}>{tr("Black", "黑色")}</button>
              <button className="secondary-button" onClick={() => setImageColor("#ffffff")}>{tr("White", "白色")}</button>
              <input type="color" value={imageColor} onChange={(event) => setImageColor(event.target.value)} />
              <label className="form-field">
                <span>{tr("Tolerance", "容差")}: {imageTolerance}</span>
                <input type="range" min="0" max="120" value={imageTolerance} onChange={(event) => setImageTolerance(Number(event.target.value))} />
              </label>
              <label className="form-field">
                <span>{tr("Edge softness", "边缘柔化")}: {imageFeather}</span>
                <input type="range" min="0" max="80" value={imageFeather} onChange={(event) => setImageFeather(Number(event.target.value))} />
              </label>
              <button onClick={handleRemoveImageBackground} disabled={imageLoading}>
                {imageLoading ? texts.common.generating : tr("Remove background", "去除背景")}
              </button>
            </div>
          </div>
        </div>

        {(imagePreviewUrl || imageResult) && (
          <div className="image-tool-preview">
            {imagePreviewUrl && (
              <div className="animation-preview">
                <h3>{tr("Original", "原图")}</h3>
                <div className="animation-stage">
                  <img src={imagePreviewUrl} alt="original asset" />
                </div>
              </div>
            )}
            {imageResult && (
              <div className="animation-preview">
                <h3>{tr("Transparent PNG", "透明 PNG")}</h3>
                <div className="animation-stage">
                  <img src={outputUrl(imageResult.image_path)} alt="transparent asset" />
                </div>
                <div className="download-row">
                  <button onClick={() => downloadFile(imageResult.image_path)}>
                    {texts.common.download} PNG
                  </button>
                  {imageResult.zip_path && (
                    <button className="secondary-button" onClick={() => downloadFile(imageResult.zip_path)}>
                      {texts.common.download} ZIP
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {imageError && <div className="error-box">{imageError}</div>}
      </section>
    </div>
  );
}

function AnimationPreview({ frames, getUrl, label, playText, pauseText }) {
  const [playing, setPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const [speed, setSpeed] = useState(16);

  useEffect(() => {
    if (!playing || frames.length === 0) return undefined;
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % frames.length);
    }, Math.max(30, 1000 / speed));
    return () => window.clearInterval(timer);
  }, [frames.length, playing, speed]);

  useEffect(() => {
    if (current >= frames.length) {
      setCurrent(0);
    }
  }, [current, frames.length]);

  if (frames.length === 0) {
    return <div className="animation-preview empty-state">{label}</div>;
  }

  return (
    <div className="animation-preview">
      <div className="block-header">
        <h3>{label}</h3>
        <button className="secondary-button" onClick={() => setPlaying((value) => !value)}>
          {playing ? pauseText : playText}
        </button>
      </div>
      <div className="animation-stage">
        <img src={getUrl(frames[current].path)} alt="animation preview" />
      </div>
      <label className="form-field">
        <span>FPS</span>
        <input type="range" min="1" max="30" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
      </label>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="toggle-field">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function buildImportSettings(result, target, texts, tr) {
  if (target === "unity") {
    const items = [
      { label: "Texture Type", value: "Sprite (2D and UI)" },
      { label: "Sprite Mode", value: "Multiple" },
      { label: "Cell Size", value: `${result.frame_width} x ${result.frame_height}` },
      { label: "Frame Count", value: String(result.frame_count) },
    ];
    return { items, copyText: formatImportText("Unity", items) };
  }

  if (target === "godot") {
    const items = [
      { label: tr("Suggested node", "建议节点"), value: "AnimatedSprite2D / Sprite2D" },
      { label: "hframes", value: String(result.columns) },
      { label: "vframes", value: String(result.rows) },
      { label: "frame_count", value: String(result.frame_count) },
    ];
    return { items, copyText: formatImportText("Godot", items) };
  }

  const items = [
    { label: tr("Slice mode", "切片方式"), value: tr("Fixed cell size", "固定单元格尺寸") },
    { label: tr("Cell size", "单元格尺寸"), value: `${result.frame_width} x ${result.frame_height}` },
    { label: tr("Grid", "行列"), value: `${result.columns} x ${result.rows}` },
    { label: tr("Frame count", "帧数"), value: String(result.frame_count) },
  ];
  return { items, copyText: formatImportText(texts.common.generic, items) };
}

function formatImportText(title, items) {
  return [title, ...items.map((item) => `${item.label}: ${item.value}`)].join("\n");
}

function formatTarget(value, texts) {
  if (value === "godot") return texts.common.godot;
  if (value === "unity") return texts.common.unity;
  return texts.common.generic;
}

function fitWithinLimit(width, height, limit) {
  if (width <= limit && height <= limit) {
    return { width, height };
  }

  const scale = limit / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function formatSeconds(value) {
  if (!Number.isFinite(value)) return "00:00.00";
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
}

export default AssetToolsPage;
