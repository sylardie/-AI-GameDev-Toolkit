import ToolIcon from "./ToolIcon";

function WorkspaceHeader({ eyebrow, title, intro, icon, capability, capabilityLabel }) {
  return (
    <header className={`workspace-header ${capability || "neutral"}`}>
      <div className={`workspace-header-icon ${capability || "neutral"}`}>
        <ToolIcon name={icon} size={26} />
      </div>
      <div className="workspace-header-copy">
        <div className="workspace-header-meta">
          <span className="eyebrow">{eyebrow}</span>
          {capabilityLabel && (
            <span className={`workspace-capability ${capability || "neutral"}`}>
              {capabilityLabel}
            </span>
          )}
        </div>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
    </header>
  );
}

export default WorkspaceHeader;
