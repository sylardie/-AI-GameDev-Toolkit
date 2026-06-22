const API_BASE_URL = "http://127.0.0.1:8010";

export function getDownloadUrl(path) {
  return `${API_BASE_URL}/api/files/download?path=${encodeURIComponent(path)}`;
}

export function downloadFile(path) {
  const url = getDownloadUrl(path);
  window.open(url, "_blank");
}
