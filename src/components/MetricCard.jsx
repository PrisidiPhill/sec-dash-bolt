export function MetricCard({ title, total, metrics }) {
  return (
    <div className="metric-card">
      <h3>{title}</h3>
      <div className="metric-value">{total}</div>
      <div className="metric-details">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-item">
            <span>{metric.label}</span>
            <span className={metric.severity}>{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
