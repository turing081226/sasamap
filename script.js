const fs = require('fs');
const content = fs.readFileSync('client/src/assets/5F.svg', 'utf8');
const regex = /<path[^>]+id=["'](S501(-1)?)["'][^>]*d=["']([^"']+)["']/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(match[1]);
  console.log(match[3]);
}
