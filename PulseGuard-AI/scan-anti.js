const fs = require('fs');

const files = ['public/index.html', 'public/app.js', 'public/styles.css', 'src/repository.js', 'src/server.js'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const emDashes = (content.match(/—/g) || []).length;
  const checks = (content.match(/✓/g) || []).length;
  const bolts = (content.match(/⚡/g) || []).length;
  const stars = (content.match(/[★☆]/g) || []).length;
  const emojis = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const borderLeft = (content.match(/border-left:\s*[2-9]px/gi) || []).length;
  const gradients = (content.match(/linear-gradient/gi) || []).length;
  const backdrop = (content.match(/backdrop-filter/gi) || []).length;
  const shadows = (content.match(/box-shadow:\s*(?!none)[^;]+/gi) || []).length;

  console.log(`[${file}]`);
  console.log(`  emDashes: ${emDashes}`);
  console.log(`  checks: ${checks}`);
  console.log(`  bolts: ${bolts}`);
  console.log(`  stars: ${stars}`);
  console.log(`  emojis: ${emojis}`);
  console.log(`  borderLeft stripes: ${borderLeft}`);
  console.log(`  gradients: ${gradients}`);
  console.log(`  backdrop: ${backdrop}`);
  console.log(`  shadows: ${shadows}`);
});
