export const API_BASE_URL = "http://127.0.0.1:8010";

let apiTokenPromise;

async function getApiToken() {
  if (!window.aiGameDevToolkit?.getApiToken) {
    return "";
  }
  if (!apiTokenPromise) {
    apiTokenPromise = window.aiGameDevToolkit.getApiToken();
  }
  return apiTokenPromise;
}

export async function apiFetch(path, options = {}) {
  const token = await getApiToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("X-AI-Toolkit-Token", token);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error("Local backend is not connected. Start or restart the backend service.");
  }

  if (response.status === 401) {
    throw new Error(
      "Local backend security session is invalid. Restart the desktop application.",
    );
  }
  return response;
}

export async function handleJsonResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return response.json();
}
