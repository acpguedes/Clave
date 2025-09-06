// Web Audio synth + clicks de metrônomo
export class Synth {
  constructor(){
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.muted = false;
  }
  async ensureRunning(){
    if(this.ctx.state !== 'running'){
      try{ await this.ctx.resume(); }catch{}
    }
  }
  setMuted(m){ this.muted = !!m; }
  async beep(freq=440, dur=0.08, gain=0.25){
    await this.ensureRunning();
    if(this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.linearRampToValueAtTime(0.0001, now + dur);
    o.start(now);
    o.stop(now + dur + 0.01);
    o.onended = () => { try{o.disconnect();}catch{} try{g.disconnect();}catch{} };
  }
  async click(kind='main'){
    // 'main' (beat 1 acentuado), 'beat' (outros), 'sub' (subdivisão)
    if (this.muted) return;
    const freq = kind === 'main' ? 1000 : (kind === 'beat' ? 800 : 500);
    const gain = kind === 'sub' ? 0.18 : 0.26;
    return this.beep(freq, 0.05, gain);
  }
}
