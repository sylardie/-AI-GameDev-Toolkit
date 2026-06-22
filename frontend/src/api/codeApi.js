const API_BASE_URL = "http://127.0.0.1:8010";

export async function scanProject(projectPath) {
  const response = await fetch(`${API_BASE_URL}/api/code/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_path: projectPath,
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

export async function readProjectFile(projectPath, relativePath) {
  const response = await fetch(`${API_BASE_URL}/api/code/file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_path: projectPath,
      relative_path: relativePath,
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

export async function searchProject(projectPath, query, maxResults = 100) {
  const response = await fetch(`${API_BASE_URL}/api/code/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_path: projectPath,
      query,
      max_results: maxResults,
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

export async function analyzeProjectFile(projectPath, relativePath) {
  const response = await fetch(`${API_BASE_URL}/api/code/structure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_path: projectPath,
      relative_path: relativePath,
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

export async function analyzeErrorLog(projectPath, logText) {
  const response = await fetch(`${API_BASE_URL}/api/code/errors/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_path: projectPath,
      log_text: logText,
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
