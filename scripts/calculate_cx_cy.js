const fs = require('fs');
const path = require('path');

function processFloor(floorNum) {
  const filePath = path.join(__dirname, '..', 'data', `${floorNum}f_data.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const processedRooms = [];
  
  let overallMinX = Infinity, overallMaxX = -Infinity, overallMinY = Infinity, overallMaxY = -Infinity;

  for (const room of rawData) {
    let cx = 0;
    let cy = 0;
    
    if (room.type === 'rect') {
      const x = parseFloat(room.x);
      const y = parseFloat(room.y);
      const w = parseFloat(room.w);
      const h = parseFloat(room.h);
      cx = x + w / 2;
      cy = y + h / 2;
      
      if (x < overallMinX) overallMinX = x;
      if (x + w > overallMaxX) overallMaxX = x + w;
      if (y < overallMinY) overallMinY = y;
      if (y + h > overallMaxY) overallMaxY = y + h;
      
    } else if (room.type === 'polygon') {
      const pts = room.points.trim().split(/\s+/).map(Number);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < pts.length; i += 2) {
        if (pts[i] < minX) minX = pts[i];
        if (pts[i] > maxX) maxX = pts[i];
        if (pts[i + 1] < minY) minY = pts[i + 1];
        if (pts[i + 1] > maxY) maxY = pts[i + 1];
      }
      cx = minX + (maxX - minX) / 2;
      cy = minY + (maxY - minY) / 2;
      
      if (minX < overallMinX) overallMinX = minX;
      if (maxX > overallMaxX) overallMaxX = maxX;
      if (minY < overallMinY) overallMinY = minY;
      if (maxY > overallMaxY) overallMaxY = maxY;
      
    } else if (room.type === 'path') {
      const coords = room.d.match(/[\d\.]+/g).map(Number);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < coords.length; i += 2) {
        if (!isNaN(coords[i])) {
          if (coords[i] < minX) minX = coords[i];
          if (coords[i] > maxX) maxX = coords[i];
        }
        if (i + 1 < coords.length && !isNaN(coords[i + 1])) {
          if (coords[i + 1] < minY) minY = coords[i + 1];
          if (coords[i + 1] > maxY) maxY = coords[i + 1];
        }
      }
      cx = minX + (maxX - minX) / 2;
      cy = minY + (maxY - minY) / 2;
      
      if (minX < overallMinX) overallMinX = minX;
      if (maxX > overallMaxX) overallMaxX = maxX;
      if (minY < overallMinY) overallMinY = minY;
      if (maxY > overallMaxY) overallMaxY = maxY;
    }
    
    // Clean coordinates to 2 decimal places to keep it neat
    cx = Math.round(cx * 100) / 100;
    cy = Math.round(cy * 100) / 100;
    
    let id = room.id;
    let name = room.name;
    
    // For floor 5, map S4xx names/ids to S5xx
    if (floorNum === 5) {
      if (id.startsWith('S4')) {
        id = id.replace('S4', 'S5');
      }
      if (name.startsWith('S4')) {
        name = name.replace('S4', 'S5');
      }
    }
    
    processedRooms.push({
      ...room,
      id,
      name,
      cx,
      cy,
      status: 'EMPTY',
      current: '공강'
    });
  }
  
  console.log(`Floor ${floorNum} Bounding Box: minX=${overallMinX}, maxX=${overallMaxX}, minY=${overallMinY}, maxY=${overallMaxY}`);
  return processedRooms;
}

const f3 = processFloor(3);
const f4 = processFloor(4);
const f5 = processFloor(5);

if (f3 && f4 && f5) {
  fs.writeFileSync(path.join(__dirname, '..', 'data', '3f_data_computed.json'), JSON.stringify(f3, null, 2));
  fs.writeFileSync(path.join(__dirname, '..', 'data', '4f_data_computed.json'), JSON.stringify(f4, null, 2));
  fs.writeFileSync(path.join(__dirname, '..', 'data', '5f_data_computed.json'), JSON.stringify(f5, null, 2));
  console.log('Successfully computed cx, cy for floors 3, 4, 5 with floor 5 renamed to S5xx!');
}
