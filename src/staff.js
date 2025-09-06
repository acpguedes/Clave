// Staff rendering (Canvas) – Clave de Sol ancorada em E3..F4
// Linhas (de baixo p/ cima): E3, G3, B3, D4, F4
import { diatonicIndex, nameToMidi } from './notes.js';

export class Staff {
  constructor(canvas){
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.padding = { left: 64, right: 24, top: 32, bottom: 32 };
    this.spacing = 16; // distância entre as LINHAS do pentagrama
    this.noteHeadRx = 9;
    this.noteHeadRy = 6;

    this.topRefIdx    = diatonicIndex('F4');
    this.bottomRefIdx = diatonicIndex('E3');

    this.stemHeight = 38;
    this.stemOffset = 8;
    this.noteX = this.padding.left + 56;

    this.stemUpThresholdIdx = diatonicIndex('B3');

    // offscreen cache
    this.bg = document.createElement('canvas');
    this.bg.width = this.cv.width; this.bg.height = this.cv.height;
    this.bgctx = this.bg.getContext('2d');
    this.drawStaff(this.bgctx);
    this.ctx.drawImage(this.bg, 0, 0);
  }

  clear(){ this.ctx.clearRect(0, 0, this.cv.width, this.cv.height); }
  yTopLine(){    return this.cv.height/2 - 2*this.spacing; }
  yBottomLine(){ return this.cv.height/2 + 2*this.spacing; }

  drawStaff(ctx = this.ctx){
    const { left, right } = this.padding;
    const width = this.cv.width - left - right;
    const yTop = this.yTopLine();
    ctx.save();
    ctx.translate(0.5, 0.5);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = Math.round(yTop + i*this.spacing);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + width, y);
      ctx.stroke();
    }
    ctx.font = '32px "Noto Music", "Bravura", "FreeSerif", serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('\uD834\uDD1E', 20, Math.round(yTop + 3 * this.spacing));
    ctx.restore();
  }

  yForNote(name, idx = null){
    if (idx === null) idx = diatonicIndex(name);
    const stepsFromBottom = idx - this.bottomRefIdx;
    return this.yBottomLine() - stepsFromBottom * (this.spacing / 2);
  }

  drawLedgerLinesForIdx(idx){
    const ctx = this.ctx;
    const xCenter = this.noteX;
    const x1 = xCenter - (this.noteHeadRx + 6);
    const x2 = xCenter + (this.noteHeadRx + 6);
    const yTop = this.yTopLine();
    const yBot = this.yBottomLine();

    if (idx > this.topRefIdx){
      const linesAbove = Math.floor((idx - this.topRefIdx) / 2);
      for (let i = 1; i <= linesAbove; i++) {
        const yy = yTop - i*this.spacing;
        ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x2, yy); ctx.stroke();
      }
    } else if (idx < this.bottomRefIdx){
      const linesBelow = Math.floor((this.bottomRefIdx - idx) / 2);
      for (let i = 1; i <= linesBelow; i++) {
        const yy = yBot + i*this.spacing;
        ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x2, yy); ctx.stroke();
      }
    }
  }

  drawNoteHeadAt(x, y){
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.noteHeadRx, this.noteHeadRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawNote(name){
    this.clear();
    this.ctx.drawImage(this.bg, 0, 0);
    const idx = diatonicIndex(name);
    const y = this.yForNote(name, idx);
    const x = this.noteX;

    if (idx > this.topRefIdx || idx < this.bottomRefIdx){
      this.drawLedgerLinesForIdx(idx);
    }

    if (/#/.test(name)) {
      const ctx = this.ctx;
      ctx.font = '22px serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('#', x - (this.noteHeadRx + 18), y);
    }

    this.drawNoteHeadAt(x, y);

    const stemUp = idx <= this.stemUpThresholdIdx;
    const ctx = this.ctx;
    ctx.beginPath();
    if (stemUp) { ctx.moveTo(x + this.stemOffset, y); ctx.lineTo(x + this.stemOffset, y - this.stemHeight); }
    else        { ctx.moveTo(x - this.stemOffset, y); ctx.lineTo(x - this.stemOffset, y + this.stemHeight); }
    ctx.stroke();

    this.current = { name, midi: nameToMidi(name) };
  }

  drawChord(names){
    this.clear();
    this.ctx.drawImage(this.bg, 0, 0);
    const idxs = names.map(n => diatonicIndex(n));
    const ys = idxs.map((idx,i) => this.yForNote(names[i], idx));
    const xCenter = this.noteX;
    const xs = [xCenter - 6, xCenter + 6]; // leve deslocamento horizontal

    // ledger lines para cada nota
    idxs.forEach(idx => {
      if (idx > this.topRefIdx || idx < this.bottomRefIdx) this.drawLedgerLinesForIdx(idx);
    });

    // acidentais simples
    names.forEach((n,i)=>{
      if (/#/.test(n)) {
        const ctx = this.ctx;
        ctx.font = '22px serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('#', xs[i] - (this.noteHeadRx + 18), ys[i]);
      }
    });

    // cabeças
    this.drawNoteHeadAt(xs[0], ys[0]);
    this.drawNoteHeadAt(xs[1], ys[1]);

    // haste comum baseada na média
    const avgIdx = Math.round((idxs[0] + idxs[1]) / 2);
    const stemUp = avgIdx <= this.stemUpThresholdIdx;
    const ctx = this.ctx;
    ctx.beginPath();
    if (stemUp) {
      // haste à direita da cabeça mais à direita, do y mediano
      const x = Math.max(xs[0], xs[1]) + this.stemOffset - 6;
      const y = Math.min(ys[0], ys[1]); // parte superior das cabeças
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - this.stemHeight);
    } else {
      const x = Math.min(xs[0], xs[1]) - this.stemOffset + 6;
      const y = Math.max(ys[0], ys[1]); // parte inferior das cabeças
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + this.stemHeight);
    }
    ctx.stroke();
  }
}
