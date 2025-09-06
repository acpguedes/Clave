import { randomNote, randomChord, nameToFreq, normalizeName, toDisplayName, setOctaveShift } from './notes.js';
import { Staff } from './staff.js';
import { Piano } from './keyboard.js';
import { Synth } from './audio.js';
import { start as startScheduler, stop as stopScheduler } from './metronome.js';
import { drawChart } from './chart.js';
import { initEvents } from './events.js';

const staffCanvas  = document.getElementById('staffCanvas');
const scoreEl      = document.getElementById('score');
const feedbackEl   = document.getElementById('feedback');
const newBtn       = document.getElementById('newBtn');
const muteBtn      = document.getElementById('muteBtn');
const waveSelect   = document.getElementById('waveSelect');
const volumeSlider = document.getElementById('volumeSlider');
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
const themeToggle  = document.getElementById('themeToggle');

function applyTheme(theme){
  document.body.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

applyTheme(localStorage.getItem('theme') || 'light');
themeToggle.addEventListener('click', ()=>{
  const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

const staff  = new Staff(staffCanvas);
const piano  = new Piano(keyboardRoot, { onPress: handlePress });
const synth  = new Synth();
// Exemplo de uso de amostra (coloque arquivos em public/samples)
// synth.loadSample('samples/piano-A4.wav', 440);
if (waveSelect.value === 'sample') {
  synth.setVoice('sample');
} else {
  synth.setWave(waveSelect.value);
}
synth.setVolume(parseFloat(volumeSlider.value || '1'));

let score = 0;
let current = null; // alvo: string (nota) ou array de 2 notas (DUO)
let target = null;  // nome normalizado do alvo simples

const state = {
  rhythmEnabled: false,
  bpm: 80,
  subdiv: 1,       // 1 = semínima, 2 = colcheia
  beatsBar: 4,     // 2/3/4
  windowMs: 120,
  lastMainBeatTime: 0, // timestamp ms
  beatHit: false,      // marcou ponto no último beat?
  baseOct: 3
};

// Accuracy chart data
const accData = []; // array de offsets (ms), positivo = atraso, negativo = adiantado
const MAX_POINTS = 80;

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
  const midi = (state.baseOct + shift + 1)*12 + semi; // Cn midi
  // convert back to name (C..B with sharps) — keep simple mapping
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const letter = names[semi];
  const name = letter + (state.baseOct + shift);
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
  chordHits.clear();
  current = chooseTarget();
  target = Array.isArray(current) ? null : normalizeName(current);
  showTarget();
}

function handleCorrect(dtMs){
  score += 1;
  scoreEl.textContent = 'Pontos: ' + score;
  if (state.rhythmEnabled){
    accData.push(Math.round(dtMs));
    if (accData.length > MAX_POINTS) accData.shift();
    drawChart(chartCtx, chartCanvas, accData);
    setFeedback(`✔️ No tempo! ${Math.round(dtMs)} ms`, 'ok');
  } else {
    setFeedback('✔️ Correto!', 'ok');
  }
  setTimeout(newNote, 250);
}

let chordHits = new Set();

function handlePress(noteName){
  const pressed = normalizeName(noteName);
  synth.ensureRunning();
  const freq = nameToFreq(noteName);
  synth.beep(freq, 0.2);
  if (!current) return;

  if (!Array.isArray(current)){
    // nota simples
    const isRight = pressed === target;
    if (!state.rhythmEnabled){
      return isRight ? handleCorrect(0) : setFeedback('❌ Errado! Era ' + toDisplayName(current), 'err');
    } else {
      const now = performance.now();
      const dt = now - state.lastMainBeatTime; // atraso após o último beat
      const within = Math.abs(dt) <= state.windowMs;
      if (isRight && within && !state.beatHit){
        state.beatHit = true;
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
    if (!targetSet.has(pressed)){
      setFeedback('❌ Uma das notas está errada. Alvo: ' + current.map(toDisplayName).join(' + '), 'err');
      return;
    }
    chordHits.add(pressed);
    const remaining = [...targetSet].filter(x => !chordHits.has(x));
    if (remaining.length === 0){
      chordHits.clear();
      if (!state.rhythmEnabled){
        return handleCorrect(0);
      } else {
        const now = performance.now();
        const dt = now - state.lastMainBeatTime;
        const within = Math.abs(dt) <= state.windowMs;
        if (within && !state.beatHit){
          state.beatHit = true;
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
  state.lastMainBeatTime = performance.now();
  state.beatHit = false;

  // initial beat (accented)
  showBeat(true);
  newNote();

  startScheduler({
    bpm: state.bpm,
    subdiv: state.subdiv,
    beatsPerBar: state.beatsBar,
    onBeat: (accent)=>{
      if (!state.beatHit){
        setFeedback('⛔ Perdeu o beat. Nova nota!', 'err');
      }
      state.beatHit = false;
      state.lastMainBeatTime = performance.now();
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

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

initEvents({
  elements: {
    newBtn,
    muteBtn,
    levelSelect,
    octaveMode,
    rhythmModeEl,
    bpmInput,
    subdivSelect,
    beatsPerBar,
    windowInput,
    qwertyOctEl,
    resetChartBtn,
    waveSelect,
    volumeSlider,
    document
  },
  piano,
  synth,
  state,
  accData,
  chartCanvas,
  chartCtx,
  drawChart,
  chordHits,
  pressedKeys,
  keyToNote,
  showTarget,
  newNote,
  setFeedback,
  setOctaveShift,
  startMetronome,
  stopMetronome,
  clamp,
  getCurrent: () => current
});

// init
drawChart(chartCtx, chartCanvas, accData);
newNote();
