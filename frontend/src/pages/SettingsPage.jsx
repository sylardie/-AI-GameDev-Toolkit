import { useEffect, useState } from "react";

import {
  getSettings,
  saveSettings,
  testComfyConnection,
  testComfyWorkflow,
  testImageProviderConnection,
  testLlmConnection,
} from "../api/settingsApi";
import PageTabs from "../components/PageTabs";
import { useI18n } from "../i18n/I18nContext";

const emptySettings = {
  llm: {
    enabled: false,
    provider: "custom",
    api_base_url: "",
    model: "deepseek-chat",
    api_key: "",
    keep_existing_api_key: true,
    timeout: 60,
  },
  comfyui: {
    enabled: false,
    base_url: "http://127.0.0.1:8188",
    timeout: 60,
    width: 512,
    height: 512,
    steps: 20,
    cfg: 7,
    seed: -1,
    workflow: {},
    positive_prompt_node_id: "",
    negative_prompt_node_id: "",
    sampler_node_id: "",
    latent_node_id: "",
  },
  image_provider: {
    enabled: false,
    provider: "none",
    api_base_url: "",
    model: "",
    api_key: "",
    keep_existing_api_key: true,
    timeout: 60,
  },
};

const IMAGE_PROVIDER_PRESETS = {
  none: {
    api_base_url: "",
    model: "",
  },
  openai: {
    api_base_url: "https://api.openai.com",
    model: "gpt-image-1",
  },
  gemini: {
    api_base_url: "https://generativelanguage.googleapis.com",
    model: "gemini-3.1-flash-image",
  },
  custom: {
    api_base_url: "",
    model: "",
  },
};

function SettingsPage() {
  const { texts } = useI18n();
  const settingsText = texts.settings;
  const [form, setForm] = useState(emptySettings);
  const [apiKeyState, setApiKeyState] = useState({ configured: false, preview: "" });
  const [imageApiKeyState, setImageApiKeyState] = useState({ configured: false, preview: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState("");
  const [testResults, setTestResults] = useState({});
  const [workflowFileName, setWorkflowFileName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("llm");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const data = await getSettings();
      setForm({
        llm: {
          ...data.llm,
          api_key: "",
          keep_existing_api_key: true,
        },
        comfyui: data.comfyui,
        image_provider: {
          ...data.image_provider,
          api_key: "",
          keep_existing_api_key: true,
        },
      });
      setApiKeyState(data.llm.api_key);
      setImageApiKeyState(data.image_provider.api_key);
    } catch (err) {
      setError(err.message || settingsText.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const data = await saveSettings(form);
      setForm({
        llm: {
          ...data.llm,
          api_key: "",
          keep_existing_api_key: true,
        },
        comfyui: data.comfyui,
        image_provider: {
          ...data.image_provider,
          api_key: "",
          keep_existing_api_key: true,
        },
      });
      setApiKeyState(data.llm.api_key);
      setImageApiKeyState(data.image_provider.api_key);
      setMessage(texts.common.saved);
    } catch (err) {
      setError(err.message || settingsText.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function runTest(kind) {
    setTesting(kind);
    setMessage("");
    setError("");
    setTestResults((current) => ({
      ...current,
      [kind]: null,
    }));

    try {
      const result =
        kind === "llm"
          ? await testLlmConnection()
          : kind === "image"
            ? await testImageProviderConnection()
            : kind === "workflow"
              ? await testComfyWorkflow()
              : await testComfyConnection();
      if (result.ok) {
        setTestResults((current) => ({
          ...current,
          [kind]: { ok: true, message: result.message },
        }));
      } else {
        setTestResults((current) => ({
          ...current,
          [kind]: { ok: false, message: result.message },
        }));
      }
    } catch (err) {
      setTestResults((current) => ({
        ...current,
        [kind]: { ok: false, message: err.message },
      }));
    } finally {
      setTesting("");
    }
  }

  function updateLlm(key, value) {
    setForm((current) => ({
      ...current,
      llm: {
        ...current.llm,
        [key]: value,
        ...(key === "api_key" ? { keep_existing_api_key: value.length === 0 } : {}),
      },
    }));
  }

  function updateComfy(key, value) {
    setForm((current) => ({
      ...current,
      comfyui: {
        ...current.comfyui,
        [key]: value,
      },
    }));
  }

  function updateImageProvider(key, value) {
    setForm((current) => ({
      ...current,
      image_provider: {
        ...current.image_provider,
        [key]: value,
        ...(key === "provider" && IMAGE_PROVIDER_PRESETS[value]
          ? IMAGE_PROVIDER_PRESETS[value]
          : {}),
        ...(key === "api_key" ? { keep_existing_api_key: value.length === 0 } : {}),
      },
    }));
  }

  async function handleWorkflowFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    try {
      const workflow = JSON.parse(await file.text());
      if (!workflow || Array.isArray(workflow) || typeof workflow !== "object") {
        throw new Error(settingsText.comfyWorkflowInvalid);
      }
      if ("nodes" in workflow) {
        throw new Error(settingsText.comfyWorkflowUiFormat);
      }

      updateComfy("workflow", workflow);
      setWorkflowFileName(file.name);
      setMessage(settingsText.comfyWorkflowImported.replace("{count}", Object.keys(workflow).length));
    } catch (err) {
      setError(err.message || settingsText.comfyWorkflowInvalid);
      event.target.value = "";
    }
  }

  if (loading) {
    return <div className="page"><div className="empty-state">{texts.common.loading}</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">{settingsText.eyebrow}</div>
          <h1>{settingsText.title}</h1>
          <p>{settingsText.intro}</p>
        </div>
      </div>

      <section className="panel">
        <PageTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "llm", label: settingsText.llmTitle },
            { id: "image", label: settingsText.imageProviderTitle },
            { id: "comfy", label: settingsText.comfyTitle },
          ]}
        />
      </section>

      {activeTab === "llm" && (
      <section className="panel">
        <div className="section-header-row">
          <h2>{settingsText.llmTitle}</h2>
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={form.llm.enabled}
              onChange={(event) => updateLlm("enabled", event.target.checked)}
            />
            <span>{settingsText.enabled}</span>
          </label>
        </div>

        <div className="settings-grid">
          <label className="form-field">
            <span>{settingsText.provider}</span>
            <select value={form.llm.provider} onChange={(event) => updateLlm("provider", event.target.value)}>
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
              <option value="qwen">Qwen</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="form-field">
            <span>{settingsText.baseUrl}</span>
            <input value={form.llm.api_base_url} onChange={(event) => updateLlm("api_base_url", event.target.value)} />
          </label>
          <label className="form-field">
            <span>{settingsText.model}</span>
            <input value={form.llm.model} onChange={(event) => updateLlm("model", event.target.value)} />
          </label>
          <NumberField label={settingsText.timeout} value={form.llm.timeout} onChange={(value) => updateLlm("timeout", value)} />
          <label className="form-field span-2">
            <span>
              {settingsText.apiKey} · {settingsText.keyConfigured}
              {apiKeyState.configured ? apiKeyState.preview : "No"}
            </span>
            <input
              type="password"
              value={form.llm.api_key}
              onChange={(event) => updateLlm("api_key", event.target.value)}
              placeholder={settingsText.apiKeyPlaceholder}
            />
          </label>
        </div>

        <div className="action-row">
          <button className="secondary-button" onClick={() => runTest("llm")} disabled={testing === "llm"}>
            {testing === "llm" ? texts.common.testing : `${texts.common.test} LLM`}
          </button>
          <ConnectionTestStatus result={testResults.llm} texts={settingsText} />
        </div>
      </section>
      )}

      {activeTab === "image" && (
      <section className="panel">
        <div className="section-header-row">
          <div>
            <h2>{settingsText.imageProviderTitle}</h2>
            <p>{settingsText.imageProviderHint}</p>
          </div>
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={form.image_provider.enabled}
              onChange={(event) => updateImageProvider("enabled", event.target.checked)}
            />
            <span>{settingsText.enabled}</span>
          </label>
        </div>

        <div className="settings-grid">
          <label className="form-field">
            <span>{settingsText.provider}</span>
            <select
              value={form.image_provider.provider}
              onChange={(event) => updateImageProvider("provider", event.target.value)}
            >
              <option value="none">None</option>
              <option value="openai">OpenAI Images</option>
              <option value="gemini">Gemini / Gemma</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="form-field">
            <span>{settingsText.baseUrl}</span>
            <input
              value={form.image_provider.api_base_url}
              onChange={(event) => updateImageProvider("api_base_url", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>{settingsText.model}</span>
            <input
              value={form.image_provider.model}
              onChange={(event) => updateImageProvider("model", event.target.value)}
            />
          </label>
          <NumberField
            label={settingsText.timeout}
            value={form.image_provider.timeout}
            onChange={(value) => updateImageProvider("timeout", value)}
          />
          <label className="form-field span-2">
            <span>
              {settingsText.apiKey} · {settingsText.keyConfigured}
              {imageApiKeyState.configured ? imageApiKeyState.preview : "No"}
            </span>
            <input
              type="password"
              value={form.image_provider.api_key}
              onChange={(event) => updateImageProvider("api_key", event.target.value)}
              placeholder={settingsText.apiKeyPlaceholder}
            />
          </label>
        </div>

        <div className="action-row">
          <button className="secondary-button" onClick={() => runTest("image")} disabled={testing === "image"}>
            {testing === "image" ? texts.common.testing : `${texts.common.test} Image Provider`}
          </button>
          <ConnectionTestStatus result={testResults.image} texts={settingsText} />
        </div>
      </section>
      )}

      {activeTab === "comfy" && (
      <section className="panel">
        <div className="section-header-row">
          <div>
            <h2>{settingsText.comfyTitle}</h2>
            <p>{settingsText.comfyIntro}</p>
          </div>
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={form.comfyui.enabled}
              onChange={(event) => updateComfy("enabled", event.target.checked)}
            />
            <span>{settingsText.enabled}</span>
          </label>
        </div>

        <div className="comfy-setup-steps">
          {settingsText.comfySteps.map((step, index) => (
            <div className="comfy-setup-step" key={step.title}>
              <span>{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="settings-grid">
          <label className="form-field span-2">
            <span>{settingsText.baseUrl}</span>
            <input value={form.comfyui.base_url} onChange={(event) => updateComfy("base_url", event.target.value)} />
          </label>
          <NumberField label={settingsText.timeout} value={form.comfyui.timeout} onChange={(value) => updateComfy("timeout", value)} />
          <NumberField label={settingsText.width} value={form.comfyui.width} onChange={(value) => updateComfy("width", value)} />
          <NumberField label={settingsText.height} value={form.comfyui.height} onChange={(value) => updateComfy("height", value)} />
          <NumberField label={settingsText.steps} value={form.comfyui.steps} onChange={(value) => updateComfy("steps", value)} />
          <NumberField label={settingsText.cfg} value={form.comfyui.cfg} onChange={(value) => updateComfy("cfg", value)} />
          <NumberField label={settingsText.seed} value={form.comfyui.seed} onChange={(value) => updateComfy("seed", value)} />
        </div>

        <div className="comfy-workflow-card">
          <div className="block-header">
            <h3>{settingsText.comfyCustomTitle}</h3>
            <span>
              {Object.keys(form.comfyui.workflow || {}).length > 0
                ? settingsText.comfyWorkflowLoaded.replace("{count}", Object.keys(form.comfyui.workflow).length)
                : settingsText.comfyWorkflowMissing}
            </span>
          </div>
          <label className="workflow-file-input">
            <span>{settingsText.comfyImportWorkflow}</span>
            <input type="file" accept=".json,application/json" onChange={handleWorkflowFile} />
          </label>
          {workflowFileName && <p className="workflow-file-name">{workflowFileName}</p>}
          <div className="scan-note compact-note">{settingsText.comfyExportHint}</div>

          <h3 className="comfy-mapping-title">{settingsText.comfyNodeMapping}</h3>
          <p>{settingsText.comfyNodeMappingHint}</p>
          <div className="settings-grid">
            <TextField
              label={settingsText.comfyPositiveNode}
              value={form.comfyui.positive_prompt_node_id}
              onChange={(value) => updateComfy("positive_prompt_node_id", value)}
            />
            <TextField
              label={settingsText.comfyNegativeNode}
              value={form.comfyui.negative_prompt_node_id}
              onChange={(value) => updateComfy("negative_prompt_node_id", value)}
            />
            <TextField
              label={settingsText.comfySamplerNode}
              value={form.comfyui.sampler_node_id}
              onChange={(value) => updateComfy("sampler_node_id", value)}
            />
            <TextField
              label={settingsText.comfyLatentNode}
              value={form.comfyui.latent_node_id}
              onChange={(value) => updateComfy("latent_node_id", value)}
            />
          </div>
        </div>

        <div className="action-row">
          <button className="secondary-button" onClick={() => runTest("comfy")} disabled={testing === "comfy"}>
            {testing === "comfy" ? texts.common.testing : `${texts.common.test} ComfyUI`}
          </button>
          <button className="secondary-button" onClick={() => runTest("workflow")} disabled={testing === "workflow"}>
            {testing === "workflow" ? texts.common.testing : settingsText.comfyValidateWorkflow}
          </button>
          <ConnectionTestStatus result={testResults.comfy} texts={settingsText} />
          <ConnectionTestStatus result={testResults.workflow} texts={settingsText} />
        </div>
        <div className="scan-note compact-note">{settingsText.comfyTestHint}</div>
      </section>
      )}

      <div className="action-row">
        <button onClick={handleSave} disabled={saving}>
          {saving ? texts.common.saving : settingsText.save}
        </button>
      </div>

      {message && <div className="scan-note">{message}</div>}
      {error && <div className="error-box">{error}</div>}
    </div>
  );
}

function ConnectionTestStatus({ result, texts }) {
  if (!result) return null;

  return (
    <span className={result.ok ? "connection-status ok" : "connection-status failed"}>
      {result.ok ? texts.connectionOk : texts.connectionFailed}: {result.message}
    </span>
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

function TextField({ label, value, onChange }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export default SettingsPage;
