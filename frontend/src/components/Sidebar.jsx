import { NavLink } from "react-router-dom";

import { useI18n } from "../i18n/useI18n";

const navGroups = [
  {
    key: "overview",
    items: [["/", "dashboard", "neutral"]],
  },
  {
    key: "localTools",
    items: [
      ["/configs", "configs", "local"],
      ["/code", "code", "local"],
      ["/assets", "assets", "local"],
      ["/audio", "audio", "local"],
    ],
  },
  {
    key: "aiWorkflows",
    items: [
      ["/design", "design", "ai"],
      ["/art", "art", "ai"],
    ],
  },
  {
    key: "system",
    items: [["/settings", "settings", "neutral"]],
  },
];

function Sidebar() {
  const { texts } = useI18n();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">AI</div>
        <div>
          <div className="brand-title">{texts.sidebar.brandTitle}</div>
          <div className="brand-subtitle">{texts.sidebar.brandSubtitle}</div>
        </div>
      </div>

      <nav className="nav-list">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.key}>
            <div className="nav-group-title">{texts.sidebar.groups[group.key]}</div>
            {group.items.map(([path, key, capability]) => {
              const [label, desc] = texts.sidebar.nav[key];

              return (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/"}
                  className={({ isActive }) =>
                    isActive ? "nav-item active" : "nav-item"
                  }
                >
                  <div className="nav-label-row">
                    <div className="nav-label">{label}</div>
                    {capability !== "neutral" && (
                      <span className={`nav-capability ${capability}`}>
                        {texts.sidebar.capabilities[capability]}
                      </span>
                    )}
                  </div>
                  <div className="nav-desc">{desc}</div>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>
        <span>{texts.sidebar.localTool}</span>
      </div>
    </aside>
  );
}

export default Sidebar;
