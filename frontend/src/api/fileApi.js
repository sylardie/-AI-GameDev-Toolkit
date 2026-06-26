import { apiFetch } from "./apiClient";

export async function fetchOutputBlob(path) {
  const response = await apiFetch(
    `/api/files/download?path=${encodeURIComponent(path)}`,
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Download failed with status ${response.status}`,
    );
  }
  return response.blob();
}

export async function downloadFile(path) {
  const blob = await fetchOutputBlob(path);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = path.split(/[\\/]/).pop() || "download";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
