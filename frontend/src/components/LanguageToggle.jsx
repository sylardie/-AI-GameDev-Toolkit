import { useI18n } from "../i18n/I18nContext";

function LanguageToggle() {
  const { texts, toggleLanguage } = useI18n();

  return (
    <button className="language-toggle" onClick={toggleLanguage}>
      <span>{texts.language.current}</span>
      <strong>{texts.language.toggle}</strong>
    </button>
  );
}

export default LanguageToggle;
