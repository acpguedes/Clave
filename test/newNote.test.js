const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('newNote clears chordHits before choosing a new target', () => {
  const source = fs.readFileSync('./src/app.js', 'utf8');
  const match = source.match(/function\s+newNote\(\)\{([\s\S]*?)\n\}/);
  assert.ok(match, 'newNote function not found');
  const body = match[1];
  assert.ok(/chordHits\.clear\(\)/.test(body), 'chordHits.clear() not called in newNote');
  const idxClear = body.indexOf('chordHits.clear');
  const idxCurrent = body.indexOf('current =');
  assert.ok(
    idxClear !== -1 && idxCurrent !== -1 && idxClear < idxCurrent,
    'chordHits.clear() should come before setting current'
  );
});

