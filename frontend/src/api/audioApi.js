import { apiFetch, handleJsonResponse } from "./apiClient";

export async function processAudio(payload) {
  const formData = new FormData();
  formData.append("audio", payload.audio);
  formData.append("start_time", String(payload.startTime));
  formData.append("end_time", String(payload.endTime));
  formData.append("normalize_enabled", String(payload.normalizeEnabled));
  formData.append("target_lufs", String(payload.targetLufs));
  formData.append("output_format", payload.outputFormat);

  const response = await apiFetch("/api/audio/process", {
    method: "POST",
    body: formData,
  });

  return handleJsonResponse(response);
}

export async function generateAudio(payload) {
  const response = await apiFetch("/api/audio/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response);
}
