const { floorData } = require('./src/pages/floorData.js');
let hasWeird = false;
for (let f in floorData) {
  const rooms = floorData[f].rooms;
  const weird = rooms.filter(r => !r.name || r.name.trim() === '');
  if (weird.length > 0) {
    console.log('Floor', f, 'weird rooms:', weird);
    hasWeird = true;
  }
}
if (!hasWeird) console.log('No unnamed rooms found in floorData.js');
