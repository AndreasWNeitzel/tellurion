// Magnetic hysteresis. Primary scene: a lattice of magnetic domains
// that flip toward the applied field but lag it; secondary: the B-H
// loop traced live with a glowing pen and the per-cycle energy (loop
// area). M(H) is integrated with the Jiles-Atherton model from the
// headless sim.js as H = Hm sin(wt) sweeps.
// Reference: Jiles and Atherton, JMMM 61, 48 (1986); Griffiths,
// Introduction to Electrodynamics (4th ed.), Sec. 6.

import { langevin, dLangevinExact, sweepLoop, PRESETS } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['preset', 'H', 'M/Ms', 'Hc', 'loss/cyc'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { preset: 'hard steel', k: 0.95, Ms: 1.4, Hm: 3.0, t: 0 };
function par() { const base = PRESETS[st.preset]; return { ...base, k: st.k, Ms: st.Ms }; }
let P = par(), loop = sweepLoop(P, st.Hm), M = 0, Hprev = 0;
// The reference loop is the STEADY-STATE B-H cycle; a fresh jaStep
// starts at M = 0 on the initial-magnetisation curve and would
// disagree with the reference for the first few cycles (and after
// every parameter change). Run several cycles of jaStep so M reaches
// the steady-state loop before the user sees the ball.
function warmupToSteady() {
  const W = 1400, dt = 0.02;
  for (let s = 0; s < W; s += 1) {
    st.t += dt;
    jaStep(st.Hm * Math.sin(st.t * 1.1));
  }
}
function rebuild() { P = par(); loop = sweepLoop(P, st.Hm); warmupToSteady(); }
let running = true;

// Seeded per-domain switching thresholds (a wave of reversal as M grows).
const GX = 22, GY = 14;
const rng = makeRng(DEFAULT_SEED);
const thr = []; for (let i = 0; i < GX * GY; i += 1) thr.push(0.12 + 0.8 * rng());

function selectRow(label, opts, value, onChange) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; s.appendChild(o); }
  s.value = value; s.addEventListener('change', () => onChange(s.value));
  row.appendChild(lab); row.appendChild(s); const sp = document.createElement('span'); sp.className = 'value'; row.appendChild(sp);
  controlsEl.appendChild(row); return s;
}
function slider(label, min, max, stp, val, key, fmt = v => v.toFixed(2)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(val); inp.setAttribute('aria-label', label);
  const vEl = document.createElement('span'); vEl.className = 'value'; vEl.textContent = fmt(+val);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); vEl.textContent = fmt(+inp.value); rebuild(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(vEl);
  controlsEl.appendChild(row); return { inp, vEl };
}
const selP = selectRow('material', [['soft iron', 'soft iron'], ['hard steel', 'hard steel'], ['ferrite', 'ferrite']], st.preset, v => { st.preset = v; st.k = PRESETS[v].k; st.Ms = PRESETS[v].Ms; cK.inp.value = String(st.k); cK.vEl.textContent = st.k.toFixed(2); cM.inp.value = String(st.Ms); cM.vEl.textContent = st.Ms.toFixed(2); rebuild(); });
const cK = slider('coercivity k', 0.02, 1.2, 0.01, st.k, 'k');
const cM = slider('saturation Ms', 0.5, 2.0, 0.05, st.Ms, 'Ms');
const cH = slider('drive Hm', 1.0, 5.0, 0.1, st.Hm, 'Hm', v => v.toFixed(1));
cH.inp.addEventListener('input', () => { rebuild(); });
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => { Object.assign(st, { preset: 'hard steel', k: 0.95, Ms: 1.4, Hm: 3.0, t: 0 }); selP.value = 'hard steel'; cK.inp.value = '0.95'; cK.vEl.textContent = '0.95'; cM.inp.value = '1.4'; cM.vEl.textContent = '1.40'; cH.inp.value = '3'; cH.vEl.textContent = '3.0'; M = 0; Hprev = 0; rebuild(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

function jaStep(Hn) {
  const { Ms, a, alpha, k, c } = P;
  const dH = Hn - Hprev; const delta = dH >= 0 ? 1 : -1;
  const He = Hprev + alpha * M;
  const Man = Ms * langevin(He / a);
  const dManHe = (Ms / a) * dLangevinExact(He / a);
  const denom = k * delta - alpha * (Man - M);
  const dMirr = Math.abs(denom) < 1e-9 ? 0 : (Man - M) / denom;
  const dMdH = ((1 - c) * dMirr + c * dManHe) / (1 - alpha * c * dManHe || 1);
  M = Math.max(-Ms * 1.05, Math.min(Ms * 1.05, M + dMdH * dH));
  Hprev = Hn;
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const Happ = st.Hm * Math.sin(st.t * 1.1);
  const f = Math.max(-1, Math.min(1, M / st.Ms));   // net alignment fraction

  // PRIMARY: domain lattice. Cells flip toward sign(f) once |f| exceeds
  // their threshold; the rest stay in the prior direction (the lag).
  const lx = 26, ly = 64, lw = W * 0.46, lh = H - 150;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '13px ui-monospace, monospace';
  ctx.fillText('magnetic domains', lx, ly - 14);
  const cw = lw / GX, ch = lh / GY;
  for (let j = 0; j < GY; j += 1) for (let i = 0; i < GX; i += 1) {
    const id = j * GX + i;
    // Threshold-ordered reversal: a cell flips toward the field only
    // once the net magnetisation passes its switching threshold, so
    // the lattice reverses as a wave that lags H (the hysteresis).
    const d = (f >= 0)
      ? (f > 1 - thr[id] ? 1 : -1)
      : (f < -(1 - thr[id]) ? -1 : 1);
    const cx = lx + i * cw + cw / 2, cy = ly + j * ch + ch / 2;
    const col = d > 0 ? '#ef5d6f' : '#5b8cff';
    ctx.fillStyle = d > 0 ? 'rgba(239,93,111,0.16)' : 'rgba(91,140,255,0.16)';
    ctx.fillRect(lx + i * cw + 1, ly + j * ch + 1, cw - 2, ch - 2);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
    const ar = Math.min(cw, ch) * 0.34;
    ctx.beginPath(); ctx.moveTo(cx, cy + d * ar); ctx.lineTo(cx, cy - d * ar); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - d * ar);
    ctx.lineTo(cx - 4, cy - d * ar + d * 6); ctx.lineTo(cx + 4, cy - d * ar + d * 6);
    ctx.closePath(); ctx.fill();
  }
  // Applied-field indicator above the lattice.
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
  const hx = lx + lw / 2;
  ctx.beginPath(); ctx.moveTo(hx, ly - 6); ctx.lineTo(hx + Happ / st.Hm * (lw * 0.4), ly - 6); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`H = ${Happ.toFixed(2)}`, lx + lw - 90, ly - 14);

  // SECONDARY: B-H loop panel.
  const px0 = W * 0.52, px1 = W - 28, py0 = 132, py1 = H - 70;
  const cx0 = (px0 + px1) / 2, cy0 = (py0 + py1) / 2;
  const sx = (px1 - px0) / (2 * st.Hm * 1.05), sy = (py1 - py0) / (2 * st.Ms * 1.15);
  ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(px0, cy0); ctx.lineTo(px1, cy0); ctx.moveTo(cx0, py0); ctx.lineTo(cx0, py1); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('B-H loop', px0, py0 - 14); ctx.fillText('H', px1 - 12, cy0 + 16); ctx.fillText('B', cx0 + 6, py0 + 4);
  // Reference loop (faint), then the live pen.
  ctx.strokeStyle = 'rgba(120,200,255,0.28)'; ctx.lineWidth = 1.4; ctx.beginPath();
  loop.pts.forEach(([h, m], i) => { const X = cx0 + h * sx, Y = cy0 - m * sy; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.closePath(); ctx.stroke();
  // Energy-loss shading (loop interior).
  ctx.fillStyle = 'rgba(255,160,90,0.10)'; ctx.beginPath();
  loop.pts.forEach(([h, m], i) => { const X = cx0 + h * sx, Y = cy0 - m * sy; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.closePath(); ctx.fill();
  // Glowing pen at the current operating point.
  const px = cx0 + Happ * sx, py = cy0 - M * sy;
  const g = ctx.createRadialGradient(px, py, 0, px, py, 12);
  g.addColorStop(0, '#fff2c0'); g.addColorStop(1, 'rgba(255,209,102,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 12, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(px, py, 4, 0, 6.28); ctx.fill();

  rEls.preset.textContent = st.preset;
  rEls.H.textContent = Happ.toFixed(2);
  rEls['M/Ms'].textContent = f.toFixed(3);
  rEls.Hc.textContent = loop.Hc.toFixed(3);
  rEls['loss/cyc'].textContent = loop.area.toFixed(3);
}

function tick() {
  if (running) {
    st.t += 0.02;
    const Hn = st.Hm * Math.sin(st.t * 1.1);
    jaStep(Hn);
  }
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) { st.t = CAPTURE_FRAC * 6; let hp = 0; M = 0; Hprev = 0; for (let s = 1; s <= 400; s += 1) { const tt = (s / 400) * st.t; jaStep(st.Hm * Math.sin(tt * 1.1)); } st.t = CAPTURE_FRAC * 6; }
  else { warmupToSteady(); }                            // start the ball on the steady loop
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}

window.__physicsCheck = async () => {
  const soft = sweepLoop(PRESETS['soft iron'], 3, 1400);
  const hard = sweepLoop(PRESETS['hard steel'], 3, 1400);
  if (!(hard.area > soft.area) || !(hard.Hc > soft.Hc)) return { name: 'hard vs soft', pass: false, msg: `area ${hard.area.toFixed(2)} vs ${soft.area.toFixed(2)}` };
  if (!(hard.Mr > 0.1)) return { name: 'remanence', pass: false, msg: `Mr=${hard.Mr.toFixed(3)}` };
  return { name: 'Jiles-Atherton: hard>soft loop, real remanence', pass: true, msg: `Hc hard ${hard.Hc.toFixed(2)} > soft ${soft.Hc.toFixed(2)}` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
