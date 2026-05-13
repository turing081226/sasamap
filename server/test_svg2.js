const fs = require('fs');
['3F', '4F', '5F'].forEach(f => {
  const c = fs.readFileSync('../client/src/assets/' + f + '.svg', 'utf8');
  const m = c.match(/<image[^>]*width="([^"]+)"[^>]*height="([^"]+)"[^>]*transform="([^"]+)"/);
  if(m) console.log(f, m[1], m[2], m[3]);
});
