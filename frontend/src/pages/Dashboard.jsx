import { Link } from "react-router-dom";

import packageJson from "../../package.json";
import ToolIcon from "../components/ToolIcon";
import { useI18n } from "../i18n/useI18n";

const moduleRoutes = ["/design", "/configs", "/code", "/art", "/audio-generator", "/assets", "/audio"];
const moduleIcons = ["design", "configs", "code", "art", "audio", "assets", "audio"];
const localModuleIndexes = [1, 2, 5, 6];
const aiModuleIndexes = [0, 3, 4];

function Dashboard() {
  const { texts } = useI18n();
  const dashboard = texts.dashboard;

  return (
    <div className="page dashboard-page">
      <section className="hero-card dashboard-hero">
        <div className="hero-copy">
          <div className="eyebrow">{dashboard.eyebrow}</div>
          <h1>{dashboard.title}</h1>
          <p>{dashboard.intro}</p>
          <div className="hero-actions">
            <Link className="hero-primary-action" to="/assets">
              <ToolIcon name="assets" size={18} />
              {dashboard.startLocal}
            </Link>
            <Link className="hero-secondary-action" to="/settings">
              <ToolIcon name="settings" size={18} />
              {dashboard.configureAi}
            </Link>
          </div>
        </div>

        <div className="hero-summary">
          <div className="hero-summary-card local">
            <ToolIcon name="shield" size={22} />
            <strong>{dashboard.localCount}</strong>
            <span>{dashboard.localCountHint}</span>
          </div>
          <div className="hero-summary-card ai">
            <ToolIcon name="spark" size={22} />
            <strong>{dashboard.aiCount}</strong>
            <span>{dashboard.aiCountHint}</span>
          </div>
        </div>
      </section>

      <DashboardSection
        capability="local"
        count={localModuleIndexes.length}
        indexes={localModuleIndexes}
        intro={dashboard.localSectionIntro}
        kicker={dashboard.localSectionKicker}
        title={dashboard.localSectionTitle}
      />

      <DashboardSection
        capability="ai"
        indexes={aiModuleIndexes}
        intro={dashboard.aiSectionIntro}
        kicker={dashboard.aiSectionKicker}
        title={dashboard.aiSectionTitle}
      />

      <div className="dashboard-meta">v{packageJson.version} · AI GameDev Toolkit</div>
    </div>
  );
}

function DashboardSection({ capability, count, indexes, intro, kicker, title }) {
  const { texts } = useI18n();
  const dashboard = texts.dashboard;

  return (
    <section className={`dashboard-section ${capability}-dashboard-section`}>
      <div className="dashboard-section-header">
        <div>
          <span className={`section-kicker ${capability}`}>{kicker}</span>
          <h2>{title}</h2>
          <p>{intro}</p>
        </div>
        {capability === "ai" ? (
          <Link className="section-settings-link" to="/settings">
            <ToolIcon name="settings" size={16} />
            {dashboard.configureAi}
          </Link>
        ) : (
          <span className="section-count">{count}</span>
        )}
      </div>

      <div className={`module-grid ${capability}-module-grid`}>
        {indexes.map((index) => (
          <ModuleCard
            key={dashboard.modules[index].title}
            capability={capability}
            capabilityLabel={
              capability === "local" ? dashboard.localCapability : dashboard.aiCapability
            }
            icon={moduleIcons[index]}
            openLabel={dashboard.openModule}
            to={moduleRoutes[index]}
            {...dashboard.modules[index]}
          />
        ))}
      </div>
    </section>
  );
}

function ModuleCard({
  title,
  tag,
  description,
  highlights,
  to,
  icon,
  capability,
  capabilityLabel,
  openLabel,
}) {
  return (
    <Link className={`module-card module-link-card ${capability}`} to={to}>
      <div className="module-header">
        <span className={`module-icon ${capability}`}>
          <ToolIcon name={icon} size={23} />
        </span>
        <span className={`module-capability ${capability}`}>{capabilityLabel}</span>
      </div>
      <div className="module-title-row">
        <h3>{title}</h3>
        <span>{tag}</span>
      </div>
      <p>{description}</p>
      <div className="template-focus">
        {highlights.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="module-open-row">
        <span>{openLabel}</span>
        <ToolIcon name="arrow" size={17} />
      </div>
    </Link>
  );
}

export default Dashboard;
