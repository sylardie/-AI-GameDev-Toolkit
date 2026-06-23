import { NavLink } from "react-router-dom";

import { useI18n } from "../i18n/I18nContext";

const navKeys = [
  ["/", "dashboard"],
  ["/design", "design"],
  ["/configs", "configs"],
  ["/code", "code"],
  ["/art", "art"],
  ["/assets", "assets"],
  ["/audio", "audio"],
  ["/settings", "settings"],
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
        {navKeys.map(([path, key]) => {
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
              <div className="nav-label">{label}</div>
              <div className="nav-desc">{desc}</div>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>
        <span>{texts.sidebar.localTool}</span>
      </div>
    </aside>
  );
}

export default Sidebar;
