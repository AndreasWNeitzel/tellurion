// Green's function for the 1D Laplacian, shown as the physical object
// it is: a taut elastic string pinned at both ends. Poke it with a
// unit point load at x0 and it sags into exactly G(x, x0) (the
// elementary response). Any distributed load f is a sum of pokes, so
// the string under f settles into u(x) = integral G f, built here by
// an animated superposition sweep. The analytic u(x) / f(x) curves
// are the small diagnostic strip. sim.js (greenFn, solve) is the
// gate-tested engine and is unchanged. Reference: Arfken and Weber,
// Mathematical Methods (7th ed.), Ch. 10; Riley and Hobson Ch. 21.
import { greenFn, solve } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rX = document.getElementById('readout-x');
const sX = document.getElementById('slider-x'), vX = document.getElementById('value-x');
const selF = document.getElementById('select-f');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const st = { x0: 0.5, fn: 'const', t: 0, sweep: 0, drag: false };
let running = true;
const N = 200;
const X0P = 60, X1P = W - 36;
const xToPx = (x) => X0P + x * (X1P - X0P);
const pxToX = (px) => Math.max(0, Math.min(1, (px - X0P) / (X1P - X0P)));

function f(x) {
  switch (st.fn) {
    case 'const': return 1;
    case 'step': return x < 0.5 ? 1 : 0;
    case 'gauss': return Math.exp(-50 * (x - 0.3) ** 2);
    case 'sin': return Math.sin(Math.PI * x);
    default: return 0;
  }
}

sX.addEventListener('input', () => { st.x0 = parseFloat(sX.value); vX.textContent = st.x0.toFixed(2); });
selF.addEventListener('change', () => { st.fn = selF.value; st.sweep = 0; });
btnR.addEventListener('click', () => {
  st.x0 = 0.5; st.fn = 'const'; st.sweep = 0; sX.value = '0.5'; vX.textContent = '0.50';
  if (selF) selF.value = 'const';
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
});
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function evX(e) { const r = canvas.getBoundingClientRect(); return pxToX((e.clientX - r.left) / r.width * W); }
canvas.addEventListener('pointerdown', (e) => { st.drag = true; st.x0 = evX(e); sX.value = String(st.x0); vX.textContent = st.x0.toFixed(2); });
canvas.addEventListener('pointermove', (e) => { if (st.drag) { st.x0 = evX(e); sX.value = String(st.x0); vX.textContent = st.x0.toFixed(2); } });
window.addEventListener('pointerup', () => { st.drag = false; });

// settling displacement arrays (critically-damped relaxation toward
// the equilibrium shape, so changing x0 or f makes the string move)
const dTop = new Float64Array(N + 1), dBot = new Float64Array(N + 1);

function pinnedString(yBase, disp, scale, color, glow) {
  ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  if (glow) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 8; }
  ctx.beginPath();
  for (let i = 0; i <= N; i += 1) {
    const x = i / N, px = xToPx(x), py = yBase + disp[i] * scale;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  if (glow) ctx.restore();
  ctx.fillStyle = '#cbd5e1';
  for (const x of [0, 1]) { ctx.beginPath(); ctx.arc(xToPx(x), yBase, 4, 0, 6.2832); ctx.fill(); }
}

function render() {
  if (!CAPTURE_NAME && running) { st.t += 1; if (st.sweep < 1) st.sweep = Math.min(1, st.sweep + 0.012); }
  ctx.fillStyle = '#070810'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '16px sans-serif';
  ctx.fillText("Green's function = the shape a pinned string takes under a point poke", 18, 26);

  // TOP panel: unit point load at x0, string sags into G(x, x0)
  const yTop = 132;
  ctx.fillStyle = '#64748b'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('unit point load at x0   gives   string shape G(x, x0)', 22, yTop - 70);
  const gmax = 0.25;
  const SC_T = 150 / gmax;
  for (let i = 0; i <= N; i += 1) {
    const tgt = greenFn(i / N, st.x0, 1);
    dTop[i] = CAPTURE_NAME ? tgt : dTop[i] + (tgt - dTop[i]) * 0.18;
  }
  const bx = xToPx(st.x0), by = yTop + dTop[Math.round(st.x0 * N)] * SC_T;
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bx, yTop - 54); ctx.lineTo(bx, by - 8); ctx.stroke();
  ctx.fillStyle = '#ef476f'; ctx.beginPath();
  ctx.moveTo(bx, by - 2); ctx.lineTo(bx - 5, by - 12); ctx.lineTo(bx + 5, by - 12); ctx.closePath(); ctx.fill();
  pinnedString(yTop, dTop, SC_T, '#ffd166', true);
  ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.arc(bx, by, 5.5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`x0 = ${st.x0.toFixed(2)}   G_max = ${(st.x0 * (1 - st.x0)).toFixed(3)}  (drag the string)`, bx + 10, yTop - 36);

  // BOTTOM panel: distributed load f, u(x) built by superposing pokes
  const yBot = 340;
  const r = solve(f, 1, N);
  let uMax = 1e-9; for (let i = 0; i < r.u.length; i += 1) uMax = Math.max(uMax, Math.abs(r.u[i]));
  const SC_B = 150 / uMax;
  ctx.fillStyle = '#64748b'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`distributed load f(x) = ${st.fn}   gives   u(x) = integral G f  (sum of pokes)`, 22, yBot - 78);
  let fMax = 1e-9; for (let i = 0; i <= 24; i += 1) fMax = Math.max(fMax, Math.abs(f(i / 24)));
  ctx.strokeStyle = 'rgba(6,214,160,0.55)'; ctx.lineWidth = 1.4;
  for (let k = 1; k < 24; k += 1) {
    const x = k / 24, ff = f(x); if (Math.abs(ff) < 1e-6) continue;
    const px = xToPx(x), L0 = yBot - 66, L1 = yBot - 66 + (ff / fMax) * 30;
    ctx.beginPath(); ctx.moveTo(px, L0); ctx.lineTo(px, L1);
    ctx.moveTo(px, L1); ctx.lineTo(px - 3, L1 - 5); ctx.moveTo(px, L1); ctx.lineTo(px + 3, L1 - 5); ctx.stroke();
  }
  const p = CAPTURE_NAME ? 1 : st.sweep;
  const jMax = Math.round(p * N);
  const acc = new Float64Array(N + 1);
  const dx = 1 / N;
  for (let i = 0; i <= N; i += 1) {
    let s = 0;
    for (let j = 0; j <= jMax; j += 1) s += greenFn(i / N, j / N, 1) * f(j / N) * dx;
    acc[i] = s;
  }
  for (let i = 0; i <= N; i += 1) dBot[i] = CAPTURE_NAME ? acc[i] : dBot[i] + (acc[i] - dBot[i]) * 0.4;
  ctx.strokeStyle = 'rgba(91,192,235,0.28)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < r.u.length; i += 1) {
    const px = xToPx(r.xs[i]), py = yBot + r.u[i] * SC_B;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  pinnedString(yBot, dBot, SC_B, '#5bc0eb', true);
  if (!CAPTURE_NAME && p < 1) {
    const sxp = xToPx(p);
    ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(sxp, yBot - 66); ctx.lineTo(sxp, yBot + 160); ctx.stroke(); ctx.setLineDash([]);
  }

  // diagnostic strip: the analytic curves and the exact checks
  const dy = H - 70;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(X0P, dy, X1P - X0P, 52);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(X0P + 0.5, dy + 0.5, X1P - X0P - 1, 51);
  ctx.fillStyle = '#64748b'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('diagnostic: analytic u(x) (cyan) and f(x) (green)', X0P + 6, dy + 13);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let i = 0; i < r.u.length; i += 1) {
    const px = X0P + 6 + r.xs[i] * (X1P - X0P - 12);
    const py = dy + 46 - (r.u[i] / uMax) * 30;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(6,214,160,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const x = i / 100, px = X0P + 6 + x * (X1P - X0P - 12);
    const py = dy + 46 - (f(x) / fMax) * 30;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const mid = solve((x) => 1, 1, N).u[N / 2];
  ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right';
  ctx.fillText(`u(0)=u(L)=0   u(L/2)|f=1 = ${mid.toFixed(4)} (exact L^2/8 = 0.125)`, X1P - 6, dy + 13);
  ctx.textAlign = 'left';

  rX.textContent = st.x0.toFixed(2);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const states = [
      { x0: 0.20, fn: 'const' }, { x0: 0.35, fn: 'step' }, { x0: 0.50, fn: 'gauss' },
      { x0: 0.65, fn: 'sin' }, { x0: 0.80, fn: 'const' },
    ];
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    const s = states[Math.min(states.length - 1, Math.round(frac * (states.length - 1)))];
    st.x0 = s.x0; st.fn = s.fn; st.sweep = 1;
    sX.value = String(st.x0); vX.textContent = st.x0.toFixed(2);
    if (selF) selF.value = st.fn;
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
