import ToolIcon from "./ToolIcon";

function PageTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="page-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className={activeTab === tab.id ? "page-tab active" : "page-tab"}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <ToolIcon name={tab.icon} size={16} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default PageTabs;
