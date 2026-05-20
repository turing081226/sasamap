const fs = require('fs');
const path = require('path');

function parsePathPoints(d) {
  const regex = /([a-df-z])|([-+]?(?:\d*\.\d+|\d+))/gi;
  let match;
  const tokens = [];
  while ((match = regex.exec(d)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'cmd', value: match[1] });
    } else if (match[2]) {
      tokens.push({ type: 'num', value: parseFloat(match[2]) });
    }
  }
  
  const points = [];
  let curX = 0;
  let curY = 0;
  let startX = 0;
  let startY = 0;
  let i = 0;
  let currentCmd = '';
  
  while (i < tokens.length) {
    if (tokens[i].type === 'cmd') {
      currentCmd = tokens[i].value;
      i++;
    }
    
    if (i >= tokens.length) break;
    
    if (currentCmd === 'M' || currentCmd === 'm') {
      const x = tokens[i].value;
      const y = tokens[i+1].value;
      if (currentCmd === 'M') {
        curX = x;
        curY = y;
      } else {
        curX += x;
        curY += y;
      }
      startX = curX;
      startY = curY;
      points.push({ x: curX, y: curY });
      i += 2;
      currentCmd = (currentCmd === 'M') ? 'L' : 'l';
    } else if (currentCmd === 'L' || currentCmd === 'l') {
      const x = tokens[i].value;
      const y = tokens[i+1].value;
      if (currentCmd === 'L') {
        curX = x;
        curY = y;
      } else {
        curX += x;
        curY += y;
      }
      points.push({ x: curX, y: curY });
      i += 2;
    } else if (currentCmd === 'H' || currentCmd === 'h') {
      const x = tokens[i].value;
      if (currentCmd === 'H') {
        curX = x;
      } else {
        curX += x;
      }
      points.push({ x: curX, y: curY });
      i += 1;
    } else if (currentCmd === 'V' || currentCmd === 'v') {
      const y = tokens[i].value;
      if (currentCmd === 'V') {
        curY = y;
      } else {
        curY += y;
      }
      points.push({ x: curX, y: curY });
      i += 1;
    } else if (currentCmd === 'C' || currentCmd === 'c') {
      const x = tokens[i+4].value;
      const y = tokens[i+5].value;
      if (currentCmd === 'C') {
        curX = x;
        curY = y;
      } else {
        curX += x;
        curY += y;
      }
      points.push({ x: curX, y: curY });
      i += 6;
    } else if (currentCmd === 'S' || currentCmd === 's') {
      const x = tokens[i+2].value;
      const y = tokens[i+3].value;
      if (currentCmd === 'S') {
        curX = x;
        curY = y;
      } else {
        curX += x;
        curY += y;
      }
      points.push({ x: curX, y: curY });
      i += 4;
    } else if (currentCmd === 'Z' || currentCmd === 'z') {
      curX = startX;
      curY = startY;
      points.push({ x: curX, y: curY });
      if (i < tokens.length && tokens[i].type !== 'cmd') {
        i++;
      }
    } else {
      i++;
    }
  }
  
  return points;
}

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
      const pts = parsePathPoints(room.d);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const pt of pts) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
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
    
    // For floor 5, map S4xx/A4xx names/ids to S5xx/A5xx with database name exception (A502A)
    if (floorNum === 5) {
      if (id.startsWith('S4')) {
        id = id.replace('S4', 'S5');
      }
      if (name.startsWith('S4')) {
        name = name.replace('S4', 'S5');
      }
      if (id.startsWith('A4')) {
        id = id.replace('A4', 'A5');
        if (id === 'A502') id = 'A502A';
        if (id === 'A502-1') id = 'A502A-1';
      }
      if (name.startsWith('A4')) {
        name = name.replace('A4', 'A5');
        if (name === 'A502') name = 'A502A';
        if (name === 'A502-1') name = 'A502A-1';
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
  fs.writeFileSync(path.join(__dirname, '..', 'data', '3f_data_computed.json'), JSON.stringify(f3, null, 2), 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', 'data', '4f_data_computed.json'), JSON.stringify(f4, null, 2), 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', 'data', '5f_data_computed.json'), JSON.stringify(f5, null, 2), 'utf8');
  console.log('Successfully computed cx, cy for floors 3, 4, 5 with floor 5 mapping updated and UTF-8 encoding!');
}
