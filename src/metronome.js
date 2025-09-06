const AC = window.AudioContext || window.webkitAudioContext;
let ctx = null;

const lookahead = 25; // ms
const scheduleAheadTime = 0.1; // s

let timerID = null;
let timeouts = [];

let nextNoteTime = 0; // seconds
let secondsPerSubdivision = 0;
let subdivisions = 1;
let beatsPerBar = 4;
let beatIndex = 0;
let subIndex = 0;

let onBeat = null;
let onSubdivision = null;

function ensureContext(){
  if (!ctx){
    ctx = new AC();
  }
}

function schedule(){
  while (nextNoteTime < ctx.currentTime + scheduleAheadTime){
    subIndex = (subIndex + 1) % subdivisions;
    const eventTime = nextNoteTime;
    const delay = Math.max(0, (eventTime - ctx.currentTime) * 1000);
    if (subIndex === 0){
      const accent = (beatIndex === 0);
      const id = setTimeout(()=> onBeat && onBeat(accent), delay);
      timeouts.push(id);
      beatIndex = (beatIndex + 1) % beatsPerBar;
    } else {
      const id = setTimeout(()=> onSubdivision && onSubdivision(), delay);
      timeouts.push(id);
    }
    nextNoteTime += secondsPerSubdivision;
  }
}

export function start(opts){
  const { bpm, subdiv=1, beatsPerBar: bpb=4, onBeat: beatCb, onSubdivision: subCb } = opts;
  stop();
  ensureContext();
  onBeat = beatCb;
  onSubdivision = subCb;
  subdivisions = subdiv;
  beatsPerBar = bpb;
  secondsPerSubdivision = 60 / bpm / subdivisions;
  // first beat already handled outside; start scheduling from next subdivision
  nextNoteTime = ctx.currentTime + secondsPerSubdivision;
  beatIndex = 1 % beatsPerBar;
  subIndex = 0;
  schedule();
  timerID = setInterval(schedule, lookahead);
}

export function stop(){
  if (timerID){
    clearInterval(timerID);
    timerID = null;
  }
  timeouts.forEach(id => clearTimeout(id));
  timeouts = [];
}
