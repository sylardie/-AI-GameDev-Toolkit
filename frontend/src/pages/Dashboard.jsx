import { useI18n } from "../i18n/I18nContext";

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
