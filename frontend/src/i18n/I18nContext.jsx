import { createContext, useContext, useMemo, useState } from "react";

import { translations } from "./translations";

const STORAGE_KEY = "ai-game-dev-toolkit-language";
const I18nContext = createContext(null);

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

export function useI18n() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return value;
}
