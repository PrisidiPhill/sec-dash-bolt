import { MetricCard } from './MetricCard';

export function Dashboard({ data }) {
  const { crowdstrike } = data;

  return (
    <div className="metrics-grid">
      <MetricCard
        title="Vulnerability Management"
        total={crowdstrike?.vulnerabilities?.total || 0}
        metrics={[
          { label: 'Critical', value: crowdstrike?.vulnerabilities?.critical || 0, severity: 'critical' },
          { label: 'High', value: crowdstrike?.vulnerabilities?.high || 0, severity: 'high' },
          { label: 'Medium', value: crowdstrike?.vulnerabilities?.medium || 0, severity: 'medium' }
        ]}
      />
      
      <MetricCard
        title="Security Events (7d)"
        total={crowdstrike?.ioaEvents?.total || 0}
        metrics={[
          { label: 'Critical', value: crowdstrike?.ioaEvents?.critical || 0, severity: 'critical' },
          { label: 'High', value: crowdstrike?.ioaEvents?.high || 0, severity: 'high' }
        ]}
      />
    </div>
  );
}
