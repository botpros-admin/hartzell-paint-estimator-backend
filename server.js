const express = require('express');
const cors = require('cors');
const https = require('https');
const app = express();

// Enable CORS - UPDATE WITH YOUR NETLIFY DOMAIN!
const allowedOrigins = [
  'https://hartzell.netlify.app',      // Your actual Netlify domain
  'https://hartzell-base.netlify.app',  // Alternative domain
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Bitrix24 webhook URL
const WEBHOOK_URL = 'https://hartzell.app/rest/1/jp689g5yfvre9pvd/';

// Simple health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Paint Estimator API is running!',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    bitrixWebhook: WEBHOOK_URL.replace(/\/[^\/]+\/$/, '/***hidden***/') 
  });
});

// Proxy Bitrix24 requests
app.post('/api/bitrix/:method', (req, res) => {
  const method = req.params.method;
  const bitrixUrl = `${WEBHOOK_URL}${method}`;
  
  console.log(`Proxying request to Bitrix24: ${method}`);
  
  const postData = JSON.stringify(req.body);
  
  const urlParts = new URL(bitrixUrl);
  const options = {
    hostname: urlParts.hostname,
    port: 443,
    path: urlParts.pathname + urlParts.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const bitrixReq = https.request(options, (bitrixRes) => {
    let data = '';
    
    bitrixRes.on('data', (chunk) => {
      data += chunk;
    });
    
    bitrixRes.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (e) {
        console.error('Failed to parse Bitrix24 response:', e);
        res.status(500).json({ 
          error: 'Invalid response from Bitrix24',
          details: data.substring(0, 200) 
        });
      }
    });
  });
  
  bitrixReq.on('error', (e) => {
    console.error(`Bitrix24 API Error: ${e.message}`);
    res.status(500).json({ 
      error: 'Failed to connect to Bitrix24',
      details: e.message 
    });
  });
  
  bitrixReq.write(postData);
  bitrixReq.end();
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});
