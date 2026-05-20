const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'client', 'src', 'assets', '5F.svg');
if (!fs.existsSync(svgPath)) {
  console.log('5F.svg not found!');
  process.exit(1);
}

const content = fs.readFileSync(svgPath, 'utf8');

const elements = [];

// Match all tags that have an id attribute
const idRegex = /<([a-z0-9]+)[^>]*id="([^"]+)"/gi;
let match;
while ((match = idRegex.exec(content)) !== null) {
  const tag = match[1];
  const id = match[2];
  elements.push({ tag, id });
}

console.log(`Found ${elements.length} elements with IDs:`);
console.log(JSON.stringify(elements, null, 2));
