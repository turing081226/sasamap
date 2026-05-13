const fs = require('fs');

const parseSVG = (floor) => {
  const content = fs.readFileSync('../client/src/assets/' + floor + '.svg', 'utf8');
  const rooms = [];

  const rectRegex = /<rect[^>]*id="([^"]+)"[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*width="([^"]+)"[^>]*height="([^"]+)"/g;
  let m;
  while ((m = rectRegex.exec(content)) !== null) {
    const name = m[1];
    if (name.startsWith('_')) continue; 
    rooms.push({
      id: name, name: name, type: 'rect',
      x: parseFloat(m[2]), y: parseFloat(m[3]), w: parseFloat(m[4]), h: parseFloat(m[5]),
    });
  }

  const polyRegex = /<polygon[^>]*id="([^"]+)"[^>]*points="([^"]+)"/g;
  while ((m = polyRegex.exec(content)) !== null) {
    const name = m[1];
    if (name.startsWith('_')) continue;
    rooms.push({
      id: name, name: name, type: 'polygon',
      points: m[2],
    });
  }

  const pathRegex = /<path[^>]*id="([^"]+)"[^>]*d="([^"]+)"/g;
  while ((m = pathRegex.exec(content)) !== null) {
    const name = m[1];
    if (name.startsWith('_')) continue;
    rooms.push({
      id: name, name: name, type: 'path',
      d: m[2],
    });
  }

  const bgMatch = content.match(/xlink:href="data:image\/jpeg;base64,([^"]+)"/);
  if (bgMatch && bgMatch[1]) {
    fs.writeFileSync('../client/public/' + floor + '_bg.jpg', Buffer.from(bgMatch[1], 'base64'));
    console.log(floor + ' bg extracted.');
  } else {
    console.log(floor + ' bg not found.');
  }

  fs.writeFileSync('../' + floor.toLowerCase() + '_data.json', JSON.stringify(rooms, null, 2));
  console.log(floor + ' parsed ' + rooms.length + ' rooms.');
};

['3F', '4F', '5F'].forEach(parseSVG);
