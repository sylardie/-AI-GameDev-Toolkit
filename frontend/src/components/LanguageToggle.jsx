import { useI18n } from "../i18n/useI18n";
import ToolIcon from "./ToolIcon";

function LanguageToggle() {
  const { texts, toggleLanguage } = useI18n();

  return (
    <button className="language-toggle" onClick={toggleLanguage}>
      <ToolIcon name="globe" size={16} />
      <span>{texts.language.current}</span>
      <strong>{texts.language.toggle}</strong>
    </button>
  );
}

export default LanguageToggle;
