import { bisect, newton, secant } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r'), rN = document.getElementById('readout-n');
const sX0 = document.getElementById('slider-x0'), vX0 = document.getElementById('value-x0');
const sX1 = document.getElementById('slider-x1'), vX1 = document.getElementById('value-x1');
const selF = document.getElementById('select-f'), selM = document.getElementById('select-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { x0: 1, x1: 2.5, fn: 'x2-2', method: 'bisect', t: 0 };
let running = true;
sX0.addEventListener('input', () => { st.x0 = parseFloat(sX0.value); vX0.textContent = st.x0.toFixed(2); });
sX1.addEventListener('input', () => { st.x1 = parseFloat(sX1.value); vX1.textContent = st.x1.toFixed(2); });
selF.addEventListener('change', () => { st.fn = selF.value; });
selM.addEventListener('change', () => { st.method = selM.value; });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function f(x) {
  switch (st.fn) {
    case 'x2-2': return x * x - 2;
    case 'cos-x': return Math.cos(x) - x;
    case 'x3-x-1': return x * x * x - x - 1;
    case 'exp-x': return Math.exp(-x) - x;
  }
  return 0;
}
function df(x) {
  switch (st.fn) {
    case 'x2-2': return 2 * x;
    case 'cos-x': return -Math.sin(x) - 1;
    case 'x3-x-1': return 3 * x * x - 1;
    case 'exp-x': return -Math.exp(-x) - 1;
  }
  return 0;
}
let last = performance.now();
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const pad = { l: 60, r: 30, t: 30, b: 50 }, W = canvas.width, H = canvas.height;
  const xmin = -3, xmax = 3;
  let ymax = 0, ymin = 0;
  for (let i = 0; i < 400; i += 1) {
    const x = xmin + (xmax - xmin) * i / 400;
    const y = f(x);
    if (y > ymax) ymax = y;
    if (y < ymin) ymin = y;
  }
  ymax = Math.max(ymax, 1); ymin = Math.min(ymin, -1);
  const xToPx = (x) => pad.l + (x - xmin) / (xmax - xmin) * (W - pad.l - pad.r);
  const yToPx = (y) => pad.t + (1 - (y - ymin) / (ymax - ymin)) * (H - pad.t - pad.b);
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath();
  ctx.moveTo(pad.l, yToPx(0)); ctx.lineTo(W - pad.r, yToPx(0));
  ctx.moveTo(xToPx(0), pad.t); ctx.lineTo(xToPx(0), H - pad.b); ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < 400; i += 1) {
    const x = xmin + (xmax - xmin) * i / 400;
    const y = f(x);
    if (i === 0) ctx.moveTo(xToPx(x), yToPx(y)); else ctx.lineTo(xToPx(x), yToPx(y));
  }
  ctx.stroke();
  let result;
  if (st.method === 'bisect') result = bisect(f, st.x0, st.x1);
  else if (st.method === 'newton') result = newton(f, df, st.x0);
  else result = secant(f, st.x0, st.x1);
  const N_visible = Math.min(result.trail.length, Math.floor(st.t * 2));
  ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.5;
  for (let i = 0; i < N_visible; i += 1) {
    const pt = result.trail[i];
    const x = pt.m !== undefined ? pt.m : pt.x;
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(xToPx(x), yToPx(0)); ctx.lineTo(xToPx(x), yToPx(f(x))); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `hsla(${140 + i * 5}, 70%, 60%, ${(i / N_visible) * 0.8 + 0.2})`;
    ctx.beginPath(); ctx.arc(xToPx(x), yToPx(f(x)), 6, 0, 2 * Math.PI); ctx.fill();
  }
  if (st.method === 'newton' && N_visible >= 2) {
    for (let i = 0; i < N_visible - 1; i += 1) {
      const xi = result.trail[i].x, xn = result.trail[i + 1].x;
      ctx.strokeStyle = 'rgba(91,192,235,0.5)';
      ctx.beginPath(); ctx.moveTo(xToPx(xi), yToPx(f(xi))); ctx.lineTo(xToPx(xn), yToPx(0)); ctx.stroke();
    }
  }
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`method = ${st.method}, root ≈ ${result.root.toFixed(8)}, iters = ${result.trail.length - 1}`, 12, H - 12);
  rR.textContent = result.root.toFixed(5); rN.textContent = (N_visible - 1).toString();
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; if (st.t > 30) st.t = 0; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 10; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
