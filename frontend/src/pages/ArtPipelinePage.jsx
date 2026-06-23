import { useEffect, useState } from "react";

import {
  analyzeArtImage,
  createStyleProfile,
  deleteStyleProfile,
  generateArtImage,
  generateArtPrompt,
  getStyleProfiles,
  submitComfyPrompt,
} from "../api/artApi";
import { downloadFile } from "../api/fileApi";
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

  const [profiles, setProfiles] = useState([]);
  const [profileError, setProfileError] = useState("");
  const [imagePrompt, setImagePrompt] = useState(artText.imagePromptExample);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [styleProfileId, setStyleProfileId] = useState("");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [imageCount, setImageCount] = useState(1);
  const [imageResult, setImageResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  const [analysisFile, setAnalysisFile] = useState(null);
  const [analysisPreview, setAnalysisPreview] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    return () => {
      if (analysisPreview) URL.revokeObjectURL(analysisPreview);
    };
  }, [analysisPreview]);

  async function loadProfiles() {
    try {
      const data = await getStyleProfiles();
      setProfiles(data.profiles || []);
    } catch (err) {
      setProfileError(err.message);
    }
  }

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
      const data = await generateArtPrompt(buildPayload());
      setResult(data);
      setImagePrompt(data.positive_prompt);
      setNegativePrompt(data.negative_prompt);
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
      if (data.submitted) setComfyResult(data);
      else setComfyError(data.message);
    } catch (err) {
      setComfyError(err.message || artText.errors.comfySubmit);
    } finally {
      setComfyLoading(false);
    }
  }

  async function handleImageGenerate() {
    if (!imagePrompt.trim()) {
      setImageError(artText.errors.emptyImagePrompt);
      return;
    }

    setImageLoading(true);
    setImageError("");
    setImageResult(null);

    try {
      setImageResult(
        await generateArtImage({
          prompt: imagePrompt.trim(),
          negative_prompt: negativePrompt.trim(),
          style_profile_id: styleProfileId,
          size: imageSize,
          count: Number(imageCount),
        }),
      );
    } catch (err) {
      setImageError(err.message || artText.errors.imageGenerate);
    } finally {
      setImageLoading(false);
    }
  }

  async function handleAnalyzeImage() {
    if (!analysisFile) {
      setAnalysisError(artText.errors.noImage);
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError("");
    setAnalysis(null);

    try {
      const data = await analyzeArtImage(analysisFile);
      setAnalysis(data.analysis);
      setProfileName(analysisFile.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setAnalysisError(err.message || artText.errors.imageAnalyze);
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function saveAnalysisAsProfile() {
    if (!analysis || !profileName.trim()) return;

    try {
      await createStyleProfile({
        name: profileName.trim(),
        ...analysis,
      });
      await loadProfiles();
    } catch (err) {
      setProfileError(err.message);
    }
  }

  async function removeProfile(profileId) {
    try {
      await deleteStyleProfile(profileId);
      if (styleProfileId === profileId) setStyleProfileId("");
      await loadProfiles();
    } catch (err) {
      setProfileError(err.message);
    }
  }

  function handleAnalysisFile(file) {
    if (analysisPreview) URL.revokeObjectURL(analysisPreview);
    setAnalysisFile(file);
    setAnalysis(null);
    setAnalysisError("");
    setAnalysisPreview(file ? URL.createObjectURL(file) : "");
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
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder={artText.descriptionPlaceholder} />
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

      <section className="panel">
        <h2>{artText.imageGenerationTitle}</h2>
        <div className="art-form-grid">
          <label className="form-field span-2">
            <span>{artText.imagePrompt}</span>
            <textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} rows={5} />
          </label>
          <label className="form-field span-2">
            <span>{artText.output.negative}</span>
            <textarea value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} rows={3} />
          </label>
          <label className="form-field">
            <span>{artText.styleProfile}</span>
            <select value={styleProfileId} onChange={(event) => setStyleProfileId(event.target.value)}>
              <option value="">{artText.noStyleProfile}</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>{artText.imageSize}</span>
            <select value={imageSize} onChange={(event) => setImageSize(event.target.value)}>
              <option value="1024x1024">1024x1024</option>
              <option value="1024x1536">1024x1536</option>
              <option value="1536x1024">1536x1024</option>
            </select>
          </label>
          <label className="form-field">
            <span>{artText.imageCount}</span>
            <input type="number" min="1" max="4" value={imageCount} onChange={(event) => setImageCount(event.target.value)} />
          </label>
        </div>
        <div className="action-row">
          <button onClick={handleImageGenerate} disabled={imageLoading}>
            {imageLoading ? texts.common.generating : artText.generateImage}
          </button>
        </div>
        {imageError && <div className="error-box">{imageError}</div>}
        {imageResult && <GeneratedImages result={imageResult} />}
      </section>

      <section className="panel">
        <h2>{artText.imageAnalyzeTitle}</h2>
        <div className="art-form-grid">
          <label className="form-field span-2">
            <span>{artText.referenceImage}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleAnalysisFile(event.target.files?.[0] || null)} />
          </label>
          {analysisPreview && (
            <div className="image-preview-card span-2">
              <img src={analysisPreview} alt="" />
            </div>
          )}
        </div>
        <div className="action-row">
          <button onClick={handleAnalyzeImage} disabled={analysisLoading}>
            {analysisLoading ? texts.common.generating : artText.analyzeImage}
          </button>
        </div>
        {analysisError && <div className="error-box">{analysisError}</div>}
        {analysis && (
          <AnalysisResult
            analysis={analysis}
            profileName={profileName}
            setProfileName={setProfileName}
            onSave={saveAnalysisAsProfile}
            texts={texts}
          />
        )}
      </section>

      <section className="panel">
        <div className="section-header-row">
          <h2>{artText.styleLibraryTitle}</h2>
          <span>{profiles.length}</span>
        </div>
        {profileError && <div className="error-box">{profileError}</div>}
        <div className="profile-list">
          {profiles.map((profile) => (
            <div className="profile-card" key={profile.id}>
              <div>
                <h3>{profile.name}</h3>
                <p>{profile.style_spec_prompt}</p>
                <div className="tag-list">
                  {profile.palette.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
              <div className="action-row compact">
                <button className="secondary-button" onClick={() => setStyleProfileId(profile.id)}>{artText.useProfile}</button>
                <button className="secondary-button" onClick={() => removeProfile(profile.id)}>{texts.common.remove || "Remove"}</button>
              </div>
            </div>
          ))}
          {profiles.length === 0 && <div className="empty-state">{artText.noProfiles}</div>}
        </div>
      </section>
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

function GeneratedImages({ result }) {
  return (
    <div className="generated-image-grid">
      {result.images.map((image) => (
        <div className="generated-image-card" key={image.path}>
          <img src={`http://127.0.0.1:8010/api/files/download?path=${encodeURIComponent(image.path)}`} alt="" />
          <button className="secondary-button" onClick={() => downloadFile(image.path)}>{image.file_name}</button>
        </div>
      ))}
    </div>
  );
}

function AnalysisResult({ analysis, profileName, setProfileName, onSave, texts }) {
  const artText = texts.art;
  return (
    <div className="result-block">
      <div className="analysis-grid">
        <OutputBlock title={artText.contentPrompt} text={analysis.content_prompt} copyTextLabel={texts.common.copy} />
        <OutputBlock title={artText.styleSpecPrompt} text={analysis.style_spec_prompt} copyTextLabel={texts.common.copy} />
        <OutputBlock title={artText.output.negative} text={analysis.negative_prompt} copyTextLabel={texts.common.copy} />
        <div className="result-block">
          <h3>{artText.productionSpec}</h3>
          <p>{analysis.camera_view}</p>
          <p>{analysis.resolution_advice}</p>
          <p>{analysis.naming_advice}</p>
          <div className="tag-list">
            {analysis.palette.map((item) => <span key={item}>{item}</span>)}
            {analysis.suitable_asset_types.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
      </div>
      <div className="action-row">
        <input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder={artText.profileName} />
        <button onClick={onSave}>{artText.saveProfile}</button>
      </div>
    </div>
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
            {formatAssetLabel(result.asset_type, artText)} / {formatStyleLabel(result.style, artText)} /{" "}
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
  ].join("\n");

  copyText(text);
}

export default ArtPipelinePage;
