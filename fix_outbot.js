const fs = require('fs');
const filePath = './bots/out_bot/index.js';

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  
  // Fix the specific line
  const lines = data.split('\n');
  if (lines[263]) { // line 264 is index 263 (0-based)
    lines[263] = lines[263].replace(/async setupListeners\(\) .*/, 'async setupListeners() {');
  }
  
  fs.writeFile(filePath, lines.join('\n'), 'utf8', (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Fixed line 264!');
    }
  });
});
