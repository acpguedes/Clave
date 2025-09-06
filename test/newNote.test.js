const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('./src/app.js', 'utf8');
const match = source.match(/function\s+newNote\(\)\{([\s\S]*?)\n\}/);
assert(match, 'newNote function not found');
const body = match[1];
assert(/chordHits\.clear\(\)/.test(body), 'chordHits.clear() not called in newNote');
const idxClear = body.indexOf('chordHits.clear');
const idxCurrent = body.indexOf('current =');
assert(idxClear !== -1 && idxCurrent !== -1 && idxClear < idxCurrent, 'chordHits.clear() should come before setting current');
console.log('newNote properly clears chordHits before choosing a new target');
