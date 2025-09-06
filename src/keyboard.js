// Piano keyboard (octaves 1..4, interno/científico). Labels aplicam OCTAVE_SHIFT.
import { normalizeName, toDisplayName } from './notes.js';

export class Piano {
  constructor(container, {onPress} = {}){
    this.root = container;
    this.onPress = onPress || (()=>{});
    this.keys = {};
    this.layout();
  }

  layout(){
    this.root.innerHTML = '';
    const whites = ['C','D','E','F','G','A','B'];
    const hasSharp = { C:true, D:true, E:false, F:true, G:true, A:true, B:false };

    const startOct = 1; // interno (científico)
    let x = 0;
    for (let oct = startOct; oct <= 4; oct++){
      for (const w of whites){
        const canonical = `${w}${oct}`;              // interno
        const white = document.createElement('div');
        white.className = 'white';
        white.style.left = x + 'px';
        white.dataset.note = canonical;
        white.textContent = toDisplayName(canonical); // label visível

        // A11y
        white.setAttribute('role', 'button');
        white.setAttribute('aria-pressed', 'false');
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
          black.style.left = (x+28) + 'px';
          black.dataset.note = bn;
          black.textContent = toDisplayName(bn);

          black.setAttribute('role', 'button');
          black.setAttribute('aria-pressed', 'false');
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
        x += 44;
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
}
