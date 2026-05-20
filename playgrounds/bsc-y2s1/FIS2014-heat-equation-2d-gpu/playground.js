// 2D heat diffusion through a painted slab. The primary scene is the
// physical temperature field (viridis) with live conductive-flux
// streamlines q = -kappa grad T; the side panel is the mid-row T(x)
// cross-section. Presets: composite wall, uniform rod, room radiator,
// finned heat sink, insulated quench. Paint metal, insulator, heat
// and cold to reshape the field. Reference: Press et al., Numerical
// Recipes (3rd ed.), Sec. 20.2.

import { createGrid, setFixed, step, cflDt, totalHeat, maxResidual } from './sim.js';
import { fieldToImageData, viridis } from '../../../shared/js/render/colormaps.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const N = 96;
const TOTAL_STEPS = 6000;            // capture horizon (late transient)
const VMAX = 3.0;                    // fixed absolute T scale (= source-T slider max)
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const off = document.createElement('canvas'); off.width = N; off.height = N;
const offCtx = off.getContext('2d');
let imgData = new ImageData(N, N);

const READOUTS = ['sim t', 'dt (CFL)', 'steps', 'sum T', 'max resid', 'preset'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { preset: 'composite', kappaRatio: 8, s0: 1.6, simRate: 6, brush: 'metal', t: 0, mx: -1, my: -1, over: false };
const BRUSH_COL = { metal: '#f4f6fb', insulator: '#7aa8ff', heat: '#ff8a4d', cold: '#7fd1ff', erase: '#9aa0ad' };
let g = createGrid(N), dt = 0.01, nSteps = 0, simT = 0, running = true;

// Build a scene honouring the kappa-contrast and source-amplitude
// controls (so both are physical and always perceptible).
function buildScene() {
  g = createGrid(N);
  const kHi = st.kappaRatio, kLo = 1 / Math.sqrt(st.kappaRatio), s0 = st.s0;
  const p = st.preset;
  if (p === 'rod') {
    for (let j = 0; j < N; j += 1) { setFixed(g, 2, j, s0); setFixed(g, N - 3, j, 0); }
  } else if (p === 'composite') {
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) g.kap[j * N + i] = i < N / 2 ? kHi : kLo;
    for (let j = 0; j < N; j += 1) { setFixed(g, 2, j, s0); setFixed(g, N - 3, j, 0); }
  } else if (p === 'radiator') {
    for (let j = (N * 0.62) | 0; j < (N * 0.8) | 0; j += 1)
      for (let i = (N * 0.12) | 0; i < (N * 0.3) | 0; i += 1) g.src[j * N + i] = s0 * 0.05;
    for (let i = 0; i < N; i += 1) { setFixed(g, i, 1, 0); setFixed(g, i, N - 2, 0); setFixed(g, 1, i, 0); setFixed(g, N - 2, i, 0); }
  } else if (p === 'heatsink') {
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1)
      if (i > N * 0.35 && (((i - ((N * 0.35) | 0)) >> 2) & 1) === 0) g.kap[j * N + i] = kHi;
    for (let j = (N * 0.42) | 0; j < (N * 0.58) | 0; j += 1) for (let i = 1; i < 4; i += 1) g.src[j * N + i] = s0 * 0.06;
    for (let j = 0; j < N; j += 1) setFixed(g, N - 2, j, 0);
  } else if (p === 'quench') {
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
      const dx = (i - N / 2) / (N * 0.16), dy = (j - N / 2) / (N * 0.16);
      g.T[j * N + i] = s0 * Math.exp(-(dx * dx + dy * dy));
    }
  }
  dt = cflDt(g, 0.9);
  nSteps = 0; simT = 0; st.t = 0;
}

function advance(k) {
  for (let s = 0; s < k; s += 1) { step(g, dt); nSteps += 1; simT += dt; }
}

function paintAt(px, py) {
  const i = Math.round((px - FX) / CELL), j = Math.round((py - FY) / CELL);
  if (i < 0 || j < 0 || i >= N || j >= N) return;
  const R = 3;
  for (let dj = -R; dj <= R; dj += 1) for (let di = -R; di <= R; di += 1) {
    const ii = i + di, jj = j + dj; if (ii < 1 || jj < 1 || ii >= N - 1 || jj >= N - 1) continue;
    if (di * di + dj * dj > R * R) continue;
    const k = jj * N + ii;
    if (st.brush === 'metal') { g.kap[k] = st.kappaRatio; g.fixed[k] = 0; g.src[k] = 0; }
    else if (st.brush === 'insulator') { g.kap[k] = 1 / Math.sqrt(st.kappaRatio); g.fixed[k] = 0; g.src[k] = 0; }
    else if (st.brush === 'heat') { g.fixed[k] = 1; g.val[k] = st.s0; g.T[k] = st.s0; }
    else if (st.brush === 'cold') { g.fixed[k] = 1; g.val[k] = 0; g.T[k] = 0; }
    else { g.kap[k] = 1; g.src[k] = 0; g.fixed[k] = 0; }
  }
  dt = cflDt(g, 0.9);
}

// geometry (right column starts below the top-right readout HUD)
const FX = 16, FY = 16, FPX = 560, CELL = FPX / N;
const PX = 600, PW = 168;

function sampleT(x, y) {                       // bilinear on the grid
  const fx = Math.max(0, Math.min(N - 1.001, x)), fy = Math.max(0, Math.min(N - 1.001, y));
  const i = fx | 0, j = fy | 0, a = fx - i, b = fy - j, T = g.T;
  const t00 = T[j * N + i], t10 = T[j * N + i + 1], t01 = T[(j + 1) * N + i], t11 = T[(j + 1) * N + i + 1];
  return (t00 * (1 - a) + t10 * a) * (1 - b) + (t01 * (1 - a) + t11 * a) * b;
}
function kappaAt(x, y) { const i = Math.max(0, Math.min(N - 1, x | 0)), j = Math.max(0, Math.min(N - 1, y | 0)); return g.kap[j * N + i]; }
function fluxAt(x, y) {
  const gx = (sampleT(x + 0.6, y) - sampleT(x - 0.6, y)) / 1.2;
  const gy = (sampleT(x, y + 0.6) - sampleT(x, y - 0.6)) / 1.2;
  const kp = kappaAt(x, y);
  return [-kp * gx, -kp * gy];
}

// Bounding box of all grid cells matching pred, or null if none.
function bbox(pred) {
  let i0 = 1e9, j0 = 1e9, i1 = -1, j1 = -1;
  for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
    if (pred(j * N + i)) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
  }
  return i1 < 0 ? null : { i0, j0, i1, j1 };
}
function boxRect(b, color, label) {
  if (!b) return;
  const x = FX + b.i0 * CELL, y = FY + b.j0 * CELL;
  const w = (b.i1 - b.i0 + 1) * CELL, h = (b.j1 - b.j0 + 1) * CELL;
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
  ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3); ctx.setLineDash([]); ctx.lineWidth = 1;
  const ly = (y - 6) < FY + 12 ? y + h + 14 : y - 6;
  const lx = Math.max(FX + 2, Math.min(x, FX + FPX - 130));
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.92)'; ctx.shadowBlur = 3;
  ctx.fillStyle = color; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(label, lx, ly); ctx.fillText(label, lx, ly); ctx.restore();
}
// Per-cell paint overlay: a small coloured dot on every cell the user
// has painted (fixed boundary or volumetric source). This shows
// EXACTLY where the brush has stamped, without the previous dashed
// bounding boxes which kept growing as the user painted and read as
// a visual glitch.
function drawPaintOverlay() {
  const r = Math.max(1.2, CELL * 0.32);
  for (let j = 0; j < g.N; j += 1) for (let i = 0; i < g.N; i += 1) {
    const k = j * g.N + i;
    let c = null;
    if (g.fixed[k] === 1 && g.val[k] > 1e-6) c = '#ff8a4d';
    else if (g.fixed[k] === 1 && g.val[k] <= 1e-6) c = '#7fd1ff';
    else if (g.src[k] > 1e-9) c = '#ffd166';
    if (!c) continue;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(FX + (i + 0.5) * CELL, FY + (j + 0.5) * CELL, r, 0, 6.2832);
    ctx.fill();
  }
}
function drawBrushCursor() {
  if (!st.over || st.mx < FX || st.my < FY || st.mx > FX + FPX || st.my > FY + FPX) return;
  const col = BRUSH_COL[st.brush] || '#9aa0ad';
  ctx.strokeStyle = col; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(st.mx, st.my, 3 * CELL, 0, 6.2832); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(st.mx, st.my, 1.5, 0, 6.2832); ctx.fill();
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 3;
  ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`${st.brush} brush`, st.mx + 3 * CELL + 4, st.my + 3); ctx.restore();
  ctx.lineWidth = 1;
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const vmax = VMAX;

  // temperature field
  imgData = fieldToImageData(g.T, N, N, 0, vmax, viridis, imgData);
  offCtx.putImageData(imgData, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, FX, FY, FPX, FPX);

  // kappa contrast overlay (cool tint where insulating, faint where metal)
  ctx.save();
  for (let j = 0; j < N; j += 2) for (let i = 0; i < N; i += 2) {
    const kp = g.kap[j * N + i];
    if (Math.abs(kp - 1) < 1e-6) continue;
    const x = FX + i * CELL, y = FY + j * CELL;
    if (kp < 1) { ctx.fillStyle = 'rgba(120,170,255,0.10)'; ctx.fillRect(x, y, CELL * 2, CELL * 2); }
    else { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x, y, CELL * 2, CELL * 2); }
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(FX, FY, FPX, FPX);

  // conductive-flux streamlines, q = -kappa grad T
  let qref = 1e-9;
  for (let j = 4; j < N; j += 8) for (let i = 4; i < N; i += 8) { const [u, v] = fluxAt(i, j); qref = Math.max(qref, Math.hypot(u, v)); }
  const dash = (st.t * 26) % 10;
  for (let sj = 6; sj < N - 4; sj += 9) for (let si = 6; si < N - 4; si += 9) {
    let x = si, y = sj; const pts = [[x, y]];
    for (let s = 0; s < 26; s += 1) {
      const [u1, v1] = fluxAt(x, y); const m1 = Math.hypot(u1, v1); if (m1 < qref * 0.04) break;
      const hx = u1 / m1, hy = v1 / m1;
      const [u2, v2] = fluxAt(x + hx, y + hy); const m2 = Math.hypot(u2, v2) || 1;
      x += 0.5 * (hx + u2 / m2); y += 0.5 * (hy + v2 / m2);
      if (x < 1 || y < 1 || x > N - 2 || y > N - 2) break;
      pts.push([x, y]);
    }
    if (pts.length < 4) continue;
    const m0 = fluxAt(pts[0][0], pts[0][1]); const mag = Math.hypot(m0[0], m0[1]) / qref;
    const c = viridis(0.35 + 0.6 * Math.min(1, mag));
    ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},0.85)`; ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]); ctx.lineDashOffset = -dash;
    ctx.beginPath(); ctx.moveTo(FX + pts[0][0] * CELL, FY + pts[0][1] * CELL);
    for (const [px, py] of pts) ctx.lineTo(FX + px * CELL, FY + py * CELL);
    ctx.stroke(); ctx.setLineDash([]);
    const [ex, ey] = pts[pts.length - 1], [bx, by] = pts[pts.length - 2];
    const ang = Math.atan2(ey - by, ex - bx), ax = FX + ex * CELL, ay = FY + ey * CELL;
    ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},0.95)`;
    ctx.beginPath(); ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 6 * Math.cos(ang - 0.4), ay - 6 * Math.sin(ang - 0.4));
    ctx.lineTo(ax - 6 * Math.cos(ang + 0.4), ay - 6 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
  }

  // labelled hitboxes for the boundary sources/sinks, then the brush
  drawPaintOverlay();
  drawBrushCursor();

  // colour bar
  const cbX = PX, cbY = 170, cbW = 16, cbH = 160;
  for (let s = 0; s < cbH; s += 1) { const c = viridis(1 - s / cbH); ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`; ctx.fillRect(cbX, cbY + s, cbW, 1); }
  ctx.strokeStyle = 'rgba(200,205,215,0.4)'; ctx.strokeRect(cbX, cbY, cbW, cbH);
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(vmax.toFixed(1), cbX + cbW + 5, cbY + 8);
  ctx.fillText('0.0', cbX + cbW + 5, cbY + cbH);
  ctx.fillText('T', cbX + 3, cbY - 8);

  // secondary panel: mid-row cross-section T(x)
  const pX = PX, pY = 360, pW = PW, pH = 216, jm = N >> 1;
  ctx.fillStyle = '#0c0e14'; ctx.fillRect(pX, pY, pW, pH);
  ctx.strokeStyle = 'rgba(200,205,215,0.35)'; ctx.strokeRect(pX, pY, pW, pH);
  ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const xx = pX + (i / (N - 1)) * pW, yy = pY + pH - (Math.max(0, Math.min(vmax, g.T[jm * N + i])) / vmax) * pH;
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('mid-row  T(x)', pX + pW / 2, pY - 8);
  ctx.fillText('x', pX + pW / 2, pY + pH + 16);
  ctx.save(); ctx.translate(pX - 8, pY + pH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('T', 0, 0); ctx.restore();
  ctx.textAlign = 'left';

  rEls['sim t'].textContent = simT.toFixed(1);
  rEls['dt (CFL)'].textContent = dt.toFixed(4);
  rEls['steps'].textContent = String(nSteps);
  rEls['sum T'].textContent = totalHeat(g).toFixed(1);
  rEls['max resid'].textContent = maxResidual(g).toExponential(1);
  rEls['preset'].textContent = st.preset;
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt = v => v.toFixed(1)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => {
    st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value);
    if (key === 'kappaRatio' || key === 's0') buildScene();
    render();
  });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
function buildSelect(label, opts, key, after) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
  sel.value = st[key];
  sel.addEventListener('change', () => { st[key] = sel.value; if (after) after(); render(); });
  const sp = document.createElement('span'); sp.className = 'value';
  row.appendChild(lab); row.appendChild(sel); row.appendChild(sp);
  controlsEl.appendChild(row); return sel;
}

const cPre = buildSelect('preset', [['composite', 'composite wall'], ['rod', 'uniform rod'], ['radiator', 'room radiator'], ['heatsink', 'finned heat sink'], ['quench', 'insulated quench']], 'preset', buildScene);
const cKap = buildSlider('kappa contrast', 2, 16, 0.5, st.kappaRatio, 'kappaRatio', v => v.toFixed(1) + 'x');
const cS0 = buildSlider('source T', 0.4, 3, 0.05, st.s0, 's0', v => v.toFixed(2));
const cRate = buildSlider('sim rate', 1, 20, 1, st.simRate, 'simRate', v => v.toFixed(0) + '/f');
const cBrush = buildSelect('paint brush', [['metal', 'metal (kappa up)'], ['insulator', 'insulator (kappa down)'], ['heat', 'heat source'], ['cold', 'cold sink'], ['erase', 'erase']], 'brush', null);

const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { preset: 'composite', kappaRatio: 8, s0: 1.6, simRate: 6, brush: 'metal', t: 0 });
  cPre.value = 'composite'; cKap.inp.value = '8'; cKap.val.textContent = '8.0x';
  cS0.inp.value = '1.6'; cS0.val.textContent = '1.60'; cRate.inp.value = '6'; cRate.val.textContent = '6/f';
  cBrush.value = 'metal'; buildScene(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

let painting = false;
function evToGrid(e) { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height]; }
canvas.addEventListener('mousedown', e => { painting = true; const [x, y] = evToGrid(e); st.mx = x; st.my = y; st.over = true; paintAt(x, y); render(); });
canvas.addEventListener('mousemove', e => { const [x, y] = evToGrid(e); st.mx = x; st.my = y; st.over = true; if (painting) paintAt(x, y); render(); });
window.addEventListener('mouseup', () => { painting = false; });
canvas.addEventListener('mouseleave', () => { painting = false; st.over = false; render(); });

// loop and capture
let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (running) { st.t += dr; advance(st.simRate); }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  buildScene();
  if (CAPTURE_NAME) { advance(Math.round(CAPTURE_FRAC * TOTAL_STEPS)); st.t = CAPTURE_FRAC * 6; }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const gg = createGrid(60);
  for (let j = 0; j < 60; j += 1) { setFixed(gg, 0, j, 1); setFixed(gg, 59, j, 0); }
  const d = cflDt(gg, 0.9);
  for (let n = 0; n < 30000; n += 1) step(gg, d);
  const mid = 30, errs = [10, 20, 30, 40, 50].map(i => Math.abs(gg.T[mid * 60 + i] - (1 - i / 59)));
  const e = Math.max(...errs);
  if (e > 1e-2) return { name: 'steady linear (Laplace)', pass: false, msg: `err=${e.toExponential(2)}` };
  return { name: 'uniform-kappa steady = linear profile', pass: true, msg: `max dev ${e.toExponential(2)}` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
