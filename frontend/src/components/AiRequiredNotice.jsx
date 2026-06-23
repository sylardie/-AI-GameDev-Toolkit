import { Link } from "react-router-dom";

function AiRequiredNotice({ title, message, actionLabel }) {
  return (
    <div className="ai-required-box">
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      <Link className="settings-link-button" to="/settings">
        {actionLabel}
      </Link>
    </div>
  );
}

export default AiRequiredNotice;
