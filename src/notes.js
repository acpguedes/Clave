export const NOTE_ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export const DEBUG = false;

//  0  = científico (C4 = dó central)
// -1  = Yamaha/DAWs comuns (C3 = dó central)
export let OCTAVE_SHIFT = 0;
export function setOctaveShift(v){ OCTAVE_SHIFT = v|0; }

// ---- Helpers de nome <-> MIDI / frequência (interno, científico) ----
export function nameToMidi(name){
  const m = name.match(/^([A-G])(#?)(\d)$/);
  if(!m) throw new Error('invalid note name: '+name);
  const letter = m[1];
  const sharp  = m[2] === '#' ? 1 : 0;
  const octave = parseInt(m[3],10);
  const semitone = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[letter] + sharp;
  return semitone + (octave+1)*12; // A4=440 -> MIDI 69
}
export function midiToFreq(midi){
  return 440 * Math.pow(2, (midi-69)/12);
}
export function nameToFreq(name){ return midiToFreq(nameToMidi(name)); }

export function normalizeName(name){
  return name
    .replace('Db','C#').replace('Eb','D#')
    .replace('Gb','F#').replace('Ab','G#').replace('Bb','A#')
    .toUpperCase();
}

// ---- Exibição (aplica deslocamento na oitava somente para mostrar texto) ----
export function toDisplayName(name, shift = OCTAVE_SHIFT){
  const n = normalizeName(name);
  const m = n.match(/^([A-G]#?)(\d)$/);
  if(!m) return n;
  const base = m[1];
  const oct  = parseInt(m[2],10);
  return `${base}${oct + shift}`;
}

// ---- Índice diatônico (para posicionar no pentagrama) ----
export function diatonicIndex(name){
  const n = normalizeName(name);
  const m = n.match(/^([A-G])#?(\d)$/);
  if(!m) throw new Error('invalid note: '+name);
  const letter = m[1];
  const octave = parseInt(m[2],10);
  const letterIndex = {C:0,D:1,E:2,F:3,G:4,A:5,B:6}[letter];
  const finalIndex = letterIndex + 7*octave;
  if (DEBUG) console.log('[diatonicIndex]', name, '->', finalIndex);
  return finalIndex;
}

// ---- Sorteio dentro do range (interno/científico) ----
export function randomNote(range='full'){
  const list = range === 'easy' ? EASY_NOTES : FULL_NOTES;
  const i = Math.floor(Math.random()*list.length);
  return list[i];
}

export function randomChord(range='full'){
  const pool = range === 'easy' ? EASY_NOTES : FULL_NOTES;
  // escolhe 2 notas diferentes
  let a = pool[Math.floor(Math.random()*pool.length)];
  let b = pool[Math.floor(Math.random()*pool.length)];
  let guard = 20;
  while (b === a && --guard > 0){
    b = pool[Math.floor(Math.random()*pool.length)];
  }
  return [a,b];
}

// FULL (interno, científico): C1..B4
export const FULL_NOTES = (() => {
  const seq = NOTE_ORDER;
  const out = [];
  for (let o = 1; o <= 4; o++) for (const n of seq) out.push(`${n}${o}`);
  return out;
})();

// EASY (interno, científico): F3..E4
export const EASY_NOTES = ['F3','G3','A3','B3','C4','D4','E4'];
