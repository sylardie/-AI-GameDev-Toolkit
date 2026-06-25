import { useMemo, useState } from "react";

import { I18nContext } from "./context";
import { translations } from "./translations";

const STORAGE_KEY = "ai-game-dev-toolkit-language";

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "zh" || saved === "en" ? saved : "en";
  });

  function toggleLanguage() {
    setLanguage((current) => {
      const next = current === "en" ? "zh" : "en";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  const value = useMemo(
    () => ({
      language,
      texts: translations[language],
      toggleLanguage,
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
