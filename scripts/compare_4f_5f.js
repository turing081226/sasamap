const fs = require('fs');
const path = require('path');

const svg4Path = path.join(__dirname, '..', 'client', 'src', 'assets', '4F.svg');
const svg5Path = path.join(__dirname, '..', 'client', 'src', 'assets', '5F.svg');

const content4 = fs.readFileSync(svg4Path, 'utf8');
const content5 = fs.readFileSync(svg5Path, 'utf8');

function getIds(content) {
  const ids = [];
  const regex = /id="([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!match[1].startsWith('_')) {
      ids.push(match[1]);
    }
  }
  return ids;
}

console.log('4F IDs:', getIds(content4).join(', '));
console.log('5F IDs:', getIds(content5).join(', '));
