import { apiFetch, handleJsonResponse } from "./apiClient";

export async function generateArtPrompt(payload) {
  const response = await apiFetch("/api/art/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response);
}

export async function submitComfyPrompt(payload) {
  const response = await apiFetch("/api/art/comfyui/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response);
}

export async function generateComfyImage(payload) {
  const response = await apiFetch("/api/art/comfyui/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response);
}

export async function generateArtImage(payload) {
  const response = await apiFetch("/api/art/images/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response);
}

export async function analyzeArtImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiFetch("/api/art/images/analyze", {
    method: "POST",
    body: formData,
  });

  return handleJsonResponse(response);
}

export async function getStyleProfiles() {
  const response = await apiFetch("/api/art/style-profiles");
  return handleJsonResponse(response);
}

export async function createStyleProfile(payload) {
  const response = await apiFetch("/api/art/style-profiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response);
}

export async function updateStyleProfile(profileId, payload) {
  const response = await apiFetch(`/api/art/style-profiles/${profileId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJsonResponse(response);
}

export async function deleteStyleProfile(profileId) {
  const response = await apiFetch(`/api/art/style-profiles/${profileId}`, {
    method: "DELETE",
  });

  return handleJsonResponse(response);
}
