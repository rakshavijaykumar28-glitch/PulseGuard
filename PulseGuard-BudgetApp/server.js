// server.js - Enterprise HTTP & SQL REST Server for PulseGuard
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db.js');

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8'
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 10 * 1024 * 1024) {
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON Payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  // Enterprise Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // --- SQL DATABASE REST API ENDPOINTS ---
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Health check
      if (pathname === '/api/health' && method === 'GET') {
        return sendJson(res, 200, {
          status: 'OK',
          app: 'PulseGuard Personal Budget & Expense Manager',
          storage: 'SQLite 3 SQL Database',
          timestamp: new Date().toISOString()
        });
      }

      // 2. Database Status
      if (pathname === '/api/db/status' && method === 'GET') {
        return sendJson(res, 200, db.getStatus());
      }

      // Download Raw SQLite Database File
      if (pathname === '/api/db/download' && method === 'GET') {
        const dbPath = db.getDbPath();
        if (fs.existsSync(dbPath)) {
          res.writeHead(200, {
            'Content-Type': 'application/x-sqlite3',
            'Content-Disposition': 'attachment; filename="pulseguard.sqlite"',
            'Content-Length': fs.statSync(dbPath).size
          });
          return fs.createReadStream(dbPath).pipe(res);
        }
        return sendJson(res, 404, { error: 'Database file not found' });
      }

      // 3. Get All SQL Data
      if (pathname === '/api/data' && method === 'GET') {
        return sendJson(res, 200, db.getAllData());
      }

      // 4. Create Transaction (POST)
      if (pathname === '/api/transactions' && method === 'POST') {
        const body = await readJsonBody(req);
        if (!body.amount || !body.date || !body.categoryId) {
          return sendJson(res, 400, { error: 'Missing required transaction fields' });
        }
        const created = db.addTransaction(body);
        return sendJson(res, 201, created);
      }

      // 5. Update Transaction (PUT /api/transactions/:id)
      if (pathname.startsWith('/api/transactions/') && method === 'PUT') {
        const id = pathname.replace('/api/transactions/', '');
        const body = await readJsonBody(req);
        const updated = db.updateTransaction(id, body);
        return sendJson(res, 200, updated);
      }

      // 6. Delete Transaction (DELETE /api/transactions/:id)
      if (pathname.startsWith('/api/transactions/') && method === 'DELETE') {
        const id = pathname.replace('/api/transactions/', '');
        const result = db.deleteTransaction(id);
        return sendJson(res, 200, result);
      }

      // 7. Upsert Budget (POST /api/budgets)
      if (pathname === '/api/budgets' && method === 'POST') {
        const body = await readJsonBody(req);
        if (!body.month || !body.categoryId) {
          return sendJson(res, 400, { error: 'Missing month or categoryId' });
        }
        const updated = db.upsertBudget(body.month, body.categoryId, body.amount);
        return sendJson(res, 200, updated);
      }

      // 8. Batch Import CSV Transactions (POST /api/import-csv)
      if (pathname === '/api/import-csv' && method === 'POST') {
        const body = await readJsonBody(req);
        if (!Array.isArray(body.transactions)) {
          return sendJson(res, 400, { error: 'Transactions array required' });
        }
        const result = db.batchImportTransactions(body.transactions, body.mode || 'append');
        return sendJson(res, 200, result);
      }

      // 9. Reset Demo Data (POST /api/reset-demo)
      if (pathname === '/api/reset-demo' && method === 'POST') {
        const result = db.resetDemoData();
        return sendJson(res, 200, result);
      }

      // 10. Clear All Data (POST /api/clear-all)
      if (pathname === '/api/clear-all' && method === 'POST') {
        const result = db.clearAllData();
        return sendJson(res, 200, result);
      }

      // 11. Save Setting (POST /api/settings)
      if (pathname === '/api/settings' && method === 'POST') {
        const body = await readJsonBody(req);
        if (!body.key) {
          return sendJson(res, 400, { error: 'Setting key required' });
        }
        const result = db.setSetting(body.key, body.value);
        return sendJson(res, 200, result);
      }

      // Fallback for unmapped API routes
      return sendJson(res, 404, { error: 'API endpoint not found' });
    } catch (apiErr) {
      console.error('API Error:', apiErr);
      return sendJson(res, 500, { error: apiErr.message || 'Internal Database Server Error' });
    }
  }

  // --- STATIC FILE SERVING ---
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const notFoundPath = path.join(PUBLIC_DIR, '404.html');
      fs.readFile(notFoundPath, (err404, content404) => {
        if (!err404) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(content404);
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Page Not Found');
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PulseGuard connected to SQLite Database.`);
  console.log(`  > Local:       http://localhost:${PORT}`);
  console.log(`  > Network:     http://127.0.0.1:${PORT}`);
  console.log(`  > SQL DB File: ${db.getDbPath()}`);
});
