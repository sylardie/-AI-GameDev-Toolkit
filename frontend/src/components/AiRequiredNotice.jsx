import { Link } from "react-router-dom";

import ToolIcon from "./ToolIcon";

function AiRequiredNotice({ title, message, actionLabel }) {
  return (
    <div className="ai-required-box">
      <span className="ai-required-icon">
        <ToolIcon name="spark" size={20} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      <Link className="settings-link-button" to="/settings">
        <ToolIcon name="settings" size={16} />
        {actionLabel}
      </Link>
    </div>
  );
}

export default AiRequiredNotice;
