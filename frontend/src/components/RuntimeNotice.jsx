function RuntimeNotice({ title, badge = "Local mode", children, items = [] }) {
  return (
    <div className="runtime-notice">
      <div className="runtime-notice-header">
        <span className="runtime-badge">{badge}</span>
        <strong>{title}</strong>
      </div>
      {children && <p>{children}</p>}
      {items.length > 0 && (
        <div className="runtime-item-list">
          {items.map((item) => (
            <div className="runtime-item" key={item.label}>
              <span>{item.label}</span>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RuntimeNotice;
