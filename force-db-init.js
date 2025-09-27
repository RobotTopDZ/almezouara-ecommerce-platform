// Script to force database initialization after Railway deployment
const https = require('https');

const RAILWAY_URL = 'https://almezouara-ecommerce-platform-production.up.railway.app';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, RAILWAY_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Database-Init-Script'
      }
    };

    if (data && method === 'POST') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function initializeDatabase() {
  console.log('🔧 Starting database initialization...');
  
  try {
    // 1. Check health
    console.log('1. Checking application health...');
    const health = await makeRequest('/health');
    console.log('Health status:', health.status, health.data);

    // 2. Check database debug info
    console.log('\n2. Checking database configuration...');
    const debug = await makeRequest('/debug-database');
    console.log('Database debug:', debug.status, debug.data);

    // 3. Force database initialization
    console.log('\n3. Forcing database initialization...');
    const init = await makeRequest('/init-database', 'POST');
    console.log('Database init result:', init.status, init.data);

    // 4. Populate initial data
    console.log('\n4. Populating initial data...');
    const populate = await makeRequest('/populate-data', 'POST');
    console.log('Data population result:', populate.status, populate.data);

    console.log('\n✅ Database initialization completed!');
    console.log('🎯 You can now test order creation on your Railway app.');

  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
  }
}

// Run the initialization
initializeDatabase();
