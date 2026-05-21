// Barely-perceptible ambient drone, kept independent of the
// sound-effect module (audio.js): two detuned ~40 Hz sines beating at
// ~1.2 Hz with a 3 s fade-in. toggleAmbient is only ever called from a
// click on the ambient button, which is a user gesture, so the
// AudioContext can be created lazily here.

let ctx = null;
let nodes = null;

function isDisabled() {
  if ('ontouchstart' in window) return true;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  return false;
}

export function ambientActive() { return !!nodes; }

export function toggleAmbient() {
  if (nodes) { stopAmbient(); return false; }
  if (isDisabled()) return false;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  if (!ctx || ctx.state === 'closed') ctx = new AC();
  if (ctx.state === 'suspended') { try { ctx.resume(); } catch { /* ignore */ } }
  const t = ctx.currentTime;
  const mk = (f) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.00001, t);
    g.gain.linearRampToValueAtTime(0.006, t + 3.0);
    o.connect(g); g.connect(ctx.destination); o.start(t);
    return { o, g };
  };
  nodes = [mk(40), mk(41.2)];
  return true;
}

function stopAmbient() {
  if (!nodes) return;
  const t = ctx ? ctx.currentTime : 0;
  for (const n of nodes) {
    try {
      n.g.gain.cancelScheduledValues(t);
      n.g.gain.setValueAtTime(n.g.gain.value, t);
      n.g.gain.linearRampToValueAtTime(0.00001, t + 0.4);
      n.o.stop(t + 0.45);
      n.o.onended = () => { try { n.o.disconnect(); n.g.disconnect(); } catch { /* ignore */ } };
    } catch { /* ignore */ }
  }
  nodes = null;
}
