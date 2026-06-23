const API_BASE_URL = "http://127.0.0.1:8010";

export async function getSettings() {
  const response = await fetch(`${API_BASE_URL}/api/settings`);
  return handleResponse(response);
}

export async function saveSettings(payload) {
  const response = await fetch(`${API_BASE_URL}/api/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function testLlmConnection() {
  const response = await fetch(`${API_BASE_URL}/api/settings/llm/test`, {
    method: "POST",
  });
  return handleResponse(response);
}

export async function testComfyConnection() {
  const response = await fetch(`${API_BASE_URL}/api/settings/comfyui/test`, {
    method: "POST",
  });
  return handleResponse(response);
}

export async function testImageProviderConnection() {
  const response = await fetch(`${API_BASE_URL}/api/settings/image-provider/test`, {
    method: "POST",
  });
  return handleResponse(response);
}

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
