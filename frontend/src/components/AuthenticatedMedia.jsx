import { useEffect, useState } from "react";

import { fetchOutputBlob } from "../api/fileApi";

function useAuthenticatedSource(path, version = 0) {
  const [source, setSource] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    async function load() {
      if (!path) {
        setSource("");
        return;
      }
      try {
        const blob = await fetchOutputBlob(path);
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      } catch {
        if (active) setSource("");
      }
    }

    load();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, version]);

  return source;
}

export function AuthenticatedImage({ path, version = 0, ...props }) {
  const source = useAuthenticatedSource(path, version);
  return source ? <img src={source} {...props} /> : null;
}

export function AuthenticatedAudio({ path, version = 0, ...props }) {
  const source = useAuthenticatedSource(path, version);
  return source ? <audio src={source} {...props} /> : null;
}
