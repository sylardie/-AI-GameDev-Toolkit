import { apiFetch, handleJsonResponse } from "./apiClient";

export async function scanConfigFolder(path) {
  const response = await apiFetch("/api/configs/scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  return handleJsonResponse(response);
}

export async function openConfigWorkbook(path) {
  const response = await apiFetch("/api/configs/open", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  return handleJsonResponse(response);
}
