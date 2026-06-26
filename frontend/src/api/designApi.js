import { apiFetch, handleJsonResponse } from "./apiClient";

export async function getDesignTemplates() {
  const response = await apiFetch("/api/design/templates");
  return handleJsonResponse(response);
}

export async function generateDesign(idea, template = "general") {
  const response = await apiFetch("/api/design/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idea,
      template,
    }),
  });

  return handleJsonResponse(response);
}

export async function checkHealth() {
  const response = await apiFetch("/api/health");

  if (!response.ok) {
    throw new Error("Backend health check failed.");
  }

  return response.json();
}
