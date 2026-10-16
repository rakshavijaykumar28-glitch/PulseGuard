// test-auto.js
async function testAuto() {
  const base = 'http://127.0.0.1:3000';
  let res = await (await fetch(base + '/api/actions/auto-mitigate-all', { method: 'POST' })).json();
  console.log('Auto-mitigate result:', res);
  let dash = await (await fetch(base + '/api/dashboard')).json();
  console.log('Health after auto-mitigate:', dash.health.overallScore, 'Status:', dash.health.status);
  let reset = await (await fetch(base + '/api/demo/reset', { method: 'POST' })).json();
  console.log('Reset back to demo:', reset.healthScore);
}
testAuto().catch(console.error);
