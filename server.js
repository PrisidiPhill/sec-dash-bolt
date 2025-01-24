import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { 
  SecretsManagerClient, 
  GetSecretValueCommand 
} from "@aws-sdk/client-secrets-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize AWS Secrets Manager
const secretsManager = new SecretsManagerClient({ 
  region: process.env.AWS_REGION || "us-east-1" 
});

// Function to get secrets from AWS Secrets Manager
async function getSecrets() {
  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.AWS_SECRET_NAME
    });
    const response = await secretsManager.send(command);
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error('Error fetching secrets:', error);
    throw error;
  }
}

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('dist'));

// Token management
let accessToken = null;
let tokenExpiry = null;

async function getFalconToken(secrets) {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      `${secrets.FALCON_BASE_URL}/oauth2/token`,
      `client_id=${secrets.FALCON_CLIENT_ID}&client_secret=${secrets.FALCON_CLIENT_SECRET}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);
    return accessToken;
  } catch (error) {
    console.error('Token Error:', error.response?.data || error.message);
    throw new Error('Authentication failed');
  }
}

app.get('/api/crowdstrike/security-data', async (req, res) => {
  try {
    const secrets = await getSecrets();
    const token = await getFalconToken(secrets);

    const [vulnResponse, ioaResponse] = await Promise.all([
      axios.get(`${secrets.FALCON_BASE_URL}/vulnerabilities/queries/vulnerabilities/v1`, {
        params: { filter: 'created_timestamp:>now-30d' },
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }),
      axios.get(`${secrets.FALCON_BASE_URL}/detects/queries/detects/v1`, {
        params: { filter: 'created_timestamp:>now-7d+severity:>3' },
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
    ]);

    res.json({
      crowdstrike: {
        vulnerabilities: {
          total: vulnResponse.data.meta?.pagination?.total || 0,
          critical: vulnResponse.data.resources?.filter(v => v.severity === 'Critical').length || 0,
          high: vulnResponse.data.resources?.filter(v => v.severity === 'High').length || 0,
          medium: vulnResponse.data.resources?.filter(v => v.severity === 'Medium').length || 0
        },
        ioaEvents: {
          total: ioaResponse.data.meta?.pagination?.total || 0,
          critical: ioaResponse.data.resources?.filter(e => e.severity === 5).length || 0,
          high: ioaResponse.data.resources?.filter(e => e.severity === 4).length || 0
        }
      }
    });
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch security data' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
