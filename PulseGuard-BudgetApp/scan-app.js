const fs = require('fs');

const files = [
  'public/index.html',
  'public/styles.css',
  'public/app.js',
  'public/sample-data.js',
  'server.js'
];

let totalIssues = 0;

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`[${file}] NOT FOUND`);
    return;
  }
  const content = fs.readFileSync(file, 'utf8');
  const emDashes = (content.match(/—/g) || []).length;
  const checks = (content.match(/✓/g) || []).length;
  const bolts = (content.match(/⚡/g) || []).length;
  const emojis = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const gradients = (content.match(/linear-gradient/gi) || []).length;
  const backdrop = (content.match(/backdrop-filter/gi) || []).length;
  const shadows = (content.match(/box-shadow:\s*(?!none)[^;]+/gi) || []).length;

  console.log(`[${file}]`);
  console.log(`  emDashes: ${emDashes}`);
  console.log(`  checks: ${checks}`);
  console.log(`  bolts: ${bolts}`);
  console.log(`  emojis: ${emojis}`);
  console.log(`  gradients: ${gradients}`);
  console.log(`  backdrop: ${backdrop}`);
  console.log(`  shadows: ${shadows}`);

  totalIssues += emDashes + checks + bolts + emojis + gradients + backdrop + shadows;
});

console.log(`\nTotal Anti-pattern Issues: ${totalIssues}`);
process.exit(totalIssues > 0 ? 1 : 0);
