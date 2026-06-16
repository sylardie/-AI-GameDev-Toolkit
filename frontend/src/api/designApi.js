// 前端不直接到处写 fetch
// 统一通过 designApi.js 调后端
// 以后换接口地址也好改

const API_BASE_URL = "http://127.0.0.1:8000";

export async function generateDesign(idea) {
  const response = await fetch(`${API_BASE_URL}/api/design/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idea,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Backend health check failed.");
  }

  return response.json();
}