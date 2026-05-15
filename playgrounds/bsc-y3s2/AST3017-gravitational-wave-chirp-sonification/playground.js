// Gravitational-wave chirp from a compact binary inspiral, Newtonian
// post-Newtonian leading order. Time-domain strain + spectrogram-like
// frequency track + simple orbital animation. Audio via WebAudio.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant');
const readoutFrame = document.getElementById('readout-frame');
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;
const state = {
  m1: 30,            // solar masses
  m2: 30,
  distance: 100,     // Mpc
  inclinationDeg: 30,
  t: -5.0,           // start 5 s before merger
  muted: true,
};

const Msun_s = 4.925490947e-6;             // GM_sun/c^3 in seconds
function chirpMass(m1, m2) { return Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2); }

function freq(t, Mc) {
  // Newtonian f(t): f^(-8/3) = (256/5) pi^(8/3) (G Mc / c^3)^(5/3) (t_c - t)
  // For convenience set t_c = 0 (merger). f diverges as t -> 0^-.
  if (t >= 0) return 1500;
  const tau = -t;
  const k = (256 / 5) * Math.pow(Math.PI, 8 / 3) * Math.pow(Mc * Msun_s, 5 / 3);
  const inv = k * tau;
  return Math.pow(inv, -3 / 8) / Math.PI;
}

function strain(t, Mc, D_Mpc, incl) {
  const f = freq(t, Mc);
  // h ~ (G Mc / c^2 D) (pi G Mc f / c^3)^(2/3)
  const amp = (Mc * Msun_s) / (D_Mpc * 1.029e14) * Math.pow(Math.PI * Mc * Msun_s * f, 2 / 3);
  // Carrier with phase that accumulates from f.
  const phaseEstimate = 2 * Math.PI * f * t; // rough; integration would be exact
  return amp * 1e21 * Math.cos(phaseEstimate) * (1 + Math.cos(incl) ** 2) * 0.5;
}

let audioCtx = null, osc = null, gain = null;
function startAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = 200; osc.start();
  } catch (e) { audioCtx = null; }
}
function setAudio(f, vol) {
  if (!audioCtx || !osc || !gain) return;
  osc.frequency.setTargetAtTime(Math.min(2000, f * 4), audioCtx.currentTime, 0.02);
  gain.gain.setTargetAtTime(state.muted ? 0 : Math.min(0.2, vol), audioCtx.currentTime, 0.05);
}

const Mc = () => chirpMass(state.m1, state.m2);
const fHistory = [];
function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  // Three panels: top strain, middle spectrogram-like freq curve, bottom orbiting binary.
  const topH = H * 0.30, midH = H * 0.28, botH = H - topH - midH;

  // Top: strain h(t) scrolled.
  ctx.fillStyle = '#dcdde2'; ctx.font = '13px sans-serif';
  ctx.fillText('strain h(t)', 12, 18);
  ctx.strokeStyle = '#7c9cff'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  const t0 = state.t - 4.5, t1 = state.t + 0.5;
  for (let i = 0; i < 800; i += 1) {
    const t = t0 + (t1 - t0) * (i / 799);
    const h = strain(t, Mc(), state.distance, state.inclinationDeg * Math.PI / 180);
    const x = (i / 799) * W;
    const y = topH * 0.5 - h * 800;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Current-time marker.
  ctx.strokeStyle = '#ffd57f';
  const xCur = ((state.t - t0) / (t1 - t0)) * W;
  ctx.beginPath(); ctx.moveTo(xCur, 0); ctx.lineTo(xCur, topH); ctx.stroke();

  // Middle: instantaneous frequency.
  ctx.fillStyle = '#dcdde2';
  ctx.fillText('f(t) (Hz)', 12, topH + 18);
  fHistory.push({ t: state.t, f: freq(state.t, Mc()) });
  if (fHistory.length > 240) fHistory.shift();
  ctx.strokeStyle = '#fdb56a'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < fHistory.length; i += 1) {
    const x = (i / Math.max(fHistory.length - 1, 1)) * W;
    const y = topH + midH - Math.min(1, Math.log10(Math.max(fHistory[i].f, 5)) / 3) * (midH - 30);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Bottom: orbiting binary.
  const cx = W / 2, cy = topH + midH + botH / 2;
  const sep = Math.max(8, 80 * Math.pow(Math.max(-state.t, 0.05) / 5, 0.5));
  const ang = 2 * Math.PI * freq(state.t, Mc()) * state.t;
  const x1 = cx + sep * Math.cos(ang);
  const y1 = cy + sep * Math.sin(ang) * Math.cos(state.inclinationDeg * Math.PI / 180);
  const x2 = cx - sep * Math.cos(ang);
  const y2 = cy - sep * Math.sin(ang) * Math.cos(state.inclinationDeg * Math.PI / 180);
  const r1 = Math.cbrt(state.m1) * 1.5;
  const r2 = Math.cbrt(state.m2) * 1.5;
  ctx.fillStyle = '#7c9cff';
  ctx.beginPath(); ctx.arc(x1, y1, r1, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#fdb56a';
  ctx.beginPath(); ctx.arc(x2, y2, r2, 0, 2 * Math.PI); ctx.fill();

  // Audio.
  const f = freq(state.t, Mc());
  setAudio(f, 0.06);

  readoutInv.textContent = `Mc=${Mc().toFixed(2)} Msun  f=${f.toFixed(1)} Hz  t=${state.t.toFixed(2)} s`;
  readoutFrame.textContent = '-';
}

let raf;
function tick() {
  state.t += 1 / 60;
  if (state.t > 0.3) { state.t = -5; fHistory.length = 0; }
  render();
  if (!CAPTURE_NAME) raf = requestAnimationFrame(tick);
}

function buildControls() {
  controlsEl.innerHTML = '';
  function slider(id, label, min, max, step, value, onInput, fmt = v => v.toFixed(0)) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
    const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
    inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value);
    inp.setAttribute('aria-label', label);
    const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(value);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); val.textContent = fmt(v); onInput(v); });
    row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
    controlsEl.appendChild(row);
  }
  slider('m1', 'm1 (Msun)', 1, 100, 1, state.m1, v => state.m1 = v);
  slider('m2', 'm2 (Msun)', 1, 100, 1, state.m2, v => state.m2 = v);
  slider('d',  'D (Mpc)', 10, 1000, 10, state.distance, v => state.distance = v);
  slider('i',  'incl (deg)', 0, 90, 5, state.inclinationDeg, v => state.inclinationDeg = v);

  const row = document.createElement('div'); row.className = 'row';
  const b = document.createElement('button'); b.type = 'button'; b.textContent = state.muted ? 'Unmute audio' : 'Mute audio';
  b.addEventListener('click', () => {
    state.muted = !state.muted;
    if (!state.muted) startAudio();
    b.textContent = state.muted ? 'Unmute audio' : 'Mute audio';
  });
  row.appendChild(b); controlsEl.appendChild(row);
}

buildControls();
render();
if (DETERMINISTIC) {
  for (let i = 0; i < 60; i += 1) { state.t += 1 / 60; render(); }
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  const Mc30 = chirpMass(30, 30);
  if (Math.abs(Mc30 - 26.1) > 0.1) return { name: 'chirp mass', pass: false, msg: `Mc(30,30) = ${Mc30}` };
  const fEarly = freq(-4, Mc30);
  const fLate  = freq(-1, Mc30);
  if (fLate <= fEarly) return { name: 'chirp monotonicity', pass: false, msg: `f(-1)=${fLate} < f(-4)=${fEarly}` };
  return { name: 'Mc and chirp monotonicity', pass: true, msg: `Mc(30,30)=${Mc30.toFixed(2)}; f(-4 s)=${fEarly.toFixed(1)} Hz f(-1 s)=${fLate.toFixed(1)} Hz` };
};
