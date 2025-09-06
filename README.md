# Sheet Music Trainer (Web)

An educational web/mobile-friendly game to practice **sight‑reading**. Notes are drawn on a treble staff; your goal is to **hit the correct key** on a two‑octave virtual keyboard (or your **computer keyboard**) **on time**. The game starts simple and gradually adds rhythmic figures, accidentals, ledger lines, and varied meters—turning daily practice into a lightweight game loop.

> Zero dependencies. Pure HTML/CSS/JavaScript (ES modules).

---

## ✨ Features

- **Staff rendering (treble clef)** with ledger lines, accidentals and correct stem rules. Crisp lines via half‑pixel alignment and an **offscreen canvas cache** for performance.
- **Two gameplay modes**:
  - **Free**: hit the note shown.
  - **Rhythm/Metronome**: configurable **BPM**, **subdivision** (quarter ♩ / eighth ♪), **time signature** (2/4, 3/4, 4/4), accented **downbeat**, optional **click**, and a **timing window (ms)** for scoring on the beat.
- **Duo (two‑note) target levels**: play two notes on the same beat; order is free—score when both are correct (within the timing window in Rhythm mode).
- **Scoring + real‑time accuracy chart**: shows your timing offsets (ms) over the last 80 hits.
- **Virtual piano**: 4 octaves (**C1–B4**), works on desktop and mobile (Pointer Events).
- **Physical keyboard support (QWERTY)**:  
  - White keys on the **Z‑row** (`Z X C V B N M`) for the base octave (default: **C3–B3**).  
  - Black keys on **`S D G H J`**.  
  - **Shift** plays the **next octave** (quick two‑octave reach).  
  - **Arrow Up/Down** transposes the base octave; you can also set it in the UI.
- **Octave label toggle**: switch labels between **Scientific (C4 = middle C)** and **DAW/Yamaha (C3 = middle C)** without altering the internal pitch logic.
- **A11y**: ARIA live regions for feedback/score, focusable keys with `role=button`, `aria-pressed`, and keyboard activation (Enter/Space).

---

## 🚀 Quick Start

Clone and serve the folder **as a static site** (ES modules generally won’t run from `file://`).

```bash
git clone <your-fork-or-repo-url>.git
cd game-partitura

# Option A: Python 3
python3 -m http.server 8080

# Option B: Node (http-server)
npx http-server -p 8080 .

# Option C: Node (serve)
npx serve -l 8080 .
```

Then open:
```
http://localhost:8080/public/
```

> On first interaction, the browser may require a **user gesture** to start Web Audio. Click anywhere (or press a key) if sound is muted by the browser.

---

## 📂 Project Structure

```
game-partitura/
├── public/
│   └── index.html
└── src/
    ├── app.js          # Game loop, UI wiring, rhythm engine & chart
    ├── audio.js        # Web Audio synth + metronome clicks
    ├── keyboard.js     # Virtual piano (4 octaves), mobile-friendly
    ├── notes.js        # Theory helpers, random note/chord, naming
    ├── staff.js        # Canvas staff drawing (offscreen cache)
    └── styles.css      # UI styles
```

---

## 🎮 How to Play

- **New**: draws a new target (note or duo).
- **Level**: choose **Easy** (F3–E4), **Full** (C1–B4) or their **DUO** counterparts.
- **Octave (labels)**: switch label standard (**Scientific** vs **DAW**). Pitches don’t change—only displayed octaves.
- **Rhythm Mode**: enable to score **on beat**.
  - **BPM**: tempo in beats per minute.
  - **Subdivision**: **♩** (quarter) or **♪** (eighth) pulses. Sub‑lamp flashes on subdivisions.
  - **Time Signature**: 2/4, 3/4, 4/4 (accent on the **downbeat**).
  - **Window (ms)**: timing tolerance to count a hit as “on time”.
  - **Click**: on/off for metronome audio.
- **QWERTY Base Octave**: set the base octave for the Z‑row; **↑/↓** transpose on the fly.
- **Chart**: shows your last 80 timing offsets (ms). “Reset chart” clears history.

### QWERTY Map (default base = C3)
- **Whites (Z‑row):** `Z X C V B N M` → C D E F G A B  
- **Blacks:** `S D G H J` → C# D# F# G# A#  
- **Shift**: plays **one octave above** the base row.

> All virtual keys and QWERTY‑mapped notes produce sound via Web Audio (sine beep).

---

## 🛠️ Implementation Notes

- **Staff math**: positions are computed with a **diatonic index** (7‑step scale index per octave). Each diatonic step = **spacing/2** vertically. Anchors: **E3..F4** (treble 8vb layout). Ledger lines are counted by integer steps outside those bounds.
- **Performance**: staff background (5 lines + clef) is drawn once to an **offscreen canvas** and blitted every frame; staff lines use half‑pixel alignment for crisp rendering.
- **Metronome**: a simple JS interval drives beats and **subdivisions**. Downbeat gets a stronger click; subdivisions get a softer click. Timing is measured against the **last main beat** with a configurable **±window**.\n- **Duo targets**: two noteheads are rendered with a shared stem; you can play notes in any order—scoring happens when **both** are correct (and within the timing window when Rhythm mode is on).

---

## 🧩 Customization

- Add more subdivisions (e.g., **triplets**) and compound meters (e.g., **6/8**) in `app.js` where the metronome loop is defined.
- Swap the **sine beep** for a sampled piano or SoundFont in `audio.js`.
- Change the **visual theme** in `styles.css` (CSS variables at the top).
- Extend ranges or add **bass clef** by adjusting anchors and level pools in `staff.js` / `notes.js`.

---

## 🔧 Browser Support

Recent versions of Chrome, Edge, and Firefox. iOS Safari works but may require an explicit tap to unlock audio. Ensure you serve over **http://** (localhost) rather than opening files directly.

---

## 🗺️ Roadmap

- 6/8 compound meter + triplets
- Per‑note accuracy heatmap on the keyboard
- Persistent stats (localStorage) + per‑session reports
- Alternate instrument voices (square/triangle, simple envelope) and basic mixer
- Optional flats (♭) display mode and key signature support
- Additional clefs (bass, alto) and transposition instruments

---

## 🤝 Contributing

PRs welcome! Please keep the code dependency‑free and easy to run. Suggestions and bug reports via Issues are appreciated.

---

## 📄 License

MIT. See `LICENSE` (or change to any license you prefer for your repo).
