// Gravitational-wave chirp from a compact binary inspiral, Newtonian
// post-Newtonian leading order. Time-domain strain + spectrogram-like
// frequency track + simple orbital animation. Audio via WebAudio.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
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
function chirpMass(m1, m2) {
  m1 = Math.max(m1, 0.1); m2 = Math.max(m2, 0.1);
  return Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2);
}

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
  D_Mpc = Math.max(D_Mpc, 1);
  const f = freq(t, Mc);
  if (!isFinite(f)) return 0;
  const amp = (Mc * Msun_s) / (D_Mpc * 1.029e14) * Math.pow(Math.PI * Mc * Msun_s * f, 2 / 3);
  // Crude product phase (rough but enough for the scrolling visual).
  const phaseEstimate = 2 * Math.PI * f * t;
  const h = amp * 1e21 * Math.cos(phaseEstimate) * (1 + Math.cos(incl) ** 2) * 0.5;
  return isFinite(h) ? h : 0;
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
const T_START = -5.0;

// Orbital phase: 2 pi integral of the orbital frequency (= f_gw / 2) from
// T_START to t. Numerically integrated so deterministic captures land on a
// well-defined orbital angle. freq() is the physics of record; this only
// reads it.
function orbitalPhase(t, mc) {
  const tEnd = Math.min(t, -0.004);
  if (tEnd <= T_START) return 0;
  const N = 600;
  const dt = (tEnd - T_START) / N;
  let phi = 0;
  for (let i = 0; i < N; i += 1) {
    const tt = T_START + (i + 0.5) * dt;
    phi += Math.PI * freq(tt, mc) * dt;          // 2 pi * (f/2)
  }
  return phi;
}

// Kepler third law: a proportional to f_orb^(-2/3). Calibrated so the
// separation is wide at T_START and reaches the touching radii at merger.
function separationPx(t, mc, aMaxPx, aMinPx) {
  const fOrb = Math.max(freq(t, mc) / 2, 1e-3);
  const fOrb0 = Math.max(freq(T_START, mc) / 2, 1e-3);
  const ratio = Math.pow(fOrb0 / fOrb, 2 / 3);   // 1 at start, shrinks
  return Math.max(aMinPx, Math.min(aMaxPx, aMinPx + (aMaxPx - aMinPx) * ratio));
}

function shadedSphere(x, y, r, baseRGB, hiRGB) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, hiRGB);
  g.addColorStop(0.55, baseRGB);
  g.addColorStop(1, 'rgba(8,10,18,1)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
}

const trail1 = [], trail2 = [];
const waveRings = [];
let mergedAt = null;          // t at which coalescence happened (for ringdown)

function render() {
  ctx.fillStyle = '#06070d';
  ctx.fillRect(0, 0, W, H);

  const mc = Mc();
  const incl = state.inclinationDeg * Math.PI / 180;
  const STRIP = H * 0.16;       // compact strain + freq strips
  const FSTRIP = H * 0.14;
  const sceneTop = STRIP + FSTRIP;

  // Top strip: strain h(t). Clipped to the strip and amplitude-clamped so
  // the post-Newtonian divergence near merger cannot flood the canvas.
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('strain h(t)', 12, 16);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, STRIP); ctx.clip();
  ctx.strokeStyle = '#7c9cff'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  const t0 = state.t - 4.5, t1 = state.t + 0.5;
  const yMid = STRIP * 0.5, yAmp = STRIP * 0.42;
  for (let i = 0; i < 800; i += 1) {
    const t = t0 + (t1 - t0) * (i / 799);
    const h = strain(t, mc, state.distance, incl);
    const x = (i / 799) * W;
    const y = yMid - Math.max(-1, Math.min(1, h * 0.6)) * yAmp;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#ffd57f'; ctx.lineWidth = 1;
  const xCur = ((state.t - t0) / (t1 - t0)) * W;
  ctx.beginPath(); ctx.moveTo(xCur, 0); ctx.lineTo(xCur, STRIP); ctx.stroke();
  ctx.restore();

  // Second strip: instantaneous frequency f(t).
  ctx.fillStyle = '#9aa0a6';
  ctx.fillText('f(t) (Hz, log)', 12, STRIP + 14);
  fHistory.push({ t: state.t, f: freq(state.t, mc) });
  if (fHistory.length > 240) fHistory.shift();
  ctx.strokeStyle = '#fdb56a'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < fHistory.length; i += 1) {
    const x = (i / Math.max(fHistory.length - 1, 1)) * W;
    const y = sceneTop - 6 - Math.min(1, Math.log10(Math.max(fHistory[i].f, 5)) / 3) * (FSTRIP - 22);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(0, sceneTop); ctx.lineTo(W, sceneTop); ctx.stroke();

  // Main panel: the 3D inspiral.
  const cx = W / 2, cy = sceneTop + (H - sceneTop) / 2 + 8;
  const aMax = Math.min(W, H - sceneTop) * 0.32;
  const r1 = Math.cbrt(state.m1) * 1.6 + 4;
  const r2 = Math.cbrt(state.m2) * 1.6 + 4;
  const aMin = (r1 + r2) * 0.92;

  const f = freq(state.t, mc);
  const a = separationPx(state.t, mc, aMax, aMin);
  const phi = orbitalPhase(state.t, mc);
  const Mtot = state.m1 + state.m2;
  // Barycentric split: heavier body orbits closer to the centre of mass.
  const a1 = a * (state.m2 / Mtot);
  const a2 = a * (state.m1 / Mtot);

  // Coalescence test: separation has collapsed onto the touching radii,
  // or the chirp has run past merger (freq() saturates at t >= 0).
  const merged = (a <= aMin + 0.5) || state.t >= 0;
  if (merged && mergedAt === null) {
    mergedAt = state.t;
    waveRings.push({ r: aMin, t0: state.t, burst: true });
  }
  if (!merged) mergedAt = null;

  // Faint star field for depth.
  for (let i = 0; i < 70; i += 1) {
    const sx = ((i * 9301 + 49297) % 233280) / 233280 * W;
    const sy = sceneTop + ((i * 49297 + 233) % 233280) / 233280 * (H - sceneTop);
    ctx.fillStyle = `rgba(200,210,235,${0.05 + 0.10 * ((i % 5) / 5)})`;
    ctx.fillRect(sx, sy, 1.2, 1.2);
  }

  // Gravitational-wave wavefronts: rings shed at twice the orbital rate,
  // expanding outward and fading. A bright burst is emitted at merger.
  if (!CAPTURE_NAME) {
    if (!merged && (waveRings.length === 0 || state.t - waveRings[waveRings.length - 1].t0 > 0.06)) {
      waveRings.push({ r: a * 0.6, t0: state.t, burst: false });
    }
    for (const w of waveRings) w.r += (w.burst ? 12 : 4.5);
    while (waveRings.length && waveRings[0].r > Math.hypot(W, H)) waveRings.shift();
  } else if (waveRings.length === 0) {
    for (let k = 1; k <= 5; k += 1) waveRings.push({ r: a * 0.6 + k * 70, t0: 0, burst: false });
  }
  for (const w of waveRings) {
    const age = w.r / Math.hypot(W, H);
    ctx.strokeStyle = w.burst
      ? `rgba(180,210,255,${Math.max(0, 0.55 * (1 - age))})`
      : `rgba(124,156,255,${Math.max(0, 0.22 * (1 - age))})`;
    ctx.lineWidth = w.burst ? 2.5 : 1;
    ctx.beginPath(); ctx.ellipse(cx, cy, w.r, w.r * Math.cos(incl) * 0.55 + w.r * 0.45, 0, 0, 2 * Math.PI); ctx.stroke();
  }

  if (!merged) {
    // 3D positions: circular orbit in a plane inclined by `incl`.
    const cphi = Math.cos(phi), sphi = Math.sin(phi);
    const ci = Math.cos(incl), si = Math.sin(incl);
    const p1 = { x: cx + a1 * cphi, y: cy + a1 * sphi * ci, z: a1 * sphi * si };
    const p2 = { x: cx - a2 * cphi, y: cy - a2 * sphi * ci, z: -a2 * sphi * si };

    trail1.push({ x: p1.x, y: p1.y }); trail2.push({ x: p2.x, y: p2.y });
    if (trail1.length > 220) trail1.shift();
    if (trail2.length > 220) trail2.shift();
    if (CAPTURE_NAME) {
      // Deterministic short spiral arc behind each body for the still.
      trail1.length = 0; trail2.length = 0;
      for (let s = 60; s >= 1; s -= 1) {
        const ts = state.t - s * 0.018;
        if (ts <= T_START) continue;
        const aS = separationPx(ts, mc, aMax, aMin);
        const pS = orbitalPhase(ts, mc);
        trail1.push({ x: cx + aS * (state.m2 / Mtot) * Math.cos(pS), y: cy + aS * (state.m2 / Mtot) * Math.sin(pS) * ci });
        trail2.push({ x: cx - aS * (state.m1 / Mtot) * Math.cos(pS), y: cy - aS * (state.m1 / Mtot) * Math.sin(pS) * ci });
      }
    }

    // Decaying spiral worldlines (the curve the spheres oscillate over).
    for (const [tr, col] of [[trail1, 'rgba(124,156,255,'], [trail2, 'rgba(253,181,106,']]) {
      ctx.lineWidth = 1.4;
      for (let i = 1; i < tr.length; i += 1) {
        ctx.strokeStyle = col + (0.05 + 0.5 * (i / tr.length)) + ')';
        ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
      }
    }

    // Draw the farther body first so depth ordering reads.
    const persp = (z) => 1 + 0.0016 * z;
    const bodies = [
      { p: p1, r: r1 * persp(p1.z), base: 'rgba(70,110,210,1)', hi: 'rgba(190,215,255,1)' },
      { p: p2, r: r2 * persp(p2.z), base: 'rgba(200,120,50,1)', hi: 'rgba(255,225,170,1)' },
    ].sort((u, v) => u.p.z - v.p.z);
    for (const b of bodies) shadedSphere(b.p.x, b.p.y, b.r, b.base, b.hi);
  } else {
    // Merger: bright flash, then a single ringing remnant.
    const tau = Math.max(0, (CAPTURE_NAME ? 0.10 : state.t - (mergedAt ?? state.t)));
    const flash = Math.max(0, 1 - tau / 0.28);
    const rRem = Math.cbrt(Mtot) * 1.7 + 6;
    if (flash > 0) {
      const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rRem * 6);
      fg.addColorStop(0, `rgba(235,240,255,${0.85 * flash})`);
      fg.addColorStop(1, 'rgba(235,240,255,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(cx, cy, rRem * 6, 0, 2 * Math.PI); ctx.fill();
    }
    // Ringdown: remnant radius wobbles with a damped quasi-normal mode.
    const wob = 1 + 0.12 * Math.exp(-tau / 0.12) * Math.cos(2 * Math.PI * 12 * tau);
    shadedSphere(cx, cy, rRem * wob, 'rgba(40,40,60,1)', 'rgba(150,170,220,1)');
    // Photon-ring style bright annulus around the remnant.
    ctx.strokeStyle = `rgba(255,225,170,${0.5 + 0.4 * Math.exp(-tau / 0.2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, rRem * wob * 1.35, 0, 2 * Math.PI); ctx.stroke();
    ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
    ctx.fillText('merger + ringdown: single remnant', cx - 96, cy + rRem * 3.2);
  }

  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`3D inspiral  Mtot=${Mtot.toFixed(0)} Msun  q=${(Math.min(state.m1, state.m2) / Math.max(state.m1, state.m2)).toFixed(2)}`, 12, sceneTop + 16);

  setAudio(f, 0.06);
  readoutInv.textContent = `Mc=${mc.toFixed(2)} Msun  f=${f.toFixed(1)} Hz  t=${state.t.toFixed(2)} s  a=${a.toFixed(0)} px`;
  readoutFrame.textContent = merged ? 'merged' : `${(freq(state.t, mc) / 2).toFixed(1)} Hz orb`;
}

let raf;
function tick() {
  state.t += 1 / 60;
  if (state.t > 0.45) { state.t = T_START; fHistory.length = 0; trail1.length = 0; trail2.length = 0; waveRings.length = 0; mergedAt = null; }
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
if (DETERMINISTIC || CAPTURE_NAME) {
  // Stage the five capture frames along the inspiral: wide orbit, tighter,
  // fast plunge, just before merger, and the ringdown remnant.
  const SCHED = [T_START, -2.2, -0.7, -0.12, 0.20];
  const idx = Number.isFinite(CAPTURE_FRAC)
    ? Math.min(SCHED.length - 1, Math.round(CAPTURE_FRAC * (SCHED.length - 1)))
    : 1;
  state.t = SCHED[idx];
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  render();
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
