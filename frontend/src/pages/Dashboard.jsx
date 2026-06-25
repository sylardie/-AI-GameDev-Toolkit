import { Link } from "react-router-dom";

import packageJson from "../../package.json";
import { useI18n } from "../i18n/useI18n";

const moduleRoutes = ["/design", "/configs", "/code", "/art", "/assets", "/audio"];

function Dashboard() {
  const { texts } = useI18n();
  const dashboard = texts.dashboard;

  return (
    <div className="page">
      <section className="hero-card">
        <div>
          <div className="eyebrow">{dashboard.eyebrow}</div>
          <h1>{dashboard.title}</h1>
          <p>{dashboard.intro}</p>
        </div>
      </section>

      <section className="module-grid">
        {dashboard.modules.map((module, index) => (
          <ModuleCard key={module.title} to={moduleRoutes[index]} {...module} />
        ))}
      </section>
      <div className="dashboard-meta">v{packageJson.version} · AI GameDev Toolkit</div>
    </div>
  );
}

function ModuleCard({ title, tag, description, highlights, to }) {
  return (
    <Link className="module-card module-link-card" to={to}>
      <div className="module-header">
        <h3>{title}</h3>
        <span>{tag}</span>
      </div>
      <p>{description}</p>
      <div className="template-focus">
        {highlights.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </Link>
  );
}

export default Dashboard;
