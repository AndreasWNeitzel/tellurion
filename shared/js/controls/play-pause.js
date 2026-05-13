// play-pause.js
// Play/pause toggle plus a step-once button. Emits CustomEvent('change',
// { detail: { state: 'playing' | 'paused' } }) on toggle and
// CustomEvent('step') on step. Space toggles play/pause; Period steps.

export function mountPlayPause(container, { initiallyPlaying = false } = {}) {
  let playing = !!initiallyPlaying;

  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.textContent = playing ? 'Pause' : 'Play';
  playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  playBtn.setAttribute('aria-label', 'Play or pause (Space)');
  playBtn.classList.add('play-pause');
  container.appendChild(playBtn);

  const stepBtn = document.createElement('button');
  stepBtn.type = 'button';
  stepBtn.textContent = 'Step';
  stepBtn.setAttribute('aria-label', 'Step once (.)');
  stepBtn.classList.add('step-once');
  container.appendChild(stepBtn);

  function emitChange() {
    container.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      detail: { state: playing ? 'playing' : 'paused' },
    }));
  }
  function emitStep() {
    container.dispatchEvent(new CustomEvent('step', { bubbles: true, detail: {} }));
  }

  function toggle() {
    playing = !playing;
    playBtn.textContent = playing ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    emitChange();
  }

  playBtn.addEventListener('click', toggle);
  stepBtn.addEventListener('click', emitStep);

  function onKey(e) {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); toggle(); return; }
    if (e.key === '.')                        { e.preventDefault(); emitStep(); }
  }
  window.addEventListener('keydown', onKey);

  return {
    el: { play: playBtn, step: stepBtn },
    isPlaying: () => playing,
    setPlaying(v) {
      if (v === playing) return;
      toggle();
    },
    destroy() {
      window.removeEventListener('keydown', onKey);
      playBtn.remove();
      stepBtn.remove();
    },
  };
}
