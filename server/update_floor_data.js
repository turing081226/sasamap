const fs = require('fs');
let floorDataContent = fs.readFileSync('../client/src/pages/floorData.js', 'utf8');

const f3 = JSON.parse(fs.readFileSync('../3f_data.json', 'utf8'));
const f4 = JSON.parse(fs.readFileSync('../4f_data.json', 'utf8'));
const f5 = JSON.parse(fs.readFileSync('../5f_data.json', 'utf8'));

const generateFloorString = (floor, rooms) => {
  return `\n  ${floor}: {
    viewBox: "0 0 500 320",
    bgImage: "/${floor}F_bg.jpg",
    rooms: ${JSON.stringify(rooms, null, 4).replace(/\n/g, '\n    ')}
  },`;
};

// Insert before the last closing brace of the floorData object
const lastBraceIndex = floorDataContent.lastIndexOf('}');
if (lastBraceIndex !== -1) {
  const newContent = 
    floorDataContent.slice(0, lastBraceIndex) +
    generateFloorString(3, f3) +
    generateFloorString(4, f4) +
    generateFloorString(5, f5) +
    '\n' + floorDataContent.slice(lastBraceIndex);
    
  fs.writeFileSync('../client/src/pages/floorData.js', newContent);
  console.log('floorData.js updated successfully!');
} else {
  console.log('Could not find closing brace in floorData.js');
}
