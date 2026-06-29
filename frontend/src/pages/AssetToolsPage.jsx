import { useEffect, useMemo, useState } from "react";

import {
  applyFrameTransparency,
  exportSelectedSpritesheet,
  generateSpritesheet,
  removeImageBackground,
} from "../api/assetsApi";
import { downloadFile } from "../api/fileApi";
import { AuthenticatedImage } from "../components/AuthenticatedMedia";
import PageTabs from "../components/PageTabs";
import WorkspaceHeader from "../components/WorkspaceHeader";
import { useI18n } from "../i18n/useI18n";

function AssetToolsPage() {
  const { texts } = useI18n();
  const assetText = texts.assets;

  const [video, setVideo] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [targetFrameCount, setTargetFrameCount] = useState(16);
  const [columns, setColumns] = useState(4);
  const [frameWidth, setFrameWidth] = useState(128);
  const [frameHeight, setFrameHeight] = useState(128);
  const [metadataTarget, setMetadataTarget] = useState("godot");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [transparentColor, setTransparentColor] = useState("#000000");
  const [transparentTolerance, setTransparentTolerance] = useState(24);
  const [transparentFeather, setTransparentFeather] = useState(16);
  const [selectedFrames, setSelectedFrames] = useState([]);
  const [result, setResult] = useState(null);
  const [cacheBust, setCacheBust] = useState(0);
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
  const [activeTab, setActiveTab] = useState("video");

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [videoPreviewUrl, imagePreviewUrl]);

  const duration = videoInfo?.duration || 0;
  const estimatedSourceFrames = useMemo(() => {
    const rangeDuration = Math.max(0, (endTime || duration) - startTime);
    if (!rangeDuration) return 0;
    return Math.max(1, Math.round(rangeDuration * (videoInfo?.fps || 30)));
  }, [duration, endTime, startTime, videoInfo]);

  const selectedFrameItems = useMemo(
    () => result?.frames.filter((frame) => selectedFrames.includes(frame.index)) || [],
    [result, selectedFrames],
  );

  const importSettings = useMemo(
    () => (result ? buildImportSettings(result, metadataTarget, texts) : null),
    [metadataTarget, result, texts],
  );

  function handleVideoChange(file) {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideo(file);
    setResult(null);
    setSelectedFrames([]);
    setCopyMessage("");
    setError("");

    if (!file) {
      setVideoInfo(null);
      setVideoPreviewUrl("");
      setStartTime(0);
      setEndTime(0);
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    const element = document.createElement("video");
    element.preload = "metadata";
    element.src = url;
    element.onloadedmetadata = () => {
      const width = element.videoWidth || 128;
      const height = element.videoHeight || 128;
      const size = fitWithinLimit(width, height, 2048);
      const loadedDuration = Number((element.duration || 0).toFixed(2));
      setVideoInfo({ name: file.name, width, height, duration: loadedDuration, fps: 30 });
      setFrameWidth(size.width);
      setFrameHeight(size.height);
      setStartTime(0);
      setEndTime(loadedDuration);
      setTargetFrameCount((current) => Math.min(current, Math.max(1, Math.round(loadedDuration * 30))));
    };
  }

  function handleImageChange(file) {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
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
    if (estimatedSourceFrames > 0 && targetFrameCount > estimatedSourceFrames) {
      setError(assetText.errors.targetFramesTooHigh.replace("{count}", estimatedSourceFrames));
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
        fps: 16,
        maxFrames: targetFrameCount,
        targetFrameCount,
        columns,
        frameWidth,
        frameHeight,
        metadataTarget,
        startTime,
        endTime,
        extractionMode: "fps",
        frameInterval: 1,
        dedupeEnabled: false,
        dedupeThreshold: 96,
      });
      setResult(data);
      setSelectedFrames(data.frames.map((frame) => frame.index));
      setCacheBust(Date.now());
      setActiveTab("cleanup");
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
        gifFps: 16,
      });
      setResult(data);
      setSelectedFrames(data.frames.map((frame) => frame.index));
      setCacheBust(Date.now());
      setActiveTab("result");
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
        gifFps: 16,
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
      setImageError(assetText.errors.noImage);
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
      setCacheBust(Date.now());
    } catch (err) {
      setImageError(err.message || assetText.errors.imageBackground);
    } finally {
      setImageLoading(false);
    }
  }

  async function copyImportSettings() {
    if (!importSettings) return;
    await navigator.clipboard.writeText(importSettings.copyText);
    setCopyMessage(assetText.importCopied);
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
    <div className="page workspace-page asset-tools-page">
      <WorkspaceHeader
        capability="local"
        capabilityLabel={texts.sidebar.capabilities.local}
        eyebrow={assetText.eyebrow}
        icon="assets"
        intro={assetText.intro}
        title={assetText.title}
      />

      <section className="tabs-panel">
        <PageTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "video", icon: "video", label: assetText.videoTitle },
            { id: "cleanup", icon: "cleanup", label: assetText.previewCleanup },
            { id: "result", icon: "result", label: assetText.resultTitle },
            { id: "image", icon: "image", label: assetText.imageTitle },
          ]}
        />
      </section>

      {activeTab === "video" && (
      <section className="panel">
        <div className="section-step">
          <span>1</span>
          <h2>{assetText.videoTitle}</h2>
        </div>

        <div className="asset-video-workspace">
          <div className="asset-video-main">
            <DropZone
              label={assetText.videoFile}
              title={assetText.dropVideoTitle}
              hint={assetText.dropVideoHint}
              accept="video/*"
              onFile={handleVideoChange}
            />

            {videoInfo && (
              <div className="asset-info">
                <strong>{videoInfo.name}</strong>
                <span>
                  {videoInfo.width}x{videoInfo.height} / {assetText.duration}: {formatSeconds(videoInfo.duration)} / {assetText.estimatedFrames}: {estimatedSourceFrames}
                </span>
              </div>
            )}

            {videoPreviewUrl && (
              <div className="video-preview-panel">
                <div className="block-header">
                  <h3>{assetText.videoPreview}</h3>
                  <span>{assetText.localPreview}</span>
                </div>
                <video src={videoPreviewUrl} controls preload="metadata" />
              </div>
            )}

            <div className="compact-card asset-output-card">
              <div className="block-header">
                <h3>{assetText.outputSummary}</h3>
              </div>
              <div className="compact-fields-4">
                <NumberField
                  label={assetText.targetFrames}
                  value={targetFrameCount}
                  onChange={(value) => setTargetFrameCount(clampFrameCount(value, estimatedSourceFrames))}
                  min={1}
                  max={estimatedSourceFrames || 512}
                />
                <NumberField label={assetText.columns} value={columns} onChange={setColumns} />
                <NumberField label={assetText.frameWidth} value={frameWidth} onChange={setFrameWidth} />
                <NumberField label={assetText.frameHeight} value={frameHeight} onChange={setFrameHeight} />
              </div>
              <div className="compact-fields-auto">
                <label className="form-field">
                  <span>{assetText.metadataTarget}</span>
                  <select value={metadataTarget} onChange={(event) => setMetadataTarget(event.target.value)}>
                    <option value="godot">{texts.common.godot}</option>
                    <option value="unity">{texts.common.unity}</option>
                    <option value="generic">{texts.common.generic}</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="action-row asset-primary-action">
              <button onClick={handleGenerate} disabled={loading}>
                {loading ? texts.common.generating : assetText.generate}
              </button>
            </div>
          </div>

          <aside className="asset-video-side">
            <div className="time-input-panel">
              <div className="block-header">
                <h3>{assetText.timeRange}</h3>
                <span>{assetText.timeRangeHint}</span>
              </div>
              <NumberField label={assetText.startSeconds} value={startTime} onChange={setStartTime} step="0.01" />
              <NumberField label={assetText.endSeconds} value={endTime} onChange={setEndTime} step="0.01" />
            </div>

            <div className="hint-box">
              {assetText.targetFramesHint.replace("{count}", estimatedSourceFrames || "-")}
            </div>
          </aside>
        </div>
        {error && <div className="error-box">{error}</div>}
      </section>
      )}

      {activeTab === "cleanup" && result && (
        <section className="panel">
          <div className="section-step">
            <span>2</span>
            <h2>{assetText.previewCleanup}</h2>
          </div>

          <div className="scan-note">
            {assetText.summary
              .replace("{frames}", result.frame_count)
              .replace("{columns}", result.columns)
              .replace("{rows}", result.rows)
              .replace("{width}", result.frame_width)
              .replace("{height}", result.frame_height)}
            {" / "}
            {assetText.selected}: {selectedFrames.length}
          </div>

          <div className="cleanup-panel">
            <div>
              <h3>{assetText.transparentTitle}</h3>
              <p>{assetText.transparentGuide}</p>
            </div>
            <TransparencyControls
              texts={texts}
              color={transparentColor}
              setColor={setTransparentColor}
              tolerance={transparentTolerance}
              setTolerance={setTransparentTolerance}
              feather={transparentFeather}
              setFeather={setTransparentFeather}
              actionLabel={assetText.applyAllFrames}
              loading={processingTransparency}
              onAction={handleApplyTransparency}
            />
          </div>

          <div className="action-row compact">
            <button className="secondary-button" onClick={selectAll}>{assetText.selectAll}</button>
            <button className="secondary-button" onClick={invertSelection}>{assetText.invert}</button>
            <button className="secondary-button" onClick={clearSelection}>{texts.common.clear}</button>
            <button onClick={handleExportSelected} disabled={exporting || selectedFrames.length === 0}>
              {exporting ? texts.common.generating : assetText.exportSelected}
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
                  <AuthenticatedImage
                    path={frame.path}
                    version={cacheBust}
                    alt={`source frame ${frame.source_frame}`}
                  />
                  <span>
                    {assetText.outputFrameShort} {String(frame.index).padStart(2, "0")} / {assetText.sourceFrameShort} {String(frame.source_frame + 1).padStart(3, "0")}
                  </span>
                </button>
              ))}
            </div>

            <AnimationPreview frames={selectedFrameItems} version={cacheBust} texts={assetText} />
          </div>
        </section>
      )}

      {activeTab === "cleanup" && !result && (
        <section className="panel">
          <div className="empty-state">{assetText.previewCleanup}</div>
        </section>
      )}

      {activeTab === "result" && result && (
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
                <AuthenticatedImage
                  path={result.spritesheet_path}
                  version={cacheBust}
                  alt="generated spritesheet"
                />
              </div>
            </div>

            <div className="import-settings-card">
              <h3>{assetText.outputSummary}</h3>
              <div className="output-summary-grid">
                <SummaryItem label={assetText.outputId} value={result.output_id} />
                <SummaryItem label={assetText.frames} value={result.frame_count} />
                <SummaryItem label={assetText.grid} value={`${result.columns} x ${result.rows}`} />
                <SummaryItem label={assetText.frameSize} value={`${result.frame_width}x${result.frame_height}`} />
                <SummaryItem label={assetText.sheetSize} value={`${result.columns * result.frame_width}x${result.rows * result.frame_height}`} />
                <SummaryItem label={assetText.metadataTarget} value={formatTarget(metadataTarget, texts)} />
              </div>

              {importSettings && (
                <>
                  <div className="block-header import-header">
                    <h3>{assetText.importSettings}</h3>
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

      {activeTab === "result" && !result && (
        <section className="panel">
          <div className="empty-state">{assetText.resultTitle}</div>
        </section>
      )}

      {activeTab === "image" && (
      <section className="panel">
        <div className="section-step">
          <span>4</span>
          <h2>{assetText.imageTitle}</h2>
        </div>

        <div className="settings-grid">
          <DropZone
            label={assetText.imageFile}
            title={assetText.dropImageTitle}
            hint={assetText.dropImageHint}
            accept="image/png,image/jpeg,image/webp"
            onFile={handleImageChange}
          />

          <div className="cleanup-panel span-2">
            <div>
              <h3>{assetText.backgroundColor}</h3>
              <p>{assetText.transparentGuide}</p>
            </div>
            <TransparencyControls
              texts={texts}
              color={imageColor}
              setColor={setImageColor}
              tolerance={imageTolerance}
              setTolerance={setImageTolerance}
              feather={imageFeather}
              setFeather={setImageFeather}
              actionLabel={assetText.removeBackground}
              loading={imageLoading}
              onAction={handleRemoveImageBackground}
            />
          </div>
        </div>

        {(imagePreviewUrl || imageResult) && (
          <div className="image-tool-preview">
            {imagePreviewUrl && (
              <div className="animation-preview">
                <h3>{assetText.original}</h3>
                <div className="animation-stage">
                  <img src={imagePreviewUrl} alt="original asset" />
                </div>
              </div>
            )}
            {imageResult && (
              <div className="animation-preview">
                <h3>{assetText.transparentPng}</h3>
                <div className="animation-stage">
                  <AuthenticatedImage
                    path={imageResult.image_path}
                    version={cacheBust}
                    alt="transparent asset"
                  />
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
      )}
    </div>
  );
}

function DropZone({ label, title, hint, accept, onFile }) {
  const [dragActive, setDragActive] = useState(false);

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      className={dragActive ? "drop-zone active span-2" : "drop-zone span-2"}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <input type="file" accept={accept} onChange={(event) => onFile(event.target.files?.[0] || null)} />
      <span>{label}</span>
      <strong>{title}</strong>
      <small>{hint}</small>
    </label>
  );
}

function TransparencyControls({
  texts,
  color,
  setColor,
  tolerance,
  setTolerance,
  feather,
  setFeather,
  actionLabel,
  loading,
  onAction,
}) {
  const assetText = texts.assets;

  return (
    <div className="cleanup-controls">
      <button className="secondary-button" onClick={() => setColor("#000000")}>{assetText.black}</button>
      <button className="secondary-button" onClick={() => setColor("#ffffff")}>{assetText.white}</button>
      <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
      <label className="form-field">
        <span>{assetText.tolerance}: {tolerance}</span>
        <input type="range" min="0" max="120" value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} />
      </label>
      <label className="form-field">
        <span>{assetText.edgeSoftness}: {feather}</span>
        <input type="range" min="0" max="80" value={feather} onChange={(event) => setFeather(Number(event.target.value))} />
      </label>
      <button onClick={onAction} disabled={loading}>
        {loading ? texts.common.generating : actionLabel}
      </button>
    </div>
  );
}

function AnimationPreview({ frames, version, texts }) {
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

  if (frames.length === 0) {
    return <div className="animation-preview empty-state">{texts.animationPreview}</div>;
  }

  const safeCurrent = current % frames.length;

  return (
    <div className="animation-preview">
      <div className="block-header">
        <h3>{texts.animationPreview}</h3>
        <button className="secondary-button" onClick={() => setPlaying((value) => !value)}>
          {playing ? texts.pause : texts.play}
        </button>
      </div>
      <div className="animation-stage">
        <AuthenticatedImage
          path={frames[safeCurrent].path}
          version={version}
          alt="animation preview"
        />
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

function NumberField({ label, value, onChange, step = "1", min, max }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function buildImportSettings(result, target, texts) {
  const assetText = texts.assets;

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
      { label: assetText.suggestedNode, value: "AnimatedSprite2D / Sprite2D" },
      { label: "hframes", value: String(result.columns) },
      { label: "vframes", value: String(result.rows) },
      { label: "frame_count", value: String(result.frame_count) },
    ];
    return { items, copyText: formatImportText("Godot", items) };
  }

  const items = [
    { label: assetText.sliceMode, value: assetText.fixedCellSize },
    { label: assetText.cellSize, value: `${result.frame_width} x ${result.frame_height}` },
    { label: assetText.grid, value: `${result.columns} x ${result.rows}` },
    { label: assetText.frames, value: String(result.frame_count) },
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
  if (width <= limit && height <= limit) return { width, height };
  const scale = limit / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function clampFrameCount(value, estimatedSourceFrames) {
  const fallbackMax = estimatedSourceFrames || 512;
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(Math.floor(value), fallbackMax));
}

function formatSeconds(value) {
  if (!Number.isFinite(value)) return "00:00.00";
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
}

export default AssetToolsPage;
