import { apiFetch, handleJsonResponse } from "./apiClient";

export async function getPrompts() {
  const response = await apiFetch("/api/prompts");
  return handleJsonResponse(response);
}

export async function createPrompt(payload) {
  const response = await apiFetch("/api/prompts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(response);
}

export async function updatePrompt(id, payload) {
  const response = await apiFetch(`/api/prompts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleJsonResponse(response);
}

export async function deletePrompt(id) {
  const response = await apiFetch(`/api/prompts/${id}`, {
    method: "DELETE",
  });
  return handleJsonResponse(response);
}
