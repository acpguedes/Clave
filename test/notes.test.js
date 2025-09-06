const test = require('node:test');
const assert = require('node:assert/strict');

test('nameToMidi converts note names to MIDI numbers', async () => {
  const { nameToMidi } = await import('../src/notes.js');
  assert.strictEqual(nameToMidi('A4'), 69);
  assert.strictEqual(nameToMidi('C4'), 60);
  assert.throws(() => nameToMidi('H2'));
});

test('midiToFreq converts MIDI numbers to frequencies', async () => {
  const { midiToFreq } = await import('../src/notes.js');
  assert.strictEqual(midiToFreq(69), 440);
  const c4 = midiToFreq(60);
  assert.ok(Math.abs(c4 - 261.625565) < 1e-6);
});

test('normalizeName normalizes flats and casing', async () => {
  const { normalizeName } = await import('../src/notes.js');
  assert.strictEqual(normalizeName('Db4'), 'C#4');
  assert.strictEqual(normalizeName('Bb3'), 'A#3');
  assert.strictEqual(normalizeName('c#3'), 'C#3');
});

