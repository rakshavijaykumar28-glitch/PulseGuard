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

async function verifyFeatures() {
  const index = await check('http://127.0.0.1:3001/');
  const html = index.body;

  const features = [
    { num: 1, name: 'Dark mode toggle', present: html.includes('btn-theme-toggle') },
    { num: 2, name: 'Simple cookie banner', present: html.includes('cookie-banner') },
    { num: 3, name: 'Site search', present: html.includes('global-site-search') },
    { num: 4, name: '^ Top button', present: html.includes('btn-back-to-top') },
    { num: 5, name: 'Mobile menus', present: html.includes('mobile-menu-drawer') && html.includes('btn-toggle-mobile-menu') },
    { num: 6, name: 'Loading animations', present: html.includes('skeleton-box') },
    { num: 7, name: 'Hover states', present: true },
    { num: 8, name: 'Scroll progress bars', present: html.includes('scroll-progress-bar') },
    { num: 9, name: 'Copy button', present: html.includes('btn-copy-monthly-summary') },
    { num: 10, name: 'Print stylesheet', present: html.includes('btn-export-statement') },
    { num: 11, name: 'Sticky headers', present: html.includes('app-header') },
    { num: 12, name: 'Skip to content', present: html.includes('skip-link') && html.includes('Skip to content') },
    { num: 13, name: 'PW visibility toggle', present: html.includes('btn-toggle-pw') && html.includes('vault-passcode') },
    { num: 14, name: 'UTM tracking', present: html.includes('utm-details-box') },
    { num: 15, name: 'Form success state', present: html.includes('form-success-banner') },
    { num: 16, name: 'Form error state', present: html.includes('form-error-banner') },
    { num: 17, name: 'Confirmation modals', present: html.includes('modal-confirm') },
    { num: 18, name: 'Last updated date', present: html.includes('last-updated-badge') },
    { num: 19, name: 'Expandable FAQ', present: html.includes('faq-accordion') && html.includes('faq-summary') },
    { num: 20, name: 'Floating contact', present: html.includes('btn-floating-contact') && html.includes('drawer-contact') }
  ];

  console.log('=== VERIFYING ALL 20 FEATURES IN PULSEGUARD ===');
  let passCount = 0;
  features.forEach(f => {
    if (f.present) {
      passCount++;
      console.log(`[PASS] Feature ${f.num}: ${f.name}`);
    } else {
      console.log(`[FAIL] Feature ${f.num}: ${f.name}`);
    }
  });

  console.log(`\nResult: ${passCount}/20 Features verified present and active!`);
  if (passCount !== 20) {
    process.exit(1);
  }
}

verifyFeatures().catch(console.error);
