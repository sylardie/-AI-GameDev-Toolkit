import { useI18n } from "../i18n/I18nContext";
import RuntimeNotice from "../components/RuntimeNotice";

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
        {dashboard.modules.map((module) => (
          <ModuleCard key={module.title} {...module} />
        ))}
      </section>

      <section className="panel">
        <h2>Runtime Mode</h2>
        <RuntimeNotice
          title="Local-first desktop workflow"
          badge="Local mode"
          items={[
            {
              label: "Local-only",
              detail: "Config Manager scans local Excel folders, Code Agent scans local Unity / Godot paths, and ComfyUI connects to a service on this machine.",
            },
            {
              label: "Cloud alternative",
              detail: "A hosted version should use uploaded Excel/project ZIP files, Git repository connections, or a remote ComfyUI worker instead of local paths.",
            },
          ]}
        >
          This toolkit is currently optimized for local deployment, where the browser UI and FastAPI backend run on the same PC as the game project files.
        </RuntimeNotice>
      </section>

      <section className="panel">
        <h2>{dashboard.workflowTitle}</h2>
        <div className="workflow">
          {dashboard.workflowSteps.map(([index, title]) => (
            <WorkflowStep key={index} index={index} title={title} />
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{dashboard.principleTitle}</h2>
        <div className="todo-list">
          {dashboard.principles.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ModuleCard({ title, tag, description, highlights }) {
  return (
    <div className="module-card">
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
    </div>
  );
}

function WorkflowStep({ index, title }) {
  return (
    <div className="workflow-step">
      <div className="workflow-index">{index}</div>
      <div>{title}</div>
    </div>
  );
}

export default Dashboard;
