const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`http://127.0.0.1:3000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Testing Health Endpoint:');
  const health = await get('/api/health');
  console.log('  Status:', health.status);
  console.log('  Security Status:', health.body.securityStatus);
  console.log('  CSP Header:', health.headers['content-security-policy'] ? 'PRESENT' : 'MISSING');
  console.log('  HSTS Header:', health.headers['strict-transport-security'] ? 'PRESENT' : 'MISSING');
  console.log('  X-Frame-Options:', health.headers['x-frame-options']);

  console.log('\nTesting Security Checklist Endpoint:');
  const sec = await get('/api/security/checklist');
  console.log('  Status:', sec.status);
  console.log('  Profile Header Title:', sec.body.profileHeader.title);
  console.log('  Profile Header Subtitle:', sec.body.profileHeader.subtitle);
  console.log('  Profile Score:', sec.body.profileHeader.complianceScore);
  console.log(`  Left Column Items (${sec.body.leftColumn.length}):`);
  sec.body.leftColumn.forEach((item, idx) => console.log(`    ${idx + 1}. ${item.name} [${item.status}]`));
  console.log(`  Right Column Items (${sec.body.rightColumn.length}):`);
  sec.body.rightColumn.forEach((item, idx) => console.log(`    ${idx + 1}. ${item.name} [${item.status}]`));
  console.log('  Recent Audit Logs Count:', sec.body.recentAuditLogs ? sec.body.recentAuditLogs.length : 0);

  console.log('\nTesting Security Control Interactive Test (/api/security/test):');
  const testRes = await post('/api/security/test', { controlId: 'sec-ratelimit' });
  console.log('  Test Status:', testRes.status);
  console.log('  Test Body:', JSON.stringify(testRes.body));

  console.log('\nTesting Home Page HTML:');
  const home = await get('/');
  console.log('  Status:', home.status);
  console.log('  HTML Length:', typeof home.body === 'string' ? home.body.length : 0);
  console.log('  Contains Profile Header (rozgaarrhythms):', home.body.includes('rozgaarrhythms'));
  console.log('  Contains Security Nav Tab:', home.body.includes('data-tab="security"'));
  console.log('  Contains Terms of Service Modal:', home.body.includes('modal-tos'));
  console.log('  Contains Privacy Policy Modal:', home.body.includes('modal-privacy'));
}

run().catch(console.error);
