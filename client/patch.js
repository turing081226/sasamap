const fs = require('fs');
let code = fs.readFileSync('src/pages/FindRoom.jsx', 'utf8');

// 1. Insert clampOffset
if (!code.includes('clampOffset')) {
  code = code.replace(
    /const containerRef = useRef\(null\);\r?\n\r?\n\s*\/\/ Fetch dbRooms/,
    \const containerRef = useRef(null);

  const clampOffset = (newX, newY, currentScale) => {
    if (!containerRef.current) return { x: newX, y: newY };
    const rect = containerRef.current.getBoundingClientRect();
    const minX = rect.width * (1 - currentScale);
    const minY = rect.height * (1 - currentScale);
    return {
      x: Math.min(Math.max(newX, minX), 0),
      y: Math.min(Math.max(newY, minY), 0)
    };
  };

  // Fetch dbRooms\
  );
}

// 2. Replace onMouseMove
code = code.replace(
  /setOffset\(prev => \(\{ x: prev\.x \+ dx, y: prev\.y \+ dy \}\)\);/g,
  \setOffset(prev => clampOffset(prev.x + dx, prev.y + dy, scale));\
);

// 3. Replace handleWheel
code = code.replace(
  /setOffset\(prevOff => \(\{\s*x: cx - \(cx - prevOff\.x\) \* ratio,\s*y: cy - \(cy - prevOff\.y\) \* ratio\s*\}\)\);/g,
  \setOffset(prevOff => clampOffset(
          cx - (cx - prevOff.x) * ratio,
          cy - (cy - prevOff.y) * ratio,
          newScale
        ));\
);

// 4. Replace handleTouchMove 2 fingers actualRatio
code = code.replace(
  /setOffset\(prevOff => \(\{\s*x: cx - \(cx - prevOff\.x\) \* actualRatio,\s*y: cy - \(cy - prevOff\.y\) \* actualRatio\s*\}\)\);/g,
  \setOffset(prevOff => clampOffset(
              cx - (cx - prevOff.x) * actualRatio,
              cy - (cy - prevOff.y) * actualRatio,
              newScale
            ));\
);

fs.writeFileSync('src/pages/FindRoom.jsx', code);
console.log('Update complete');
