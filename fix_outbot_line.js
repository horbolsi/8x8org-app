const fs = require('fs');
const path = './bots/out_bot/index.js';

console.log('Reading file...');
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Line 264 (index 263):', lines[263]);

// Fix the specific line - handle multiple possible corruptions
if (lines[263].includes('async setupListeners()')) {
    console.log('Found setupListeners line, fixing...');
    lines[263] = 'async setupListeners() {';
    
    fs.writeFileSync(path, lines.join('\n'));
    console.log('Fixed line 264!');
    console.log('New line 264:', lines[263]);
} else {
    console.log('Line 264 does not contain setupListeners. Actual content:');
    console.log(lines[263]);
}
