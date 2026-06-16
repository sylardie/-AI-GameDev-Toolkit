import { NavLink } from "react-router-dom";

const navItems = [
  {
    path: "/",
    label: "Dashboard",
    desc: "项目总览",
  },
  {
    path: "/design",
    label: "Design Generator",
    desc: "策划与配置生成",
  },
  {
    path: "/code",
    label: "Code Agent",
    desc: "Godot / Unity 助手",
  },
  {
    path: "/art",
    label: "Art Pipeline",
    desc: "美术生产管线",
  },
  {
    path: "/settings",
    label: "Settings",
    desc: "模型与工具配置",
  },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">AI</div>
        <div>
          <div className="brand-title">GameDev Toolkit</div>
          <div className="brand-subtitle">AI Workflow Platform</div>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <div className="nav-label">{item.label}</div>
            <div className="nav-desc">{item.desc}</div>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot"></div>
        <span>Local Web Tool</span>
      </div>
    </aside>
  );
}

export default Sidebar;