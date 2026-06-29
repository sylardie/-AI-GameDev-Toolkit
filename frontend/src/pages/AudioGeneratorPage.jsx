import { useState } from "react";

import { generateAudio } from "../api/audioApi";
import { downloadFile } from "../api/fileApi";
import { AuthenticatedAudio } from "../components/AuthenticatedMedia";
import { useI18n } from "../i18n/useI18n";
import WorkspaceHeader from "../components/WorkspaceHeader";

function AudioGeneratorPage() {
  const { texts } = useI18n();
  const audioText = texts.audio;
  const [generatedResult, setGeneratedResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationKind, setGenerationKind] = useState("sfx");
  const [generationEngine, setGenerationEngine] = useState("custom_api");
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generationDuration, setGenerationDuration] = useState(5);
  const [generationLoopable, setGenerationLoopable] = useState(false);
  const [generationStyle, setGenerationStyle] = useState("");
  const [generationScene, setGenerationScene] = useState("");
  const [generationFormat, setGenerationFormat] = useState("wav");

  async function handleGenerate() {
    if (!generationPrompt.trim()) {
      setGenerationError(audioText.errors.emptyPrompt);
      return;
    }

    setGenerating(true);
    setGenerationError("");
    setGeneratedResult(null);

    try {
      setGeneratedResult(
        await generateAudio({
          engine: generationEngine,
          kind: generationKind,
          prompt: generationPrompt,
          duration: generationDuration,
          loopable: generationLoopable,
          style: generationStyle,
          scene: generationScene,
          output_format: generationFormat,
        }),
      );
    } catch (err) {
      setGenerationError(err.message || audioText.errors.generate);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="page workspace-page audio-workspace-page">
      <WorkspaceHeader
        capability="ai"
        capabilityLabel={texts.sidebar.capabilities.ai}
        eyebrow={audioText.generatorEyebrow}
        icon="audioGenerator"
        intro={audioText.generateIntro}
        title={audioText.generateTitle}
      />

      <section className="panel primary-workspace-panel audio-generate-panel">
        <div className="settings-grid">
          <label className="form-field">
            <span>{audioText.assetKind}</span>
            <select value={generationKind} onChange={(event) => setGenerationKind(event.target.value)}>
              <option value="music">{audioText.music}</option>
              <option value="sfx">{audioText.sfx}</option>
            </select>
          </label>
          <label className="form-field">
            <span>{audioText.engine}</span>
            <select value={generationEngine} onChange={(event) => setGenerationEngine(event.target.value)}>
              <option value="custom_api">{audioText.customApi}</option>
              <option value="comfyui">ComfyUI</option>
            </select>
          </label>
          <NumberField label={audioText.durationSeconds} value={generationDuration} onChange={setGenerationDuration} step="0.1" />
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={generationLoopable}
              onChange={(event) => setGenerationLoopable(event.target.checked)}
            />
            <span>{audioText.loopable}</span>
          </label>
          <label className="form-field span-4">
            <span>{audioText.prompt}</span>
            <textarea
              rows={5}
              value={generationPrompt}
              onChange={(event) => setGenerationPrompt(event.target.value)}
              placeholder={audioText.promptPlaceholder}
            />
          </label>
          <label className="form-field span-2">
            <span>{audioText.style}</span>
            <input value={generationStyle} onChange={(event) => setGenerationStyle(event.target.value)} />
          </label>
          <label className="form-field span-2">
            <span>{audioText.scene}</span>
            <input value={generationScene} onChange={(event) => setGenerationScene(event.target.value)} />
          </label>
          <label className="form-field">
            <span>{audioText.outputFormat}</span>
            <select value={generationFormat} onChange={(event) => setGenerationFormat(event.target.value)}>
              <option value="wav">WAV</option>
              <option value="ogg">OGG</option>
              <option value="mp3">MP3</option>
            </select>
          </label>
        </div>

        <div className="hint-box">{audioText.generateHint}</div>

        <div className="action-row">
          <button onClick={handleGenerate} disabled={generating}>
            {generating ? texts.common.generating : audioText.generate}
          </button>
        </div>
        {generationError && <div className="error-box">{generationError}</div>}
      </section>

      {generatedResult && (
        <section className="panel audio-result-panel">
          <h2>{audioText.generatedResultTitle}</h2>
          <div className="output-summary-grid">
            <SummaryItem label={audioText.outputId} value={generatedResult.output_id} />
            <SummaryItem label={audioText.assetKind} value={generatedResult.kind.toUpperCase()} />
            <SummaryItem label={audioText.engine} value={generatedResult.engine} />
            <SummaryItem label={audioText.outputFormat} value={generatedResult.format.toUpperCase()} />
            <SummaryItem label={audioText.duration} value={formatSeconds(generatedResult.duration)} />
          </div>

          <div className="audio-preview-card">
            <h3>{audioText.generatedPreview}</h3>
            <AuthenticatedAudio path={generatedResult.audio_path} controls />
          </div>

          <div className="download-row">
            <button onClick={() => downloadFile(generatedResult.audio_path)}>
              {texts.common.download} {audioText.audioFile}
            </button>
            <button className="secondary-button" onClick={() => downloadFile(generatedResult.metadata_path)}>
              {texts.common.download} Metadata
            </button>
            {generatedResult.zip_path && (
              <button className="secondary-button" onClick={() => downloadFile(generatedResult.zip_path)}>
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

export default AudioGeneratorPage;
