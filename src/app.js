import { randomNote, randomChord, nameToFreq, normalizeName, toDisplayName, setOctaveShift } from './notes.js';
import { Staff } from './staff.js';
import { Piano } from './keyboard.js';
import { Synth } from './audio.js';
import { start as startScheduler, stop as stopScheduler } from './metronome.js';

const staffCanvas  = document.getElementById('staffCanvas');
const scoreEl      = document.getElementById('score');
const feedbackEl   = document.getElementById('feedback');
const newBtn       = document.getElementById('newBtn');
const muteBtn      = document.getElementById('muteBtn');
const levelSelect  = document.getElementById('levelSelect');
const octaveMode   = document.getElementById('octaveMode');
const keyboardRoot = document.getElementById('keyboard');
const rhythmModeEl = document.getElementById('rhythmMode');
const bpmInput     = document.getElementById('bpmInput');
const subdivSelect = document.getElementById('subdivSelect');
const beatsPerBar  = document.getElementById('beatsPerBar');
const windowInput  = document.getElementById('windowInput');
const clickChk     = document.getElementById('clickChk');
const beatLamp     = document.getElementById('beatLamp');
const subLamp      = document.getElementById('subLamp');
const qwertyOctEl  = document.getElementById('qwertyOct');
const resetChartBtn= document.getElementById('resetChartBtn');
const chartCanvas  = document.getElementById('accuracyChart');
const chartCtx     = chartCanvas.getContext('2d');

const staff  = new Staff(staffCanvas);
const piano  = new Piano(keyboardRoot, { onPress: handlePress });
const synth  = new Synth();

let score = 0;
let current = null; // alvo: string (nota) ou array de 2 notas (DUO)

// Rhythm engine state
let rhythmEnabled = false;
let bpm = 80;
let subdiv = 1;       // 1 = semínima, 2 = colcheia
let beatsBar = 4;     // 2/3/4
let windowMs = 120;
let lastMainBeatTime = 0; // timestamp ms
let beatHit = false;      // marcou ponto no último beat?

// Accuracy chart data
const accData = []; // array de offsets (ms), positivo = atraso, negativo = adiantado
const MAX_POINTS = 80;

// QWERTY mapping base octave (para Z-row)
let baseOct = 3;

// Tecla física -> nota (dinâmico com baseOct). Shift = oitava acima.
function keyToNote(e){
  const key = e.key.toLowerCase();
  const shift = e.shiftKey ? 1 : 0;
  // Z-row whites
  const mapWhites = { z:0, x:2, c:4, v:5, b:7, n:9, m:11 };
  // Z-row blacks
  const mapBlacks = { s:1, d:3, g:6, h:8, j:10 };
  let semi = null;
  if (key in mapWhites) semi = mapWhites[key];
  else if (key in mapBlacks) semi = mapBlacks[key];
  if (semi === null) return null;
  const midi = (baseOct + shift + 1)*12 + semi; // Cn midi
  // convert back to name (C..B with sharps) — keep simple mapping
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const letter = names[semi];
  const name = letter + (baseOct + shift);
  return name;
}

const pressedKeys = new Set();

function setFeedback(msg, cls=''){
  feedbackEl.className = 'feedback ' + cls;
  feedbackEl.textContent = msg;
}

function chooseTarget(){
  const val = levelSelect.value;
  const isDuo = val.startsWith('duo');
  const rangeKey = val.includes('easy') ? 'easy' : 'full';
  if (isDuo){
    return randomChord(rangeKey === 'easy' ? 'easy' : 'full');
  }
  return randomNote(rangeKey === 'easy' ? 'easy' : 'full');
}

function showTarget(){
  if (Array.isArray(current)){
    staff.drawChord(current);
    setFeedback('Alvo DUO: ' + current.map(toDisplayName).join(' + '));
  } else {
    staff.drawNote(current);
    setFeedback('Alvo: ' + toDisplayName(current));
  }
}

function newNote(){
  current = chooseTarget();
  showTarget();
}

function handleCorrect(dtMs){
  score += 1;
  scoreEl.textContent = 'Pontos: ' + score;
  if (rhythmEnabled){
    accData.push(Math.round(dtMs));
    if (accData.length > MAX_POINTS) accData.shift();
    drawChart();
    setFeedback(`✔️ No tempo! ${Math.round(dtMs)} ms`, 'ok');
  } else {
    setFeedback('✔️ Correto!', 'ok');
  }
  setTimeout(newNote, 250);
}

let chordHits = new Set();

function handlePress(noteName){
  synth.ensureRunning();
  const freq = nameToFreq(noteName);
  synth.beep(freq, 0.2);
  if (!current) return;

  if (!Array.isArray(current)){
    // nota simples
    const isRight = normalizeName(noteName) === normalizeName(current);
    if (!rhythmEnabled){
      return isRight ? handleCorrect(0) : setFeedback('❌ Errado! Era ' + toDisplayName(current), 'err');
    } else {
      const now = performance.now();
      const dt = now - lastMainBeatTime; // atraso após o último beat
      const within = Math.abs(dt) <= windowMs;
      if (isRight && within && !beatHit){
        beatHit = true;
        return handleCorrect(dt);
      } else if (isRight && !within){
        return setFeedback(`⚠️ Fora do tempo (${Math.round(dt)} ms).`, 'err');
      } else {
        return setFeedback('❌ Nota errada.', 'err');
      }
    }
  } else {
    // DUO (duas notas)
    const targetSet = new Set(current.map(normalizeName));
    const n = normalizeName(noteName);
    if (!targetSet.has(n)){
      setFeedback('❌ Uma das notas está errada. Alvo: ' + current.map(toDisplayName).join(' + '), 'err');
      return;
    }
    chordHits.add(n);
    const remaining = [...targetSet].filter(x => !chordHits.has(x));
    if (remaining.length === 0){
      chordHits.clear();
      if (!rhythmEnabled){
        return handleCorrect(0);
      } else {
        const now = performance.now();
        const dt = now - lastMainBeatTime;
        const within = Math.abs(dt) <= windowMs;
        if (within && !beatHit){
          beatHit = true;
          return handleCorrect(dt);
        } else if (!within){
          return setFeedback(`⚠️ Fora do tempo (${Math.round(dt)} ms).`, 'err');
        } else {
          // já pontuou neste beat
          return;
        }
      }
    } else {
      setFeedback('Falta: ' + remaining.map(toDisplayName).join(' + '));
    }
  }
}

// -------- Metronome with subdivisions and accents --------
function startMetronome(){
  stopMetronome();
  lastMainBeatTime = performance.now();
  beatHit = false;

  // initial beat (accented)
  showBeat(true);
  newNote();

  startScheduler({
    bpm,
    subdiv,
    beatsPerBar: beatsBar,
    onBeat: (accent)=>{
      if (!beatHit){
        setFeedback('⛔ Perdeu o beat. Nova nota!', 'err');
      }
      beatHit = false;
      lastMainBeatTime = performance.now();
      showBeat(accent);
      newNote();
    },
    onSubdivision: ()=>{
      showSubdivision();
    }
  });
}

function stopMetronome(){
  stopScheduler();
}

function showBeat(accent=false){
  beatLamp.classList.add('on');
  setTimeout(()=> beatLamp.classList.remove('on'), 120);
  if (clickChk.checked){
    synth.click(accent ? 'main' : 'beat');
  }
}

function showSubdivision(){
  subLamp.classList.add('on');
  setTimeout(()=> subLamp.classList.remove('on'), 90);
  if (clickChk.checked){
    synth.click('sub');
  }
}

// -------- Chart drawing --------
function drawChart(){
  const ctx = chartCtx;
  const W = chartCanvas.width;
  const H = chartCanvas.height;
  ctx.clearRect(0,0,W,H);
  // axes
  ctx.strokeStyle = '#e6e8ef';
  ctx.beginPath();
  ctx.moveTo(30, H/2); ctx.lineTo(W-5, H/2); // zero line
  ctx.moveTo(30, 5); ctx.lineTo(30, H-5);
  ctx.stroke();

  // labels
  ctx.fillStyle = '#616161';
  ctx.font = '12px system-ui';
  ctx.fillText('+ms', 5, 14);
  ctx.fillText('-ms', 5, H-6);

  // data
  if (accData.length === 0) return;
  const maxAbs = Math.max(60, ...accData.map(v => Math.abs(v)));
  const scaleY = (H/2 - 10) / maxAbs;
  const left = 36;
  const right = W - 8;
  const span = right - left;
  const step = accData.length > 1 ? (span / (accData.length-1)) : 0;

  // zero line is already drawn; draw points and a simple polyline
  ctx.strokeStyle = '#6b6ff7';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  accData.forEach((v,i)=>{
    const x = left + i*step;
    const y = H/2 - v*scaleY;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle = '#111';
  accData.forEach((v,i)=>{
    const x = left + i*step;
    const y = H/2 - v*scaleY;
    ctx.beginPath();
    ctx.arc(x,y,2.5,0,Math.PI*2);
    ctx.fill();
  });
}

// -------- UI events --------
newBtn.addEventListener('click', ()=>{
  if (!rhythmEnabled){
    newNote();
    setFeedback('');
  }
});
muteBtn.addEventListener('click', ()=>{
  const now = synth.muted;
  synth.setMuted(!now);
  muteBtn.textContent = now ? '🔈 Som: on' : '🔇 Som: off';
  muteBtn.setAttribute('aria-pressed', String(!now));
});
levelSelect.addEventListener('change', ()=>{
  chordHits.clear();
  if (!rhythmEnabled) newNote();
  else setFeedback('Modo ritmo ativo — nova seleção aplicada no próximo beat.');
});
octaveMode.addEventListener('change', ()=>{
  const mode = octaveMode.value; // 'sci' or 'daw'
  setOctaveShift(mode === 'daw' ? -1 : 0);
  // relabel keyboard
  piano.layout();
  // atualizar feedback da nota alvo (mantém mesma nota interna)
  if (current){
    showTarget();
  }
});

rhythmModeEl.addEventListener('change', ()=>{
  rhythmEnabled = rhythmModeEl.checked;
  if (rhythmEnabled){
    setFeedback('Modo ritmo ativo. Acerte a(s) nota(s) no beat!');
    bpm = clamp(parseInt(bpmInput.value||'80',10), 20, 240);
    subdiv = clamp(parseInt(subdivSelect.value||'1',10), 1, 4);
    beatsBar = clamp(parseInt(beatsPerBar.value||'4',10), 2, 4);
    windowMs = clamp(parseInt(windowInput.value||'120',10), 20, 500);
    startMetronome();
  } else {
    stopMetronome();
    setFeedback('Modo ritmo desativado.');
    newNote();
  }
});
bpmInput.addEventListener('change', ()=>{
  bpm = clamp(parseInt(bpmInput.value||'80',10), 20, 240);
  if (rhythmEnabled) startMetronome();
});
subdivSelect.addEventListener('change', ()=>{
  subdiv = clamp(parseInt(subdivSelect.value||'1',10), 1, 4);
  if (rhythmEnabled) startMetronome();
});
beatsPerBar.addEventListener('change', ()=>{
  beatsBar = clamp(parseInt(beatsPerBar.value||'4',10), 2, 4);
  if (rhythmEnabled) startMetronome();
});
windowInput.addEventListener('change', ()=>{
  windowMs = clamp(parseInt(windowInput.value||'120',10), 20, 500);
});

qwertyOctEl.addEventListener('change', ()=>{
  baseOct = clamp(parseInt(qwertyOctEl.value||'3',10), 1, 6);
  qwertyOctEl.value = String(baseOct);
  // hint update
  setFeedback(`QWERTY base = C${baseOct}`);
});

resetChartBtn.addEventListener('click', ()=>{
  accData.length = 0;
  drawChart();
});

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// -------- Physical keyboard handlers --------
document.addEventListener('keydown', (e)=>{
  if (e.repeat) return;
  const key = e.key.toLowerCase();

  // transpose octave with arrows
  if (key === 'arrowup'){
    baseOct = clamp(baseOct + 1, 1, 6);
    qwertyOctEl.value = String(baseOct);
    setFeedback(`QWERTY base = C${baseOct}`);
    e.preventDefault();
    return;
  }
  if (key === 'arrowdown'){
    baseOct = clamp(baseOct - 1, 1, 6);
    qwertyOctEl.value = String(baseOct);
    setFeedback(`QWERTY base = C${baseOct}`);
    e.preventDefault();
    return;
  }

  const name = keyToNote(e);
  if (!name) return;
  if (pressedKeys.has(key + (e.shiftKey?'+shift':''))) return;
  pressedKeys.add(key + (e.shiftKey?'+shift':''));
  piano.press(name);
});
document.addEventListener('keyup', (e)=>{
  const key = e.key.toLowerCase();
  const name = keyToNote(e);
  const token = key + (e.shiftKey?'+shift':'');
  if (!pressedKeys.has(token)) return;
  pressedKeys.delete(token);
  if (name) piano.release(name);
});

// init
drawChart();
newNote();
