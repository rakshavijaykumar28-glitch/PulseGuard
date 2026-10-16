const http = require('http');

function check(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

async function run() {
  const health = await check('http://127.0.0.1:3001/api/health');
  console.log('Health check status:', health.status);

  const index = await check('http://127.0.0.1:3001/');
  console.log('Index status:', index.status);

  const notFound = await check('http://127.0.0.1:3001/non-existent-page');
  console.log('404 Status:', notFound.status);
  console.log('404 Page contains "Page Not Found":', notFound.body.includes('Page Not Found'));
}

run().catch(console.error);
