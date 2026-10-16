const fs = require('fs');
const content = fs.readFileSync('public/styles.css', 'utf8');
const matches = content.match(/box-shadow:[^;]+/gi);
console.log('Matches:', matches);
