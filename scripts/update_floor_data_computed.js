const fs = require('fs');
const path = require('path');

const floorDataPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'floorData.js');
let floorDataContent = fs.readFileSync(floorDataPath, 'utf8');

const f3 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '3f_data_computed.json'), 'utf8'));
const f4 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '4f_data_computed.json'), 'utf8'));
const f5 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '5f_data_computed.json'), 'utf8'));

const generateFloorString = (floor, rooms) => {
  return `  ${floor}: {
    viewBox: "450 650 1150 800",
    rooms: ${JSON.stringify(rooms, null, 6).replace(/\n/g, '\n    ')}
  }`;
};

// We will find where `3:` starts in floorData.js and replace everything from there to the end.
const searchKey = '  3: {';
const index = floorDataContent.indexOf(searchKey);

if (index === -1) {
  console.error('Could not find floor 3 start in floorData.js');
  process.exit(1);
}

// Keep everything before `  3: {`
const header = floorDataContent.substring(0, index);

const newContent = `${header}${generateFloorString(3, f3)},\n${generateFloorString(4, f4)},\n${generateFloorString(5, f5)}\n};\n`;

fs.writeFileSync(floorDataPath, newContent);
console.log('Successfully updated floorData.js with computed floors 3, 4, 5!');
