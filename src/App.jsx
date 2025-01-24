import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dashboard } from './components/Dashboard';
import { fetchSecurityData } from './services/api';

export function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchSecurityData();
        if (result.error) {
          setError(result.error);
        } else {
          setData(result);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 12 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Security Posture Overview</h1>
        <div className="date">{format(new Date(), 'MM/dd/yyyy')}</div>
      </div>
      
      {loading && <div>Loading security data...</div>}
      {error && <div className="error-message">{error}</div>}
      {data && <Dashboard data={data} />}
    </div>
  );
}
