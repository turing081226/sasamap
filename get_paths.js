const fs = require('fs');
const content = fs.readFileSync('client/src/assets/5F.svg', 'utf8');
const pathRegex = /<(path|polygon|rect)[^>]+>/g;
let match;
while ((match = pathRegex.exec(content)) !== null) {
  const str = match[0];
  if (!str.includes('id="S4')) {
    console.log(str);
  }
}
