export function initEvents(ctx) {
  const {
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
    getCurrent
  } = ctx;

  newBtn.addEventListener('click', () => {
    if (!state.rhythmEnabled) {
      newNote();
      setFeedback('');
    }
  });

  muteBtn.addEventListener('click', () => {
    const now = synth.muted;
    synth.setMuted(!now);
    muteBtn.textContent = now ? '🔈 Som: on' : '🔇 Som: off';
    muteBtn.setAttribute('aria-pressed', String(!now));
  });

  waveSelect.addEventListener('change', () => {
    synth.setWave(waveSelect.value);
  });

  volumeSlider.addEventListener('input', () => {
    synth.setVolume(parseFloat(volumeSlider.value || '1'));
  });

  levelSelect.addEventListener('change', () => {
    chordHits.clear();
    if (!state.rhythmEnabled) newNote();
    else setFeedback('Modo ritmo ativo — nova seleção aplicada no próximo beat.');
  });

  octaveMode.addEventListener('change', () => {
    const mode = octaveMode.value; // 'sci' or 'daw'
    setOctaveShift(mode === 'daw' ? -1 : 0);
    piano.layout();
    if (getCurrent()) {
      showTarget();
    }
  });

  rhythmModeEl.addEventListener('change', () => {
    state.rhythmEnabled = rhythmModeEl.checked;
    if (state.rhythmEnabled) {
      setFeedback('Modo ritmo ativo. Acerte a(s) nota(s) no beat!');
      state.bpm = clamp(parseInt(bpmInput.value || '80', 10), 20, 240);
      state.subdiv = clamp(parseInt(subdivSelect.value || '1', 10), 1, 4);
      state.beatsBar = clamp(parseInt(beatsPerBar.value || '4', 10), 2, 4);
      state.windowMs = clamp(parseInt(windowInput.value || '120', 10), 20, 500);
      startMetronome();
    } else {
      stopMetronome();
      setFeedback('Modo ritmo desativado.');
      newNote();
    }
  });

  bpmInput.addEventListener('change', () => {
    state.bpm = clamp(parseInt(bpmInput.value || '80', 10), 20, 240);
    if (state.rhythmEnabled) startMetronome();
  });

  subdivSelect.addEventListener('change', () => {
    state.subdiv = clamp(parseInt(subdivSelect.value || '1', 10), 1, 4);
    if (state.rhythmEnabled) startMetronome();
  });

  beatsPerBar.addEventListener('change', () => {
    state.beatsBar = clamp(parseInt(beatsPerBar.value || '4', 10), 2, 4);
    if (state.rhythmEnabled) startMetronome();
  });

  windowInput.addEventListener('change', () => {
    state.windowMs = clamp(parseInt(windowInput.value || '120', 10), 20, 500);
  });

  qwertyOctEl.addEventListener('change', () => {
    state.baseOct = clamp(parseInt(qwertyOctEl.value || '3', 10), 1, 6);
    qwertyOctEl.value = String(state.baseOct);
    setFeedback(`QWERTY base = C${state.baseOct}`);
  });

  resetChartBtn.addEventListener('click', () => {
    accData.length = 0;
    drawChart(chartCtx, chartCanvas, accData);
  });

  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();

    if (key === 'arrowup') {
      state.baseOct = clamp(state.baseOct + 1, 1, 6);
      qwertyOctEl.value = String(state.baseOct);
      setFeedback(`QWERTY base = C${state.baseOct}`);
      e.preventDefault();
      return;
    }
    if (key === 'arrowdown') {
      state.baseOct = clamp(state.baseOct - 1, 1, 6);
      qwertyOctEl.value = String(state.baseOct);
      setFeedback(`QWERTY base = C${state.baseOct}`);
      e.preventDefault();
      return;
    }

    const name = keyToNote(e);
    if (!name) return;
    const token = key + (e.shiftKey ? '+shift' : '');
    if (pressedKeys.has(token)) return;
    pressedKeys.add(token);
    piano.press(name);
  });

  document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    const name = keyToNote(e);
    const token = key + (e.shiftKey ? '+shift' : '');
    if (!pressedKeys.has(token)) return;
    pressedKeys.delete(token);
    if (name) piano.release(name);
  });
}
