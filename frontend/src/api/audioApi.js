const API_BASE_URL = "http://127.0.0.1:8010";

export async function processAudio(payload) {
  const formData = new FormData();
  formData.append("audio", payload.audio);
  formData.append("start_time", String(payload.startTime));
  formData.append("end_time", String(payload.endTime));
  formData.append("normalize_enabled", String(payload.normalizeEnabled));
  formData.append("target_lufs", String(payload.targetLufs));
  formData.append("output_format", payload.outputFormat);

  const response = await fetch(`${API_BASE_URL}/api/audio/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
