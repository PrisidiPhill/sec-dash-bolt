import axios from 'axios';

const api = axios.create({
  baseURL: window.location.origin,
  timeout: 5000
});

export async function fetchSecurityData() {
  try {
    console.log('Requesting security data...');
    const response = await api.get('/api/crowdstrike/security-data');
    console.log('Security data received');
    return response.data;
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data
    });
    return {
      error: `Failed to fetch security data: ${error.message}`,
      crowdstrike: null
    };
  }
}
