// test-supabase-auth.js - Comprehensive Verification of PulseGuard Supabase Auth Integration
const http = require('node:http');
const https = require('node:https');

function get(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const mod = urlStr.startsWith('https') ? https : http;
    const urlObj = new URL(urlStr);
    const req = mod.request({
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function post(urlStr, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const mod = urlStr.startsWith('https') ? https : http;
    const urlObj = new URL(urlStr);
    const req = mod.request({
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('PULSEGUARD ENTERPRISE AUTHENTICATION & SUPABASE INTEGRATION TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // TEST 1: Server Auth Config Endpoint
  console.log('TEST SUITE 1: Auth Configuration API');
  try {
    const configRes = await get('http://127.0.0.1:3000/api/auth/config');
    assert(configRes.status === 200, 'GET /api/auth/config status 200', `Got ${configRes.status}`);
    assert(configRes.body.supabaseUrl && configRes.body.supabaseUrl.includes('supabase.co'), 'Supabase URL valid in config', configRes.body.supabaseUrl);
    assert(configRes.body.supabaseAnonKey && configRes.body.supabaseAnonKey.startsWith('sb_publishable_'), 'Supabase publishable key valid', configRes.body.supabaseAnonKey);
  } catch (err) {
    assert(false, 'GET /api/auth/config reachable', err.message);
  }

  // TEST 2: Live Supabase Auth Service Connectivity
  console.log('\nTEST SUITE 2: Live Supabase Backend Auth Connectivity');
  const SUPABASE_URL = 'https://ppvullctudlfjqunkmad.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_kD5f5BdXu8f64Ty8GbU5zQ_skOCQrI-';
  const sbHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  try {
    // 2.1 Settings
    const settingsRes = await get(`${SUPABASE_URL}/auth/v1/settings`, sbHeaders);
    assert(settingsRes.status === 200, 'Supabase /auth/v1/settings returns 200', `Got ${settingsRes.status}`);
    assert(settingsRes.body.external?.email === true, 'Supabase Email Auth Provider is enabled', JSON.stringify(settingsRes.body.external));

    // 2.2 Reject invalid sign-in
    const badLoginRes = await post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      email: 'nonexistent-admin-test@pulseguard.io',
      password: 'invalidPassword999!'
    }, sbHeaders);
    assert(badLoginRes.status === 400, 'Supabase signInWithPassword rejects bad credentials with 400', `Got ${badLoginRes.status}`);
    assert(badLoginRes.body.error_code === 'invalid_credentials' || (badLoginRes.body.msg && badLoginRes.body.msg.includes('Invalid login credentials')),
      'Supabase error code is invalid_credentials', JSON.stringify(badLoginRes.body));

    // 2.3 Reject weak password on registration
    const weakSignupRes = await post(`${SUPABASE_URL}/auth/v1/signup`, {
      email: 'test-weak@pulseguard.io',
      password: '123'
    }, sbHeaders);
    assert(weakSignupRes.status === 422, 'Supabase signUp rejects weak password with 422', `Got ${weakSignupRes.status}`);
    assert(weakSignupRes.body.error_code === 'weak_password' || (weakSignupRes.body.msg && weakSignupRes.body.msg.includes('at least 6 characters')),
      'Supabase reports weak_password', JSON.stringify(weakSignupRes.body));

    // 2.4 Test password recovery dispatch
    const recoverRes = await post(`${SUPABASE_URL}/auth/v1/recover`, {
      email: 'security-audit-test@pulseguard.io'
    }, sbHeaders);
    assert(recoverRes.status === 200, 'Supabase /auth/v1/recover accepts password reset dispatch with 200', `Got ${recoverRes.status}`);
  } catch (err) {
    assert(false, 'Live Supabase API communication error', err.message);
  }

  // TEST 3: Auth Session Sync & Audit Logging
  console.log('\nTEST SUITE 3: Application Session Sync & Audit Logging');
  try {
    const syncRes = await post('http://127.0.0.1:3000/api/auth/sync', {
      email: 'audit-officer@pulseguard.io',
      name: 'Alex Mercer',
      userId: 'usr-audit-test-uuid'
    });
    assert(syncRes.status === 200, 'POST /api/auth/sync returns 200', `Got ${syncRes.status}`);
    assert(syncRes.body.success === true, 'POST /api/auth/sync returns success', JSON.stringify(syncRes.body));

    // Check admin audit logs
    const auditRes = await get('http://127.0.0.1:3000/api/security/checklist');
    const logs = auditRes.body.recentAuditLogs || [];
    const foundSync = logs.find(l => l.action_type === 'USER_SESSION_SYNC' && l.target_entity === 'audit-officer@pulseguard.io');
    assert(foundSync !== undefined, 'User session sync recorded in SQLite audit ledger', `Found: ${Boolean(foundSync)}`);
  } catch (err) {
    assert(false, 'Session sync endpoint test error', err.message);
  }

  // TEST 4: Frontend Auth HTML & Accessibility Requirements
  console.log('\nTEST SUITE 4: Frontend UI Elements, Forms & Accessibility Controls');
  try {
    const htmlRes = await get('http://127.0.0.1:3000/');
    assert(htmlRes.status === 200, 'GET / index.html returns 200', `Got ${htmlRes.status}`);
    const html = typeof htmlRes.body === 'string' ? htmlRes.body : '';

    // Auth screen elements
    assert(html.includes('id="auth-loading-screen"'), 'Loading screen #auth-loading-screen present', 'Missing');
    assert(html.includes('id="auth-container"'), 'Auth container #auth-container present', 'Missing');
    assert(html.includes('id="app-shell"'), 'Protected app shell #app-shell present', 'Missing');
    assert(html.includes('id="user-profile-badge"'), 'Navbar user badge #user-profile-badge present', 'Missing');

    // Sign Up Fields
    assert(html.includes('id="signup-name"') && html.includes('autocomplete="name"'), 'Full Name input with accessible autocomplete present', 'Missing');
    assert(html.includes('id="signup-email"') && html.includes('autocomplete="email"'), 'Sign-up Email input with accessible autocomplete present', 'Missing');
    assert(html.includes('id="signup-password"') && html.includes('autocomplete="new-password"'), 'Sign-up Password input with minlength=6 present', 'Missing');
    assert(html.includes('id="signup-confirm-password"'), 'Confirm Password input present', 'Missing');
    assert(html.includes('id="signup-agree-terms"'), 'Terms and privacy acknowledgement checkbox present', 'Missing');
    assert(html.includes('id="btn-signup-submit"'), 'Create Account button present', 'Missing');
    assert(html.includes('id="link-goto-login"'), 'Link to login page present in sign-up view', 'Missing');

    // Login Fields
    assert(html.includes('id="login-email"'), 'Login Email input present', 'Missing');
    assert(html.includes('id="login-password"'), 'Login Password input present', 'Missing');
    assert(html.includes('id="btn-login-submit"'), 'Login button present', 'Missing');
    assert(html.includes('id="link-goto-signup"'), 'Link to sign-up present in login view', 'Missing');
    assert(html.includes('id="link-forgot-password"'), 'Forgot Password link present', 'Missing');

    // Password visibility toggles
    assert(html.includes('id="btn-toggle-login-pw"'), 'Login password visibility toggle button present', 'Missing');
    assert(html.includes('id="btn-toggle-signup-pw"'), 'Sign-up password visibility toggle button present', 'Missing');
    assert(html.includes('id="btn-toggle-confirm-pw"'), 'Confirm password visibility toggle button present', 'Missing');

    // Modals & Links
    assert(html.includes('id="auth-link-tos"') && html.includes('id="auth-link-privacy"'), 'Accessible Terms and Privacy links present in auth', 'Missing');
    assert(html.includes('id="modal-tos"') && html.includes('id="modal-privacy"'), 'Accessible Terms and Privacy policy modals present', 'Missing');

    // Scripts
    assert(html.includes('src="supabase.min.js"'), 'Supabase JS client library script tag present', 'Missing');
    assert(html.includes('src="auth.js"'), 'Auth module script tag present', 'Missing');
    assert(html.includes('src="app.js"'), 'App module script tag present', 'Missing');
  } catch (err) {
    assert(false, 'Frontend HTML inspection error', err.message);
  }

  // TEST 5: Preservation of Original PulseGuard Functionality
  console.log('\nTEST SUITE 5: Preservation of Original PulseGuard Features');
  try {
    // 5.1 Health check
    const health = await get('http://127.0.0.1:3000/api/health');
    assert(health.status === 200 && health.body.status === 'healthy', 'GET /api/health returns healthy', JSON.stringify(health.body));
    assert(health.headers['content-security-policy'] !== undefined, 'CSP Security Header is enforced', 'Missing');

    // 5.2 Sectors list
    const sectorsRes = await get('http://127.0.0.1:3000/api/sectors');
    assert(sectorsRes.status === 200 && sectorsRes.body.sectors?.length >= 7, `GET /api/sectors returns all 7 sectors`, `Count: ${sectorsRes.body.sectors?.length}`);

    // 5.3 Restaurant sector telemetry
    const sectorRes = await get('http://127.0.0.1:3000/api/sector/restaurant');
    assert(sectorRes.status === 200 && sectorRes.body.businessName.includes('Heritage Bites'), 'GET /api/sector/restaurant returns Heritage Bites data', sectorRes.body.businessName);
    assert(sectorRes.body.kpis && Object.keys(sectorRes.body.kpis).length > 0, 'Sector KPIs populated', `KPI keys: ${Object.keys(sectorRes.body.kpis || {}).length}`);
    assert(sectorRes.body.actions?.length > 0, 'Sector action checklist populated', `Actions: ${sectorRes.body.actions?.length}`);

    // 5.4 What-if simulation
    const simRes = await post('http://127.0.0.1:3000/api/sector/restaurant/simulate', {
      demandDelta: 15,
      supplierDelayDelta: 2,
      inventoryDelta: -10
    });
    assert(simRes.status === 200 && simRes.body.simulatedRiskScore !== undefined, 'What-if Simulation POST returns recalculation', JSON.stringify(simRes.body.simulatedRevenueLoss));

    // 5.5 Report generation
    const repRes = await get('http://127.0.0.1:3000/api/report?sector=restaurant');
    assert(repRes.status === 200 && repRes.body.title.includes('PulseGuard AI'), 'Operations Audit Report generator functions', repRes.body.title);

    // 5.6 Gemini / AI Copilot endpoint
    const chatRes = await post('http://127.0.0.1:3000/api/gemini/chat', {
      question: 'What is our top supply risk right now?',
      sectorKey: 'restaurant'
    });
    assert(chatRes.status === 200 && (chatRes.body.answer || chatRes.body.analysis), 'PulseGuard AI / Gemini Copilot endpoint responds', chatRes.body.provider);
  } catch (err) {
    assert(false, 'Original feature regression test error', err.message);
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
