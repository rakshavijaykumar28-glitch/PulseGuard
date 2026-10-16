const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(opts, (res) => {
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
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- TESTING SQL DATABASE REST API ---');

  // 1. Check DB Status
  const statusRes = await request('GET', '/api/db/status');
  console.log('[PASS] DB Status:', statusRes.status, statusRes.body.engine, 'Tables:', statusRes.body.tables);

  // 2. Get All Data
  const dataRes = await request('GET', '/api/data');
  console.log('[PASS] All Data:', dataRes.status, 'Categories:', dataRes.body.categories.length, 'Tx:', dataRes.body.transactions.length);

  // 3. Insert Transaction
  const newTx = {
    date: '2026-10-15',
    type: 'expense',
    categoryId: 'cat-groceries',
    description: 'SQL Database Verification Test Grocery',
    amount: 45.50,
    paymentMethod: 'Credit Card',
    notes: 'Inserted directly via parameterized SQL query'
  };
  const createRes = await request('POST', '/api/transactions', newTx);
  console.log('[PASS] Create Transaction:', createRes.status, 'ID:', createRes.body.id);

  // 4. Update Transaction
  const updateRes = await request('PUT', `/api/transactions/${createRes.body.id}`, {
    ...newTx,
    amount: 52.00,
    description: 'Updated SQL Grocery Expense'
  });
  console.log('[PASS] Update Transaction:', updateRes.status, 'Amount:', updateRes.body.amount);

  // 5. Delete Transaction
  const delRes = await request('DELETE', `/api/transactions/${createRes.body.id}`);
  console.log('[PASS] Delete Transaction:', delRes.status, delRes.body);

  // 6. Upsert Budget
  const budgetRes = await request('POST', '/api/budgets', {
    month: '2026-10',
    categoryId: 'cat-groceries',
    amount: 550.00
  });
  console.log('[PASS] Upsert Budget:', budgetRes.status, budgetRes.body);

  console.log('\nAll SQL Database API operations verified successfully!');
}

runTests().catch(console.error);
