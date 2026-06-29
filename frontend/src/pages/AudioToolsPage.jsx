import { useEffect, useState } from "react";

import { processAudio } from "../api/audioApi";
import { downloadFile } from "../api/fileApi";
import { AuthenticatedAudio } from "../components/AuthenticatedMedia";
import { useI18n } from "../i18n/useI18n";
import WorkspaceHeader from "../components/WorkspaceHeader";

function AudioToolsPage() {
  const { texts } = useI18n();
  const audioText = texts.audio;
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [audioInfo, setAudioInfo] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [normalizeEnabled, setNormalizeEnabled] = useState(true);
  const [targetLufs, setTargetLufs] = useState(-16);
  const [outputFormat, setOutputFormat] = useState("wav");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  function handleAudioFile(file) {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioFile(file);
    setAudioInfo(null);
    setResult(null);
    setError("");

    if (!file) {
      setAudioPreviewUrl("");
      setStartTime(0);
      setEndTime(0);
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioPreviewUrl(url);
    const element = document.createElement("audio");
    element.preload = "metadata";
    element.src = url;
    element.onloadedmetadata = () => {
      const duration = Number((element.duration || 0).toFixed(2));
      setAudioInfo({ name: file.name, duration, size: file.size });
      setStartTime(0);
      setEndTime(duration);
    };
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleAudioFile(file);
  }

  async function handleProcess() {
    if (!audioFile) {
      setError(audioText.errors.noFile);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      setResult(
        await processAudio({
          audio: audioFile,
          startTime,
          endTime,
          normalizeEnabled,
          targetLufs,
          outputFormat,
        }),
      );
    } catch (err) {
      setError(err.message || audioText.errors.process);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page workspace-page audio-workspace-page">
      <WorkspaceHeader
        capability="local"
        capabilityLabel={texts.sidebar.capabilities.local}
        eyebrow={audioText.eyebrow}
        icon="audio"
        intro={audioText.intro}
        title={audioText.title}
      />

      <section className="panel primary-workspace-panel audio-upload-panel">
        <h2>{audioText.uploadTitle}</h2>
        <label
          className={dragActive ? "drop-zone active" : "drop-zone"}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={(event) => handleAudioFile(event.target.files?.[0] || null)}
          />
          <strong>{audioText.dropTitle}</strong>
          <span>{audioText.dropHint}</span>
        </label>

        {audioInfo && (
          <div className="asset-info">
            <strong>{audioInfo.name}</strong>
            <span>{audioText.duration}: {formatSeconds(audioInfo.duration)}</span>
          </div>
        )}

        {audioPreviewUrl && (
          <div className="audio-preview-card">
            <h3>{audioText.preview}</h3>
            <audio src={audioPreviewUrl} controls />
          </div>
        )}
      </section>

      <section className="panel audio-process-panel">
        <h2>{audioText.processTitle}</h2>
        <div className="settings-grid">
          <NumberField label={audioText.startSeconds} value={startTime} onChange={setStartTime} step="0.01" />
          <NumberField label={audioText.endSeconds} value={endTime} onChange={setEndTime} step="0.01" />
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={normalizeEnabled}
              onChange={(event) => setNormalizeEnabled(event.target.checked)}
            />
            <span>{audioText.normalize}</span>
          </label>
          <NumberField label={audioText.targetLufs} value={targetLufs} onChange={setTargetLufs} step="1" />
          <label className="form-field">
            <span>{audioText.outputFormat}</span>
            <select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)}>
              <option value="wav">WAV</option>
              <option value="ogg">OGG</option>
              <option value="mp3">MP3</option>
            </select>
          </label>
        </div>

        <div className="hint-box">{audioText.processHint}</div>

        <div className="action-row">
          <button onClick={handleProcess} disabled={loading}>
            {loading ? texts.common.generating : audioText.process}
          </button>
        </div>
        {error && <div className="error-box">{error}</div>}
      </section>

      {result && (
        <section className="panel audio-result-panel">
          <h2>{audioText.resultTitle}</h2>
          <div className="output-summary-grid">
            <SummaryItem label={audioText.outputId} value={result.output_id} />
            <SummaryItem label={audioText.outputFormat} value={result.format.toUpperCase()} />
            <SummaryItem label={audioText.sampleRate} value={`${result.sample_rate} Hz`} />
            <SummaryItem label={audioText.duration} value={formatSeconds(result.duration)} />
          </div>

          <div className="audio-preview-card">
            <h3>{audioText.processedPreview}</h3>
            <AuthenticatedAudio path={result.audio_path} controls />
          </div>

          <div className="download-row">
            <button onClick={() => downloadFile(result.audio_path)}>
              {texts.common.download} {audioText.audioFile}
            </button>
            <button className="secondary-button" onClick={() => downloadFile(result.metadata_path)}>
              {texts.common.download} Metadata
            </button>
            {result.zip_path && (
              <button className="secondary-button" onClick={() => downloadFile(result.zip_path)}>
                {texts.common.download} ZIP
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange, step = "1" }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
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

function formatSeconds(value) {
  if (!Number.isFinite(value)) return "00:00.00";
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
}

export default AudioToolsPage;
