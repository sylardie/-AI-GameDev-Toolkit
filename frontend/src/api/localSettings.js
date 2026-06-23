export function isLlmReady(settings) {
  const llm = settings?.llm;
  return Boolean(
    llm?.enabled &&
      llm?.api_base_url &&
      llm?.model &&
      llm?.api_key?.configured,
  );
}

export function isComfyReady(settings) {
  const comfyui = settings?.comfyui;
  return Boolean(comfyui?.enabled && comfyui?.base_url);
}

export function isImageProviderReady(settings) {
  const provider = settings?.image_provider;
  return Boolean(
    provider?.enabled &&
      provider?.provider !== "none" &&
      provider?.model &&
      provider?.api_key?.configured &&
      (provider?.provider === "gemini" || provider?.api_base_url),
  );
}
