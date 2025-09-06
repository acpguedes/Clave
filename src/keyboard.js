// Piano keyboard (octaves 1..4, interno/científico). Labels aplicam OCTAVE_SHIFT.
import { normalizeName, toDisplayName } from './notes.js';

export class Piano {
  constructor(container, {onPress, showLabels = true} = {}){
    this.root = container;
    this.onPress = onPress || (()=>{});
    this.keys = {};
    this.showLabels = showLabels;
    this.layout = this.layout.bind(this);
    this.layout();
  }

  layout(){
    this.root.innerHTML = '';
    const whites = ['C','D','E','F','G','A','B'];
    const hasSharp = { C:true, D:true, E:false, F:true, G:true, A:true, B:false };

    const startOct = 1; // interno (científico)
    const totalWhites = whites.length * (4 - startOct + 1);
    const cw = this.root.clientWidth;
    const whiteW = cw / totalWhites;
    const blackW = whiteW * 2/3;
    const whiteH = whiteW * (220/42);
    const gapTop = whiteW * (20/42);
    const blackH = whiteH * (120/220);
    this.root.style.height = (whiteH + gapTop) + 'px';

    let x = 0;
    for (let oct = startOct; oct <= 4; oct++){
      for (const w of whites){
        const canonical = `${w}${oct}`;              // interno
        const white = document.createElement('div');
        white.className = 'white';
        white.style.left = x + 'px';
        white.style.width = whiteW + 'px';
        white.style.height = whiteH + 'px';
        white.dataset.note = canonical;
        const wLabel = toDisplayName(canonical);
        white.dataset.label = wLabel;
        white.textContent = this.showLabels ? wLabel : '';

        // A11y
        white.setAttribute('role', 'button');
        white.setAttribute('aria-pressed', 'false');
        white.setAttribute('aria-label', wLabel);
        white.tabIndex = 0;

        // Pointer + Keyboard Events
        white.addEventListener('pointerdown', ()=> this.press(canonical));
        white.addEventListener('pointerup',   ()=> this.release(canonical));
        white.addEventListener('pointerleave',()=> this.release(canonical));
        white.addEventListener('pointercancel',()=> this.release(canonical));
        white.addEventListener('keydown', (e)=>{
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.press(canonical); }
        });
        white.addEventListener('keyup', (e)=>{
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.release(canonical); }
        });

        this.root.appendChild(white);
        this.keys[canonical] = white;

        if (hasSharp[w]){
          const bn = `${w}#${oct}`;
          const black = document.createElement('div');
          black.className = 'black';
          black.style.left = (x + whiteW - blackW/2) + 'px';
          black.style.width = blackW + 'px';
          black.style.height = blackH + 'px';
          black.dataset.note = bn;
          const bLabel = toDisplayName(bn);
          black.dataset.label = bLabel;
          black.textContent = this.showLabels ? bLabel : '';

          black.setAttribute('role', 'button');
          black.setAttribute('aria-pressed', 'false');
          black.setAttribute('aria-label', bLabel);
          black.tabIndex = 0;

          black.addEventListener('pointerdown', ()=> this.press(bn));
          black.addEventListener('pointerup',   ()=> this.release(bn));
          black.addEventListener('pointerleave',()=> this.release(bn));
          black.addEventListener('pointercancel',()=> this.release(bn));
          black.addEventListener('keydown', (e)=>{
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.press(bn); }
          });
          black.addEventListener('keyup', (e)=>{
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.release(bn); }
          });

          this.root.appendChild(black);
          this.keys[bn] = black;
        }
        x += whiteW;
      }
    }
  }

  press(name){
    const el = this.keys[name];
    if(!el) return;
    el.classList.add('active');
    el.setAttribute('aria-pressed', 'true');
    this.onPress(normalizeName(name)); // passa canônico para o app
  }
  release(name){
    const el = this.keys[name];
    if(!el) return;
    el.classList.remove('active');
    el.setAttribute('aria-pressed', 'false');
  }

  setShowLabels(show){
    this.showLabels = show;
    for (const el of Object.values(this.keys)){
      el.textContent = show ? el.dataset.label : '';
    }
  }
}
