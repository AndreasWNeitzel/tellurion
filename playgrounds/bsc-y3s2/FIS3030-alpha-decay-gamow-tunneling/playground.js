// Gamow alpha decay made physical: an alpha wavefunction oscillates in the
// nuclear well, decays exponentially through the Coulomb barrier (WKB
// suppression set by the Gamow exponent), and a small transmitted wave
// streams away. A nuclear scene emits alphas at a cadence set by the
// Geiger-Nuttall half-life. sim.js (geigerNuttallLogT, gamowExponent) is
// unchanged; it drives the suppression and the emission rate.

import { geigerNuttallLogT, gamowExponent } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas = document.getElementById('stage');
const ctx    = canvas.getContext('2d', { alpha: false });
const rT     = document.getElementById('readout-t');
const sZ     = document.getElementById('slider-Z'), vZ = document.getElementById('value-Z');
const sQ     = document.getElementById('slider-Q'), vQ = document.getElementById('value-Q');
const btnR   = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const W = canvas.width, H = canvas.height;
const rng = makeRng(SEED);

const st = { Z: 90, Q: 4.5 };
let running = !prefersReducedMotion();
let clock = 0;
let emitClock = 0;
let emitted = 0;
const alphas = [];

const R_NUC = 7;            // fm, nuclear radius
const V0    = -30;          // MeV, well depth
const RMAX  = 34;           // fm
const VMAX  = 30;           // MeV

function barrierV(r, Z) {
  if (r < R_NUC) return V0;
  return Math.min(VMAX * 0.95, 1.44 * (Z + 2) / r);
}
function outerTurning(Z, Q) { return Math.min(RMAX, 1.44 * (Z + 2) / Q); }

sZ.addEventListener('input', () => { st.Z = parseInt(sZ.value, 10); vZ.textContent = String(st.Z); });
sQ.addEventListener('input', () => { st.Q = parseFloat(sQ.value); vQ.textContent = st.Q.toFixed(2); });
btnR.addEventListener('click', () => { running = true; emitted = 0; alphas.length = 0; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Watchable emission period from the Geiger-Nuttall half-life. The real
// dynamic range spans ~30 decades; we compress it to a wide but finite
// visible band so short-lived (large Q) clearly streams alphas while
// long-lived (small Q) almost never emits.
function emissionPeriod() {
  const logT = geigerNuttallLogT(st.Z, st.Q);
  return Math.max(0.18, Math.min(40, 0.18 * Math.pow(10, (logT + 2) / 14)));
}

function drawBarrier(c) {
  const pad = { l: 56, r: 16, t: 26, b: 30 };
  const x0 = pad.l, x1 = W * 0.62, y0 = pad.t, y1 = H * 0.70 - pad.b;
  const xToPx = (r) => x0 + (r / RMAX) * (x1 - x0);
  const yToPx = (v) => y1 - ((v - V0) / (VMAX - V0)) * (y1 - y0);

  ctx.strokeStyle = c.muted; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('V(r) (MeV)', 10, y0 + 8);
  ctx.fillText('r (fm)', x1 - 36, y1 + 16);

  // Coulomb barrier + nuclear well.
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const r = RMAX * i / 240;
    const px = xToPx(r), py = yToPx(barrierV(r, st.Z));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Q energy level.
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, yToPx(st.Q)); ctx.lineTo(x1, yToPx(st.Q)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb';
  ctx.fillText(`Q = ${st.Q.toFixed(2)} MeV`, x1 - 110, yToPx(st.Q) - 4);

  // Alpha wavefunction: standing wave in the well, WKB-decaying through the
  // barrier (total suppression = exp(-G), G the Gamow exponent), small
  // travelling transmitted wave outside.
  const rOut = outerTurning(st.Z, st.Q);
  const G = gamowExponent(st.Z, st.Q);
  const ampOut = Math.exp(-0.5 * Math.min(40, G));      // transmitted amplitude
  const A0 = (y1 - y0) * 0.16;                            // inside amplitude (px)
  const kin = 0.9 + 0.16 * Math.sqrt(Math.max(0.1, st.Q - V0));
  const kout = 0.7 + 0.12 * Math.sqrt(Math.max(0.1, st.Q));
  const baseY = yToPx(st.Q);

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(124,196,255,0.95)';
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 360; i += 1) {
    const r = RMAX * i / 360;
    let psi;
    if (r < R_NUC) {
      psi = A0 * Math.sin(kin * r) * Math.cos(clock * 2.2);
    } else if (r < rOut) {
      const frac = (r - R_NUC) / Math.max(0.5, rOut - R_NUC);
      const env = A0 * Math.pow(ampOut, frac);            // exp decay to ampOut*A0
      psi = env * Math.sin(kin * R_NUC) * Math.cos(clock * 2.2);
    } else {
      const env = A0 * ampOut;
      psi = env * Math.sin(kout * (r - rOut) - clock * 3.4);
    }
    const px = xToPx(r), py = baseY - psi;
    if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Mark the classically forbidden region.
  ctx.fillStyle = 'rgba(239,71,111,0.10)';
  ctx.fillRect(xToPx(R_NUC), y0, xToPx(rOut) - xToPx(R_NUC), y1 - y0);
  ctx.fillStyle = 'rgba(239,71,111,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('tunneling region', xToPx(R_NUC) + 6, y0 + 14);
  ctx.fillStyle = c.muted; ctx.textAlign = 'left';
  ctx.fillText('α wavefunction tunnels the Coulomb barrier', 12, 16);
}

function drawNuclearScene(c) {
  const x0 = W * 0.66, y0 = 26, x1 = W - 14, y1 = H * 0.70 - 26;
  ctx.fillStyle = '#08070c'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);

  const nx = x0 + 46, ny = (y0 + y1) / 2;

  // Emit alphas on the Geiger-Nuttall cadence.
  if ((running || CAPTURE_NAME) && emitClock <= 0) {
    const ang = (rng() - 0.5) * 1.5;
    alphas.push({ x: nx, y: ny, vx: 70 + 30 * rng(), vy: 90 * Math.sin(ang), life: 0 });
    emitted += 1;
    emitClock = emissionPeriod();
  }
  for (let k = alphas.length - 1; k >= 0; k -= 1) {
    const a = alphas[k];
    a.x += a.vx * 0.016 * 4; a.y += a.vy * 0.016 * 4; a.life += 0.016;
    if (a.x > x1 - 6 || a.y < y0 + 4 || a.y > y1 - 4) alphas.splice(k, 1);
  }

  // Daughter nucleus: a cluster of nucleons.
  for (let i = 0; i < 26; i += 1) {
    const aa = (i / 26) * 2 * Math.PI, rr = 10 + 7 * ((i * 7) % 5) / 5;
    ctx.fillStyle = i % 2 ? '#7c9cff' : '#ff9b6a';
    ctx.beginPath(); ctx.arc(nx + rr * Math.cos(aa), ny + rr * Math.sin(aa) * 0.8, 3.2, 0, 2 * Math.PI); ctx.fill();
  }
  const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, 26);
  glow.addColorStop(0, 'rgba(255,210,140,0.30)'); glow.addColorStop(1, 'rgba(255,210,140,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(nx, ny, 26, 0, 2 * Math.PI); ctx.fill();

  // Emitted alpha particles (2p + 2n) with trails.
  for (const a of alphas) {
    ctx.strokeStyle = 'rgba(6,214,160,0.35)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(a.x - a.vx * 0.05, a.y - a.vy * 0.05); ctx.lineTo(a.x, a.y); ctx.stroke();
    for (const [dx, dy, col] of [[-3, -3, '#7cf'], [3, -3, '#fb6'], [-3, 3, '#fb6'], [3, 3, '#7cf']]) {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(a.x + dx, a.y + dy, 2.4, 0, 2 * Math.PI); ctx.fill();
    }
  }

  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('daughter + emitted alphas', x0 + 8, y0 + 14);
  ctx.fillText(`emitted: ${emitted}`, x0 + 8, y1 - 8);
}

function drawGeigerNuttall(c) {
  const top = H * 0.70;
  ctx.fillStyle = c.bg; ctx.fillRect(0, top, W, H - top);
  const pad = { l: 72, r: 20, t: 18, b: 50 };
  const x0 = pad.l, x1 = W - pad.r, y0 = top + pad.t, y1 = H - pad.b;
  const QLO = 1, QHI = 12;

  // Autoscale the log-half-life axis over the swept Q range, with a margin.
  let lmin = Infinity, lmax = -Infinity;
  const Qm = (Q) => 1 / Math.sqrt(Q);
  for (let i = 0; i <= 60; i += 1) {
    const l = geigerNuttallLogT(st.Z, QLO + (QHI - QLO) * i / 60);
    if (l < lmin) lmin = l; if (l > lmax) lmax = l;
  }
  const lspan = lmax - lmin || 1; lmin -= 0.06 * lspan; lmax += 0.06 * lspan;
  const xFor = (Q) => x0 + (Qm(Q) - Qm(QHI)) / (Qm(QLO) - Qm(QHI)) * (x1 - x0);
  const yFor = (l) => y1 - (l - lmin) / (lmax - lmin) * (y1 - y0);

  // Axes.
  ctx.strokeStyle = c.muted; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();

  // Y tick labels: round decades of log10 T with faint gridlines.
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.fillStyle = 'rgba(200,206,224,0.62)';
  ctx.textAlign = 'right';
  const yStep = 20, yloTick = Math.ceil(lmin / yStep) * yStep, yhiTick = Math.floor(lmax / yStep) * yStep;
  for (let lv = yloTick; lv <= yhiTick; lv += yStep) {
    const yy = yFor(lv);
    ctx.fillText(`10^${lv}`, x0 - 6, yy + 3);
    ctx.strokeStyle = 'rgba(226,232,240,0.07)';
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
  }

  // X tick labels at chosen Q (axis is linear in 1/sqrt(Q)).
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,206,224,0.62)';
  for (const Qv of [2, 3, 4, 6, 8, 10]) {
    const px = xFor(Qv);
    ctx.strokeStyle = 'rgba(226,232,240,0.12)';
    ctx.beginPath(); ctx.moveTo(px, y1); ctx.lineTo(px, y1 + 4); ctx.stroke();
    ctx.fillText(`${Qv}`, px, y1 + 16);
  }
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  ctx.fillStyle = c.muted; ctx.fillText('Q (MeV)', x1, y1 + 16);

  // Y-axis name (top-left) and the linear-in-1/sqrt(Q) descriptor (top-centre,
  // above the diagonal so it never meets the bottom status row).
  ctx.textAlign = 'left';
  ctx.fillText('log10 T_1/2 (s)', 8, y0 + 8);
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,206,224,0.6)';
  ctx.fillText('log T linear in 1/√Q', (x0 + x1) / 2, y0 + 8);

  // Geiger-Nuttall line: exactly linear in 1/sqrt(Q).
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const Q = QLO + (QHI - QLO) * i / 200;
    const px = xFor(Q), py = yFor(geigerNuttallLogT(st.Z, Q));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Current operating point.
  const lCur = geigerNuttallLogT(st.Z, st.Q);
  ctx.fillStyle = '#06d6a0';
  ctx.beginPath(); ctx.arc(xFor(st.Q), yFor(lCur), 6, 0, 2 * Math.PI); ctx.fill();

  // Status caption alone on the bottom row (no longer collides with the axis label).
  ctx.fillStyle = c.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`Z = ${st.Z}, Q = ${st.Q.toFixed(2)} MeV  ->  T_1/2 ~ 10^${lCur.toFixed(1)} s   (Geiger-Nuttall)`, 12, H - 8);
  rT.textContent = `10^${lCur.toFixed(1)} s`;
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:   css.getPropertyValue('--bg').trim() || '#060608',
    muted:css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
  };
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  drawBarrier(c);
  drawNuclearScene(c);
  drawGeigerNuttall(c);
}

let last = 0;
function tick(now) {
  if (!last) last = now;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (running) { clock += dt; emitClock -= dt; }
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME) {
    const presets = [
      { Z: 84, Q: 9.0 }, { Z: 86, Q: 6.5 }, { Z: 90, Q: 4.5 },
      { Z: 92, Q: 3.5 }, { Z: 96, Q: 2.5 },
    ];
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const p = presets[Math.min(presets.length - 1, Math.round(frac * (presets.length - 1)))];
    st.Z = p.Z; st.Q = p.Q;
    sZ.value = String(st.Z); vZ.textContent = String(st.Z);
    sQ.value = st.Q.toFixed(2); vQ.textContent = st.Q.toFixed(2);
    clock = 0.4 + 1.6 * frac;
    // Pre-roll a fixed 7 s of scene so the emission cadence (hence the
    // half-life) shows: rapid streams for short-lived, almost none for
    // long-lived presets.
    const cc = colors();
    for (let s = 0; s < 440; s += 1) { emitClock -= 0.016; drawNuclearScene(cc); }
    if (alphas.length > 14) alphas.splice(0, alphas.length - 14);
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
      }));
    }
    return;
  }
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const Z = st.Z ?? 92;
  const Q = st.Q ?? 4.5;
  return { fields: [
    { key: 'parent-z', label: 'Parent nucleus Z', value: Z, format: 'float' },
    { key: 'alpha-ke', label: 'Alpha kinetic energy Q (MeV)', value: Q, format: 'float' },
    { key: 'coulomb-barrier', label: 'Coulomb barrier estimate', value: (2 * (Z - 2)) / 1.2 ** (1 / 3), format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const Z = st.Z ?? 92;
  const Q = st.Q ?? 4.5;
  const V_c = 2 * (Z - 2) / 1.2 ** (1 / 3); // Coulomb barrier height (MeV)
  const isSubbarrierTunneling = Q < V_c;
  
  return [
    { key: 'gamow-tunneling', label: 'Sub-barrier tunneling: Q < V_coulomb', value: isSubbarrierTunneling ? 'yes' : 'no', status: 'drift' },
  ];
}
