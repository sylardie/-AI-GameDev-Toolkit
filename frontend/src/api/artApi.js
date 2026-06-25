const API_BASE_URL = "http://127.0.0.1:8010";

export async function generateArtPrompt(payload) {
  const response = await fetch(`${API_BASE_URL}/api/art/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function submitComfyPrompt(payload) {
  const response = await fetch(`${API_BASE_URL}/api/art/comfyui/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function generateComfyImage(payload) {
  const response = await fetch(`${API_BASE_URL}/api/art/comfyui/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function generateArtImage(payload) {
  const response = await fetch(`${API_BASE_URL}/api/art/images/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function analyzeArtImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/art/images/analyze`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}

export async function getStyleProfiles() {
  const response = await fetch(`${API_BASE_URL}/api/art/style-profiles`);
  return handleResponse(response);
}

export async function createStyleProfile(payload) {
  const response = await fetch(`${API_BASE_URL}/api/art/style-profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function updateStyleProfile(profileId, payload) {
  const response = await fetch(`${API_BASE_URL}/api/art/style-profiles/${profileId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function deleteStyleProfile(profileId) {
  const response = await fetch(`${API_BASE_URL}/api/art/style-profiles/${profileId}`, {
    method: "DELETE",
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
