import { apiFetch, handleJsonResponse } from "./apiClient";

export async function getSettings() {
  const response = await apiFetch("/api/settings");
  return handleJsonResponse(response);
}

export async function saveSettings(payload) {
  const response = await apiFetch("/api/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(response);
}

export async function testLlmConnection() {
  const response = await apiFetch("/api/settings/llm/test", {
    method: "POST",
  });
  return handleJsonResponse(response);
}

export async function testComfyConnection() {
  const response = await apiFetch("/api/settings/comfyui/test", {
    method: "POST",
  });
  return handleJsonResponse(response);
}

export async function testComfyWorkflow() {
  const response = await apiFetch("/api/settings/comfyui/workflow/test", {
    method: "POST",
  });
  return handleJsonResponse(response);
}

export async function testImageProviderConnection() {
  const response = await apiFetch("/api/settings/image-provider/test", {
    method: "POST",
  });
  return handleJsonResponse(response);
}
