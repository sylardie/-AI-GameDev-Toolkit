import { useEffect, useState } from "react";

import {
  getSettings,
  saveSettings,
  testComfyConnection,
  testLlmConnection,
} from "../api/settingsApi";
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
  },
};

function SettingsPage() {
  const { texts } = useI18n();
  const settingsText = texts.settings;
  const [form, setForm] = useState(emptySettings);
  const [apiKeyState, setApiKeyState] = useState({ configured: false, preview: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      });
      setApiKeyState(data.llm.api_key);
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
      });
      setApiKeyState(data.llm.api_key);
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

    try {
      const result = kind === "llm" ? await testLlmConnection() : await testComfyConnection();
      if (result.ok) {
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
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
          <label className="form-field">
            <span>{settingsText.timeout}</span>
            <input type="number" value={form.llm.timeout} onChange={(event) => updateLlm("timeout", Number(event.target.value))} />
          </label>
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
        </div>
      </section>

      <section className="panel">
        <div className="section-header-row">
          <h2>{settingsText.comfyTitle}</h2>
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={form.comfyui.enabled}
              onChange={(event) => updateComfy("enabled", event.target.checked)}
            />
            <span>{settingsText.enabled}</span>
          </label>
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

        <div className="action-row">
          <button className="secondary-button" onClick={() => runTest("comfy")} disabled={testing === "comfy"}>
            {testing === "comfy" ? texts.common.testing : `${texts.common.test} ComfyUI`}
          </button>
        </div>
      </section>

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

function NumberField({ label, value, onChange }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default SettingsPage;
