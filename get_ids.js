const fs = require('fs');
const content = fs.readFileSync('client/src/assets/5F.svg', 'utf8');
const idRegex = /id=["']([^"']+)["']/g;
let match;
const ids = new Set();
while ((match = idRegex.exec(content)) !== null) {
  if (!match[1].startsWith('_')) {
    ids.add(match[1]);
  }
}
console.log('Valid IDs:', Array.from(ids));
