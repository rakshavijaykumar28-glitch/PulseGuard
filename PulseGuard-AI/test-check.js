const fs = require('fs');
const content = fs.readFileSync('public/app.js', 'utf8');
console.log('App.js byte length:', content.length);
let openBraces = (content.match(/\{/g) || []).length;
let closeBraces = (content.match(/\}/g) || []).length;
console.log('{ count:', openBraces, '} count:', closeBraces);
let openParens = (content.match(/\(/g) || []).length;
let closeParens = (content.match(/\)/g) || []).length;
console.log('( count:', openParens, ') count:', closeParens);
