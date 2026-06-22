import { useState } from "react";

import { generateArtPrompt, submitComfyPrompt } from "../api/artApi";
import { useI18n } from "../i18n/I18nContext";

const assetTypeValues = ["character", "item", "environment", "ui_icon", "sprite", "tileset", "concept_art"];
const styleValues = ["pixel_art", "hand_painted", "low_poly", "anime", "realistic", "flat_vector"];
const engineTargetValues = ["godot", "unity", "generic"];

function ArtPipelinePage() {
  const { texts } = useI18n();
  const artText = texts.art;
  const [description, setDescription] = useState(artText.exampleDescription);
  const [assetType, setAssetType] = useState("character");
  const [style, setStyle] = useState("pixel_art");
  const [engineTarget, setEngineTarget] = useState("godot");
  const [mood, setMood] = useState(artText.defaultMood);
  const [colorPalette, setColorPalette] = useState(artText.defaultPalette);
  const [result, setResult] = useState(null);
  const [comfyResult, setComfyResult] = useState(null);
  const [comfyLoading, setComfyLoading] = useState(false);
  const [comfyError, setComfyError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function buildPayload() {
    return {
      description: description.trim(),
      asset_type: assetType,
      style,
      engine_target: engineTarget,
      mood: mood.trim(),
      color_palette: colorPalette.trim(),
    };
  }

  async function handleGenerate() {
    if (!description.trim()) {
      setError(artText.errors.emptyDescription);
      return;
    }

    setLoading(true);
    setError("");
    setComfyError("");
    setComfyResult(null);
    setResult(null);

    try {
      setResult(await generateArtPrompt(buildPayload()));
    } catch (err) {
      setError(err.message || artText.errors.generate);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComfy() {
    if (!description.trim()) {
      setComfyError(artText.errors.emptyDescription);
      return;
    }

    setComfyLoading(true);
    setComfyError("");
    setComfyResult(null);

    try {
      const data = await submitComfyPrompt(buildPayload());
      if (data.submitted) {
        setComfyResult(data);
      } else {
        setComfyError(data.message);
      }
    } catch (err) {
      setComfyError(err.message || artText.errors.comfySubmit);
    } finally {
      setComfyLoading(false);
    }
  }

  function fillExample() {
    setDescription(artText.exampleDescription);
    setAssetType("character");
    setStyle("pixel_art");
    setEngineTarget("godot");
    setMood(artText.defaultMood);
    setColorPalette(artText.defaultPalette);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">{texts.common.phase3}</div>
          <h1>{artText.title}</h1>
          <p>{artText.intro}</p>
        </div>
      </div>

      <section className="panel">
        <h2>{artText.briefTitle}</h2>
        <div className="art-form-grid">
          <label className="form-field span-2">
            <span>{artText.descriptionLabel}</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder={artText.descriptionPlaceholder}
            />
          </label>

          <SelectField label={artText.assetType} value={assetType} onChange={setAssetType} options={assetTypeValues} labels={artText.assetTypes} />
          <SelectField label={artText.style} value={style} onChange={setStyle} options={styleValues} labels={artText.styles} />

          <label className="form-field">
            <span>{artText.engineTarget}</span>
            <select value={engineTarget} onChange={(event) => setEngineTarget(event.target.value)}>
              {engineTargetValues.map((value) => (
                <option key={value} value={value}>{formatEngineLabel(value, texts.common)}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>{artText.mood}</span>
            <input value={mood} onChange={(event) => setMood(event.target.value)} placeholder={artText.moodPlaceholder} />
          </label>

          <label className="form-field span-2">
            <span>{artText.colorPalette}</span>
            <input value={colorPalette} onChange={(event) => setColorPalette(event.target.value)} placeholder={artText.colorPlaceholder} />
          </label>
        </div>

        <div className="action-row">
          <button onClick={handleGenerate} disabled={loading}>
            {loading ? texts.common.generating : artText.generate}
          </button>
          <button className="secondary-button" onClick={fillExample} disabled={loading}>
            {texts.common.fillExample}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
      </section>

      {result && (
        <ArtPipelineResult
          result={result}
          texts={texts}
          comfyResult={comfyResult}
          comfyLoading={comfyLoading}
          comfyError={comfyError}
          onSubmitComfy={handleSubmitComfy}
        />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options, labels }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{labels[option]}</option>
        ))}
      </select>
    </label>
  );
}

function ArtPipelineResult({ result, texts, comfyResult, comfyLoading, comfyError, onSubmitComfy }) {
  const artText = texts.art;

  return (
    <section className="panel">
      <div className="result-header">
        <div>
          <h2>{result.title}</h2>
          <p>
            {formatAssetLabel(result.asset_type, artText)} · {formatStyleLabel(result.style, artText)} ·{" "}
            {formatEngineLabel(result.engine_target, texts.common)}
          </p>
        </div>
        <div className="result-actions">
          <button className="secondary-button copy-button" onClick={() => copyAll(result, artText)}>
            {texts.common.copyAll}
          </button>
          <button className="copy-button" onClick={onSubmitComfy} disabled={comfyLoading}>
            {comfyLoading ? texts.common.submitting : artText.submitComfy}
          </button>
        </div>
      </div>

      {comfyResult && (
        <div className="scan-note">
          {artText.comfyResult}: {comfyResult.message} {comfyResult.prompt_id || ""}
        </div>
      )}
      {comfyError && <div className="error-box">{comfyError}</div>}

      <div className="art-output-grid">
        <OutputBlock title={artText.output.positive} text={result.positive_prompt} copyTextLabel={texts.common.copy} />
        <OutputBlock title={artText.output.negative} text={result.negative_prompt} copyTextLabel={texts.common.copy} />

        <div className="result-block">
          <div className="block-header">
            <h3>{artText.output.tags}</h3>
            <button className="secondary-button" onClick={() => copyText(result.style_tags.join(", "))}>{texts.common.copy}</button>
          </div>
          <div className="tag-list">
            {result.style_tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>

        <div className="result-block">
          <h3>{artText.output.naming}</h3>
          <div className="rule-list">
            {result.asset_naming_rules.map((rule) => (
              <div className="rule-row" key={rule.category}>
                <strong>{rule.category}</strong>
                <code>{rule.pattern}</code>
                <span>{rule.example}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="result-block">
          <h3>{artText.output.importGuide}</h3>
          <div className="guide-list">
            {result.import_guide.map((step) => (
              <div className="guide-step" key={step.title}>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="result-block">
          <h3>{artText.output.productionNotes}</h3>
          <ul className="note-list">
            {result.production_notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </div>

        <div className="result-block">
          <div className="block-header">
            <h3>{artText.workflow}</h3>
            <button className="secondary-button" onClick={() => copyText(JSON.stringify(result.comfyui_workflow, null, 2))}>
              {texts.common.copy}
            </button>
          </div>
          <p>{artText.workflowHint}</p>
          <pre className="json-view">{JSON.stringify(result.comfyui_workflow, null, 2)}</pre>
        </div>
      </div>
    </section>
  );
}

function OutputBlock({ title, text, copyTextLabel }) {
  return (
    <div className="result-block">
      <div className="block-header">
        <h3>{title}</h3>
        <button className="secondary-button" onClick={() => copyText(text)}>{copyTextLabel}</button>
      </div>
      <p className="prompt-text">{text}</p>
    </div>
  );
}

function formatAssetLabel(value, artText) {
  return artText.assetTypes[value] || formatFallbackLabel(value);
}

function formatStyleLabel(value, artText) {
  return artText.styles[value] || formatFallbackLabel(value);
}

function formatEngineLabel(value, commonText) {
  if (value === "godot") return commonText.godot;
  if (value === "unity") return commonText.unity;
  return commonText.generic;
}

function formatFallbackLabel(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function copyText(text) {
  navigator.clipboard.writeText(text);
}

function copyAll(result, artText) {
  const text = [
    `# ${result.title}`,
    "",
    `## ${artText.output.positive}`,
    result.positive_prompt,
    "",
    `## ${artText.output.negative}`,
    result.negative_prompt,
    "",
    `## ${artText.output.tags}`,
    result.style_tags.join(", "),
    "",
    `## ${artText.output.naming}`,
    ...result.asset_naming_rules.map((rule) => `${rule.category}: ${rule.pattern} (${rule.example})`),
    "",
    `## ${artText.output.importGuide}`,
    ...result.import_guide.map((step) => `${step.title}: ${step.detail}`),
    "",
    `## ${artText.workflow}`,
    JSON.stringify(result.comfyui_workflow, null, 2),
  ].join("\n");

  copyText(text);
}

export default ArtPipelinePage;
