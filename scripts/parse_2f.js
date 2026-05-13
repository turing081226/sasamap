const fs = require('fs');
const content = fs.readFileSync('C:/Users/woolr/Desktop/2F.svg', 'utf8');

const rooms = [];

// Parse rects
const rectRegex = /<rect[^>]*id="([^"]+)"[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*width="([^"]+)"[^>]*height="([^"]+)"/g;
let m;
while ((m = rectRegex.exec(content)) !== null) {
  const name = m[1];
  if (name.startsWith('_')) continue; // Skip layers
  const x = parseFloat(m[2]), y = parseFloat(m[3]), w = parseFloat(m[4]), h = parseFloat(m[5]);
  rooms.push({
    id: name,
    name: name,
    type: 'rect',
    x: x, y: y, w: w, h: h,
    cx: x + w / 2,
    cy: y + h / 2
  });
}

// Parse polygons
const polyRegex = /<polygon[^>]*id="([^"]+)"[^>]*points="([^"]+)"/g;
while ((m = polyRegex.exec(content)) !== null) {
  const name = m[1];
  if (name.startsWith('_')) continue;
  const pts = m[2].trim().split(/\s+/).map(Number);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for(let i=0; i<pts.length; i+=2) {
    if(pts[i] < minX) minX = pts[i];
    if(pts[i] > maxX) maxX = pts[i];
    if(pts[i+1] < minY) minY = pts[i+1];
    if(pts[i+1] > maxY) maxY = pts[i+1];
  }
  rooms.push({
    id: name,
    name: name,
    type: 'polygon',
    points: m[2],
    cx: minX + (maxX - minX) / 2,
    cy: minY + (maxY - minY) / 2
  });
}

// Parse paths
const pathRegex = /<path[^>]*id="([^"]+)"[^>]*d="([^"]+)"/g;
while ((m = pathRegex.exec(content)) !== null) {
  const name = m[1];
  if (name.startsWith('_')) continue;
  // A rough bounding box for path is hard, so we'll just put some default and adjust manually or use a simple heuristic
  const coords = m[2].match(/[\d\.]+/g).map(Number);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for(let i=0; i<coords.length; i+=2) {
    if(coords[i] < minX) minX = coords[i];
    if(coords[i] > maxX) maxX = coords[i];
    if(coords[i+1] < minY) minY = coords[i+1];
    if(coords[i+1] > maxY) maxY = coords[i+1];
  }
  rooms.push({
    id: name,
    name: name,
    type: 'path',
    d: m[2],
    cx: minX + (maxX - minX) / 2,
    cy: minY + (maxY - minY) / 2
  });
}

fs.writeFileSync('2f_data.json', JSON.stringify(rooms, null, 2));
console.log('Parsed ' + rooms.length + ' rooms');

