import { useEffect, useMemo, useState } from "react";

import { isComfyReady, isImageProviderReady, isLlmReady } from "../api/localSettings";
import { useLocalSettings } from "../api/useLocalSettings";
import {
  analyzeArtImage,
  createStyleProfile,
  deleteStyleProfile,
  generateArtImage,
  generateComfyImage,
  generateArtPrompt,
  getStyleProfiles,
  updateStyleProfile,
} from "../api/artApi";
import { downloadFile } from "../api/fileApi";
import { AuthenticatedImage } from "../components/AuthenticatedMedia";
import AiRequiredNotice from "../components/AiRequiredNotice";
import PageTabs from "../components/PageTabs";
import WorkspaceHeader from "../components/WorkspaceHeader";
import { useI18n } from "../i18n/useI18n";

const assetTypeValues = ["character", "item", "environment", "ui_icon", "sprite", "tileset", "concept_art"];
const styleValues = ["pixel_art", "hand_painted", "low_poly", "anime", "realistic", "flat_vector"];
const engineTargetValues = ["godot", "unity", "generic"];

function ArtPipelinePage() {
  const { texts } = useI18n();
  const artText = texts.art;
  const { settings } = useLocalSettings();
  const llmReady = isLlmReady(settings);
  const comfyReady = isComfyReady(settings);
  const imageProviderReady = isImageProviderReady(settings);
  const [activeTab, setActiveTab] = useState("style");

  const [description, setDescription] = useState(artText.exampleDescription);
  const [assetType, setAssetType] = useState("character");
  const [style, setStyle] = useState("pixel_art");
  const [engineTarget, setEngineTarget] = useState("godot");
  const [mood, setMood] = useState(artText.defaultMood);
  const [colorPalette, setColorPalette] = useState(artText.defaultPalette);
  const [result, setResult] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [profiles, setProfiles] = useState([]);
  const [profileError, setProfileError] = useState("");
  const [editingProfileId, setEditingProfileId] = useState("");
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileContent, setEditProfileContent] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [styleProfileId, setStyleProfileId] = useState("");
  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === styleProfileId) || null,
    [profiles, styleProfileId],
  );

  const [imagePrompt, setImagePrompt] = useState(artText.imagePromptExample);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [imageCount, setImageCount] = useState(1);
  const [imageResult, setImageResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [comfyImageResult, setComfyImageResult] = useState(null);
  const [comfyImageLoading, setComfyImageLoading] = useState(false);
  const [comfyImageError, setComfyImageError] = useState("");

  const [analysisFile, setAnalysisFile] = useState(null);
  const [analysisPreview, setAnalysisPreview] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    return () => {
      if (analysisPreview) URL.revokeObjectURL(analysisPreview);
    };
  }, [analysisPreview]);

  const tabs = [
    { id: "style", icon: "art", label: artText.tabs?.style || "Style Prompt" },
    { id: "image", icon: "image", label: artText.tabs?.image || artText.imageGenerationTitle },
    { id: "analyze", icon: "search", label: artText.tabs?.analyze || artText.imageAnalyzeTitle },
    { id: "library", icon: "file", label: artText.tabs?.library || artText.styleLibraryTitle },
  ];

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
    setResult(null);

    try {
      const data = await generateArtPrompt(buildPayload());
      setResult(data);
      setProfileName(data.title || "");
      setImagePrompt(data.content_prompt || data.positive_prompt || "");
      setNegativePrompt(data.negative_prompt || "");
    } catch (err) {
      setError(err.message || artText.errors.generate);
    } finally {
      setLoading(false);
    }
  }

  async function saveGeneratedAsProfile() {
    if (!result || !profileName.trim()) return;
    try {
      await createStyleProfile({
        name: profileName.trim(),
        content_prompt: result.content_prompt || "",
        style_spec_prompt: result.style_spec_prompt || "",
        negative_prompt: result.negative_prompt || "",
        palette: result.palette || result.style_tags || [],
        camera_view: "",
        resolution_advice: "",
        naming_advice: "",
        suitable_asset_types: [result.asset_type].filter(Boolean),
      });
      await loadProfiles();
      setActiveTab("library");
    } catch (err) {
      setProfileError(err.message);
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
      setActiveTab("library");
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

  function applyProfile(profile) {
    setStyleProfileId(profile.id);
    if (profile.negative_prompt) setNegativePrompt(profile.negative_prompt);
    setActiveTab("image");
  }

  function startEditingProfile(profile) {
    setEditingProfileId(profile.id);
    setEditProfileName(profile.name);
    setEditProfileContent(profile.style_spec_prompt || "");
    setProfileError("");
  }

  function cancelEditingProfile() {
    setEditingProfileId("");
    setEditProfileName("");
    setEditProfileContent("");
  }

  async function saveProfileEdits(profile) {
    if (!editProfileName.trim()) {
      setProfileError(artText.errors.profileNameRequired);
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    try {
      await updateStyleProfile(profile.id, {
        name: editProfileName.trim(),
        content_prompt: profile.content_prompt || "",
        style_spec_prompt: editProfileContent.trim(),
        negative_prompt: profile.negative_prompt || "",
        palette: profile.palette || [],
        camera_view: profile.camera_view || "",
        resolution_advice: profile.resolution_advice || "",
        naming_advice: profile.naming_advice || "",
        suitable_asset_types: profile.suitable_asset_types || [],
        source_image_path: profile.source_image_path || "",
      });
      await loadProfiles();
      cancelEditingProfile();
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  }

  function finalPrompt() {
    return combinePrompt(imagePrompt, selectedProfile?.style_spec_prompt || "");
  }

  function finalNegativePrompt() {
    return combineNegativePrompt(negativePrompt, selectedProfile?.negative_prompt || "");
  }

  async function handleImageGenerate() {
    if (!imagePrompt.trim()) {
      setImageError(artText.errors.emptyImagePrompt);
      return;
    }

    setImageLoading(true);
    setImageError("");
    setImageResult(null);
    setComfyImageError("");
    setComfyImageResult(null);

    try {
      setImageResult(
        await generateArtImage({
          prompt: finalPrompt(),
          negative_prompt: finalNegativePrompt(),
          style_profile_id: "",
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

  async function handleComfyImageGenerate() {
    if (!imagePrompt.trim()) {
      setComfyImageError(artText.errors.emptyImagePrompt);
      return;
    }

    setComfyImageLoading(true);
    setComfyImageError("");
    setComfyImageResult(null);
    setImageError("");
    setImageResult(null);

    try {
      setComfyImageResult(
        await generateComfyImage({
          prompt: finalPrompt(),
          negative_prompt: finalNegativePrompt(),
          size: imageSize,
          count: Number(imageCount),
          seed: -1,
        }),
      );
    } catch (err) {
      setComfyImageError(err.message || artText.errors.comfySubmit);
    } finally {
      setComfyImageLoading(false);
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
    <div className="page workspace-page">
      <WorkspaceHeader
        capability="ai"
        capabilityLabel={texts.sidebar.capabilities.ai}
        eyebrow={texts.common.phase3}
        icon="art"
        intro={artText.intro}
        title={artText.title}
      />

      <section className="tabs-panel">
        <PageTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </section>

      {activeTab === "style" && (
        <section className="panel">
          <h2>{artText.briefTitle}</h2>
          {!llmReady && <AiNotice texts={texts} />}
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
            <button onClick={handleGenerate} disabled={loading || !llmReady}>
              {loading ? texts.common.generating : artText.generate}
            </button>
            <button className="secondary-button" onClick={fillExample} disabled={loading}>
              {texts.common.fillExample}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}
          {result && (
            <PromptResult
              result={result}
              profileName={profileName}
              setProfileName={setProfileName}
              onSave={saveGeneratedAsProfile}
              texts={texts}
            />
          )}
        </section>
      )}

      {activeTab === "image" && (
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

          {selectedProfile && (
            <OutputBlock title={artText.styleSpecPrompt} text={selectedProfile.style_spec_prompt} copyTextLabel={texts.common.copy} />
          )}

          <div className="action-row">
            <button onClick={() => copyText(finalPrompt())} className="secondary-button">
              {texts.common.copy}
            </button>
            <button onClick={handleImageGenerate} disabled={imageLoading || !imageProviderReady}>
              {imageLoading ? texts.common.generating : artText.generateImage}
            </button>
            <button className="secondary-button" onClick={handleComfyImageGenerate} disabled={comfyImageLoading || !comfyReady}>
              {comfyImageLoading ? texts.common.generating : artText.generateComfyImage || "Generate with ComfyUI"}
            </button>
          </div>
          {!imageProviderReady && <div className="scan-note">{artText.imageProviderDisabled}</div>}
          {!comfyReady && <div className="scan-note">{artText.comfyDisabled}</div>}
          {imageError && <div className="error-box">{imageError}</div>}
          {comfyImageError && <div className="error-box">{comfyImageError}</div>}
          {imageResult && <GeneratedImages result={imageResult} />}
          {comfyImageResult && <GeneratedImages result={comfyImageResult} />}
        </section>
      )}

      {activeTab === "analyze" && (
        <section className="panel">
          <h2>{artText.imageAnalyzeTitle}</h2>
          {!llmReady && <AiNotice texts={texts} />}
          <div className="art-form-grid">
            <ReferenceDropZone
              texts={artText}
              dragActive={dragActive}
              setDragActive={setDragActive}
              onFile={handleAnalysisFile}
            />
            {analysisPreview && (
              <div className="image-preview-card span-2">
                <img src={analysisPreview} alt="" />
              </div>
            )}
          </div>
          <div className="action-row">
            <button onClick={handleAnalyzeImage} disabled={analysisLoading || !llmReady}>
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
      )}

      {activeTab === "library" && (
        <section className="panel">
          <div className="section-header-row">
            <h2>{artText.styleLibraryTitle}</h2>
            <span>{profiles.length}</span>
          </div>
          {profileError && <div className="error-box">{profileError}</div>}
          <div className="profile-list">
            {profiles.map((profile) => (
              <div className="profile-card" key={profile.id}>
                {editingProfileId === profile.id ? (
                  <div className="profile-edit-form">
                    <label className="form-field">
                      <span>{artText.profileName}</span>
                      <input
                        value={editProfileName}
                        onChange={(event) => setEditProfileName(event.target.value)}
                        maxLength={120}
                      />
                    </label>
                    <label className="form-field">
                      <span>{artText.profileContent}</span>
                      <textarea
                        value={editProfileContent}
                        onChange={(event) => setEditProfileContent(event.target.value)}
                        rows={5}
                        maxLength={2000}
                      />
                    </label>
                    <div className="action-row compact">
                      <button onClick={() => saveProfileEdits(profile)} disabled={profileSaving}>
                        {profileSaving ? texts.common.saving : texts.common.save}
                      </button>
                      <button className="secondary-button" onClick={cancelEditingProfile} disabled={profileSaving}>
                        {texts.common.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3>{profile.name}</h3>
                      <p>{profile.style_spec_prompt}</p>
                      <div className="tag-list">
                        {(profile.palette || []).map((item) => <span key={item}>{item}</span>)}
                      </div>
                    </div>
                    <div className="action-row compact">
                      <button className="secondary-button" onClick={() => applyProfile(profile)}>{artText.useProfile}</button>
                      <button className="secondary-button" onClick={() => startEditingProfile(profile)}>{texts.common.edit}</button>
                      <button className="secondary-button" onClick={() => removeProfile(profile.id)}>{texts.common.remove}</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {profiles.length === 0 && <div className="empty-state">{artText.noProfiles}</div>}
          </div>
        </section>
      )}
    </div>
  );
}

function AiNotice({ texts }) {
  return (
    <AiRequiredNotice
      title={texts.ai?.requiredTitle || "AI is not configured"}
      message={texts.ai?.llmRequired || "Configure an LLM before using this AI feature."}
      actionLabel={texts.ai?.goSettings || "Open Settings"}
    />
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

function ReferenceDropZone({ texts, dragActive, setDragActive, onFile }) {
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
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onFile(event.target.files?.[0] || null)} />
      <span>{texts.referenceImage}</span>
      <strong>{texts.dropReferenceTitle || texts.referenceImage}</strong>
      <small>{texts.dropReferenceHint || ""}</small>
    </label>
  );
}

function GeneratedImages({ result }) {
  return (
    <div className="generated-image-grid">
      {result.images.map((image) => (
        <div className="generated-image-card" key={image.path}>
          <AuthenticatedImage path={image.path} alt="" />
          <button className="secondary-button" onClick={() => downloadFile(image.path)}>{image.file_name}</button>
        </div>
      ))}
    </div>
  );
}

function PromptResult({ result, profileName, setProfileName, onSave, texts }) {
  const artText = texts.art;
  return (
    <div className="result-block">
      <div className="analysis-grid">
        <OutputBlock title={artText.contentPrompt} text={result.content_prompt || result.positive_prompt} copyTextLabel={texts.common.copy} />
        <OutputBlock title={artText.styleSpecPrompt} text={result.style_spec_prompt} copyTextLabel={texts.common.copy} />
        <OutputBlock title={artText.output.negative} text={result.negative_prompt} copyTextLabel={texts.common.copy} />
        <div className="result-block">
          <h3>{artText.palette}</h3>
          <div className="tag-list">
            {(result.palette || result.style_tags || []).map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
        {result.notes?.length > 0 && (
          <div className="result-block">
            <h3>{artText.notes || "Notes"}</h3>
            <ul className="compact-list">
              {result.notes.map((note, index) => <li key={index}>{note}</li>)}
            </ul>
          </div>
        )}
      </div>
      <div className="action-row">
        <input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder={artText.profileName} />
        <button onClick={onSave}>{artText.saveProfile}</button>
      </div>
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
          <h3>{artText.palette}</h3>
          <div className="tag-list">
            {(analysis.palette || []).map((item) => <span key={item}>{item}</span>)}
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

function formatEngineLabel(value, commonText) {
  if (value === "godot") return commonText.godot;
  if (value === "unity") return commonText.unity;
  return commonText.generic;
}

function combinePrompt(contentPrompt, stylePrompt) {
  return [contentPrompt.trim(), stylePrompt.trim()].filter(Boolean).join("\n\nStyle specification:\n");
}

function combineNegativePrompt(localNegative, profileNegative) {
  return [localNegative.trim(), profileNegative.trim()].filter(Boolean).join(", ");
}

function copyText(text) {
  navigator.clipboard.writeText(text || "");
}

export default ArtPipelinePage;
