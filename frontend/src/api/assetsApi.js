import { apiFetch } from "./apiClient";

export async function generateSpritesheet(payload) {
  const formData = new FormData();
  formData.append("video", payload.video);
  formData.append("fps", String(payload.fps));
  formData.append("max_frames", String(payload.maxFrames));
  formData.append("target_frame_count", String(payload.targetFrameCount ?? payload.maxFrames));
  formData.append("columns", String(payload.columns));
  formData.append("frame_width", String(payload.frameWidth));
  formData.append("frame_height", String(payload.frameHeight));
  formData.append("metadata_target", payload.metadataTarget);
  formData.append("start_time", String(payload.startTime));
  formData.append("end_time", String(payload.endTime));
  formData.append("extraction_mode", payload.extractionMode);
  formData.append("frame_interval", String(payload.frameInterval));
  formData.append("dedupe_enabled", String(payload.dedupeEnabled ?? false));
  formData.append("dedupe_threshold", String(payload.dedupeThreshold ?? 96));
  formData.append("transparent_enabled", "false");
  formData.append("transparent_color", "#000000");
  formData.append("transparent_tolerance", "0");
  formData.append("transparent_feather", "0");
  formData.append("export_gif", "false");

  const response = await apiFetch("/api/assets/spritesheet", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function applyFrameTransparency(payload) {
  const response = await apiFetch("/api/assets/spritesheet/transparent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      output_id: payload.outputId,
      selected_indices: payload.selectedIndices,
      columns: payload.columns,
      frame_width: payload.frameWidth,
      frame_height: payload.frameHeight,
      metadata_target: payload.metadataTarget,
      export_gif: false,
      gif_fps: payload.gifFps,
      transparent_color: payload.transparentColor,
      transparent_tolerance: payload.transparentTolerance,
      transparent_feather: payload.transparentFeather,
      apply_to_all: payload.applyToAll,
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

export async function exportSelectedSpritesheet(payload) {
  const response = await apiFetch("/api/assets/spritesheet/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      output_id: payload.outputId,
      selected_indices: payload.selectedIndices,
      columns: payload.columns,
      frame_width: payload.frameWidth,
      frame_height: payload.frameHeight,
      metadata_target: payload.metadataTarget,
      export_gif: false,
      gif_fps: payload.gifFps,
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

export async function removeImageBackground(payload) {
  const formData = new FormData();
  formData.append("image", payload.image);
  formData.append("transparent_color", payload.transparentColor);
  formData.append("transparent_tolerance", String(payload.transparentTolerance));
  formData.append("transparent_feather", String(payload.transparentFeather));

  const response = await apiFetch("/api/assets/image/transparent", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
