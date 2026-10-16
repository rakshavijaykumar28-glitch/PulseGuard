// test-live.js
async function run() {
  const [health, dash, supa] = await Promise.all([
    fetch('http://127.0.0.1:3000/api/health').then(r => r.json()),
    fetch('http://localhost:3000/api/dashboard').then(r => r.json()),
    fetch('http://localhost:3000/api/supabase/status').then(r => r.json())
  ]);
  console.log('--- SERVER HEALTH ---');
  console.log('Localhost / 127.0.0.1:', health);
  console.log('--- DASHBOARD ---');
  console.log('Business:', dash.businessName, '| Health Score:', dash.health.overallScore);
  console.log('Top Alert:', dash.topAlert.title);
  console.log('--- SUPABASE CLOUD ---');
  console.log('Configured:', supa.configured, '| Connected:', supa.connected, '| Project:', supa.projectRef);
  console.log('Message:', supa.message);
  console.log('----------------------');
}

run().catch(console.error);
