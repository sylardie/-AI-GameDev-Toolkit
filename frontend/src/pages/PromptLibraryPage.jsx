import { useEffect, useMemo, useState } from "react";

import { createPrompt, deletePrompt, getPrompts, updatePrompt } from "../api/promptsApi";
import WorkspaceHeader from "../components/WorkspaceHeader";
import { useI18n } from "../i18n/useI18n";

const emptyPrompt = {
  title: "",
  category: "General",
  tags: [],
  body: "",
  notes: "",
};

const fallbackPromptTextEn = {
  eyebrow: "Prompt Assets",
  title: "Prompt Library",
  intro: "Store reusable prompts locally for config, code, art, audio, and asset production workflows.",
  libraryTitle: "Saved Prompts",
  newPrompt: "New Prompt",
  editPrompt: "Edit Prompt",
  createPrompt: "Create Prompt",
  search: "Search",
  searchPlaceholder: "Search title, category, tag, or prompt text...",
  noPrompts: "No prompts found.",
  noTags: "No tags",
  copied: "Prompt copied.",
  deleted: "Prompt deleted.",
  tagsPlaceholder: "Comma-separated tags",
  fields: {
    title: "Title",
    category: "Category",
    tags: "Tags",
    body: "Prompt Body",
    notes: "Notes",
  },
  errors: {
    load: "Prompt library failed to load.",
    save: "Prompt failed to save.",
    delete: "Prompt failed to delete.",
    titleRequired: "Please enter a prompt title.",
    bodyRequired: "Please enter prompt content.",
  },
};

const fallbackPromptTextZh = {
  eyebrow: "提示词资产",
  title: "提示词仓库",
  intro: "本地保存可复用提示词，用于配置、代码、美术、音频和素材生产流程。",
  libraryTitle: "已保存提示词",
  newPrompt: "新建提示词",
  editPrompt: "编辑提示词",
  createPrompt: "创建提示词",
  search: "搜索",
  searchPlaceholder: "搜索标题、分类、标签或提示词内容...",
  noPrompts: "没有找到提示词。",
  noTags: "无标签",
  copied: "提示词已复制。",
  deleted: "提示词已删除。",
  tagsPlaceholder: "用英文逗号分隔标签",
  fields: {
    title: "标题",
    category: "分类",
    tags: "标签",
    body: "提示词正文",
    notes: "备注",
  },
  errors: {
    load: "提示词仓库加载失败。请确认本地后端已启动。",
    save: "提示词保存失败。请确认本地后端已启动。",
    delete: "提示词删除失败。请确认本地后端已启动。",
    titleRequired: "请先输入提示词标题。",
    bodyRequired: "请先输入提示词内容。",
  },
};

function PromptLibraryPage() {
  const { texts } = useI18n();
  const isChinese = texts.sidebar.groups.overview !== "Overview";
  const promptText = texts.prompts || (isChinese ? fallbackPromptTextZh : fallbackPromptTextEn);
  const [prompts, setPrompts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyPrompt);
  const [tagInput, setTagInput] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getPrompts();
        if (!active) return;
        setPrompts(data.prompts || []);
        if (data.prompts?.[0]) {
          selectPrompt(data.prompts[0]);
        }
      } catch (err) {
        if (active) setError(err.message || promptText.errors.load);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [promptText.errors.load]);

  const filteredPrompts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return prompts;
    return prompts.filter((prompt) => {
      const haystack = [
        prompt.title,
        prompt.category,
        prompt.body,
        prompt.notes,
        ...(prompt.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [prompts, query]);

  function selectPrompt(prompt) {
    setSelectedId(prompt.id);
    setForm({
      title: prompt.title,
      category: prompt.category,
      tags: prompt.tags || [],
      body: prompt.body,
      notes: prompt.notes || "",
    });
    setTagInput((prompt.tags || []).join(", "));
    setMessage("");
    setError("");
  }

  function startNewPrompt() {
    setSelectedId("");
    setForm(emptyPrompt);
    setTagInput("");
    setMessage("");
    setError("");
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload() {
    return {
      ...form,
      tags: tagInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
  }

  async function handleSave() {
    const payload = buildPayload();
    if (!payload.title.trim()) {
      setError(promptText.errors.titleRequired);
      return;
    }
    if (!payload.body.trim()) {
      setError(promptText.errors.bodyRequired);
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    try {
      const saved = selectedId
        ? await updatePrompt(selectedId, payload)
        : await createPrompt(payload);
      setPrompts((current) => {
        if (!selectedId) return [saved, ...current];
        return current.map((prompt) => (prompt.id === saved.id ? saved : prompt));
      });
      selectPrompt(saved);
      setMessage(texts.common.saved);
    } catch (err) {
      setError(err.message || promptText.errors.save);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    setMessage("");
    setError("");
    try {
      await deletePrompt(selectedId);
      const remaining = prompts.filter((prompt) => prompt.id !== selectedId);
      setPrompts(remaining);
      if (remaining[0]) {
        selectPrompt(remaining[0]);
      } else {
        startNewPrompt();
      }
      setMessage(promptText.deleted);
    } catch (err) {
      setError(err.message || promptText.errors.delete);
    }
  }

  async function copyBody() {
    await navigator.clipboard.writeText(form.body);
    setMessage(promptText.copied);
  }

  if (loading) {
    return <div className="page"><div className="empty-state">{texts.common.loading}</div></div>;
  }

  return (
    <div className="page workspace-page prompt-library-page">
      <WorkspaceHeader
        capability="neutral"
        eyebrow={promptText.eyebrow}
        icon="prompts"
        intro={promptText.intro}
        title={promptText.title}
      />

      <section className="prompt-library-layout">
        <div className="panel prompt-list-panel">
          <div className="block-header">
            <h2>{promptText.libraryTitle}</h2>
            <button className="secondary-button" onClick={startNewPrompt}>{promptText.newPrompt}</button>
          </div>
          <label className="form-field">
            <span>{promptText.search}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={promptText.searchPlaceholder} />
          </label>
          <div className="prompt-list">
            {filteredPrompts.map((prompt) => (
              <button
                className={prompt.id === selectedId ? "prompt-list-item active" : "prompt-list-item"}
                key={prompt.id}
                onClick={() => selectPrompt(prompt)}
              >
                <strong>{prompt.title}</strong>
                <span>{prompt.category}</span>
                <small>{(prompt.tags || []).join(", ") || promptText.noTags}</small>
              </button>
            ))}
            {filteredPrompts.length === 0 && <div className="empty-state compact-empty">{promptText.noPrompts}</div>}
          </div>
        </div>

        <div className="panel prompt-editor-panel">
          <div className="block-header">
            <h2>{selectedId ? promptText.editPrompt : promptText.createPrompt}</h2>
            <div className="action-row prompt-editor-actions">
              <button className="secondary-button" onClick={copyBody} disabled={!form.body.trim()}>{texts.common.copy}</button>
              <button className="secondary-button danger-button" onClick={handleDelete} disabled={!selectedId}>{texts.common.remove}</button>
              <button onClick={handleSave} disabled={saving}>{saving ? texts.common.saving : texts.common.save}</button>
            </div>
          </div>

          <div className="settings-grid">
            <label className="form-field span-2">
              <span>{promptText.fields.title}</span>
              <input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
            </label>
            <label className="form-field">
              <span>{promptText.fields.category}</span>
              <input value={form.category} onChange={(event) => updateField("category", event.target.value)} />
            </label>
            <label className="form-field span-4">
              <span>{promptText.fields.tags}</span>
              <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder={promptText.tagsPlaceholder} />
            </label>
            <label className="form-field span-4">
              <span>{promptText.fields.body}</span>
              <textarea value={form.body} onChange={(event) => updateField("body", event.target.value)} rows={14} />
            </label>
            <label className="form-field span-4">
              <span>{promptText.fields.notes}</span>
              <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows={4} />
            </label>
          </div>

          {message && <div className="scan-note">{message}</div>}
          {error && <div className="error-box">{error}</div>}
        </div>
      </section>
    </div>
  );
}

export default PromptLibraryPage;
