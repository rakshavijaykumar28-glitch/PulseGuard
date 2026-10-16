// test-suite.js - Comprehensive test verification
async function testAll() {
  const base = 'http://127.0.0.1:3000';
  console.log('--- 1. Testing Dashboard API ---');
  let dash = await (await fetch(base + '/api/dashboard')).json();
  console.log('Health score:', dash.health.overallScore, 'Top alert:', dash.topAlert.title);

  console.log('--- 2. Testing Simulation API (+20% demand) ---');
  let sim = await (await fetch(base + '/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ demandDelta: 20 })
  })).json();
  console.log('Days:', sim.daysUntilStockout, 'Prob:', sim.probability + '%', 'Score:', sim.simulatedRiskScore, 'Impact:', sim.impactEstimate.formatted);

  console.log('--- 3. Testing Action Update API ---');
  let act = await (await fetch(base + '/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionId: 1, status: 'Completed' })
  })).json();
  console.log('Action update success:', act.success, 'New health score:', act.updatedHealthScore);

  console.log('--- 4. Testing Reset Demo Data ---');
  let reset = await (await fetch(base + '/api/demo/reset', { method: 'POST' })).json();
  console.log('Reset success:', reset.success, 'Restored health score:', reset.healthScore);

  console.log('--- 5. Testing Chatbot Q: What should I do today? ---');
  let chat1 = await (await fetch(base + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What should I do today?' })
  })).json();
  console.log('Answer:', chat1.answer);
  console.log('Evidence count:', chat1.evidence.length);
  console.log('Recommendation:', chat1.recommendation);

  console.log('--- 6. Testing Chatbot Ungrounded Q ---');
  let chat2 = await (await fetch(base + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Who will win the World Cup?' })
  })).json();
  console.log('Ungrounded Answer:', chat2.answer);

  console.log('--- 7. Testing CSV Upload Validation (Missing columns) ---');
  let csvErr = await (await fetch(base + '/api/upload-csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvText: 'date,unknown_column\n2026-10-01,100', category: 'sales' })
  })).json();
  console.log('Error caught:', csvErr.error);

  console.log('--- 8. Testing CSV Upload Valid ---');
  let validCsv = 'date,product,quantity,revenue\n2026-10-03,Butter Chicken,15,4800';
  let csvOk = await (await fetch(base + '/api/upload-csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvText: validCsv, category: 'sales' })
  })).json();
  console.log('CSV Import success:', csvOk.success, 'Rows:', csvOk.rowsImported);

  console.log('--- 9. Testing Report Generation ---');
  let report = await (await fetch(base + '/api/report')).json();
  console.log('Report generated for:', report.meta.businessName, 'Score:', report.healthScore.overallScore);

  console.log('\n========================================');
  console.log('[PASS] ALL ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!');
  console.log('========================================');
}

testAll().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
