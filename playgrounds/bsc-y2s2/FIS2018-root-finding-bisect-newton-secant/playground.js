// Bisection, Newton and secant on f(x). The old view drew a static
// curve and let x0/x1 nudge a sparse, time-gated iterate trail, so the
// guess sliders barely moved the frame and a non-bracketing interval
// silently produced nothing. Now x0 and x1 are bold full-height guides
// (so moving either sweeps a large area), the full iteration trail is
// drawn with the method-specific construction (bisection brackets,
// Newton tangents, secant chords), a same-sign interval is reported
// instead of failing silently, and a reserved side panel shows the
// error decay so the convergence order (bisection linear, Newton
// quadratic, secant superlinear) that distinguishes the methods is
// visible. The bisection error proxy is the bracket half-width, which
// is the quantity that actually halves each step (the raw midpoint
// error is erratic and gives a meaningless order).
// Reference: Burden and Faires, Numerical Analysis (9th ed.), Ch. 2.

import { bisect, newton, secant } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r'), rN = document.getElementById('readout-n');
const sX0 = document.getElementById('slider-x0'), vX0 = document.getElementById('value-x0');
const sX1 = document.getElementById('slider-x1'), vX1 = document.getElementById('value-x1');
const selF = document.getElementById('select-f'), selM = document.getElementById('select-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const DEF = { x0: 1, x1: 2.5, fn: 'x2-2', method: 'bisect' };
const st = { ...DEF }; let running = true;

sX0.addEventListener('input', () => { st.x0 = parseFloat(sX0.value); vX0.textContent = st.x0.toFixed(2); render(); });
sX1.addEventListener('input', () => { st.x1 = parseFloat(sX1.value); vX1.textContent = st.x1.toFixed(2); render(); });
selF.addEventListener('change', () => { st.fn = selF.value; render(); });
selM.addEventListener('change', () => { st.method = selM.value; render(); });
btnR.addEventListener('click', () => { Object.assign(st, DEF); sX0.value = '1'; sX1.value = '2.5'; selF.value = 'x2-2'; selM.value = 'bisect'; vX0.textContent = '1.00'; vX1.textContent = '2.50'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); render(); });
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

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const pad = { l: 56, r: 22, t: 52, b: 46 }, GUT = 244;
  const mainR = W - pad.r - GUT;             // right edge of the function plot
  const xmin = -3, xmax = 3;
  let ymax = 0, ymin = 0;
  for (let i = 0; i <= 400; i += 1) { const y = f(xmin + (xmax - xmin) * i / 400); if (y > ymax) ymax = y; if (y < ymin) ymin = y; }
  ymax = Math.max(ymax, 1) * 1.08; ymin = Math.min(ymin, -1) * 1.08;
  const X = (x) => pad.l + (x - xmin) / (xmax - xmin) * (mainR - pad.l);
  const Y = (y) => pad.t + (1 - (y - ymin) / (ymax - ymin)) * (H - pad.t - pad.b);

  // Run the chosen method.
  let result, sameSign = false;
  if (st.method === 'bisect') { sameSign = f(st.x0) * f(st.x1) > 0; result = bisect(f, st.x0, st.x1); }
  else if (st.method === 'newton') result = newton(f, df, st.x0);
  else { sameSign = f(st.x0) * f(st.x1) > 0; result = secant(f, st.x0, st.x1); }
  const iters = result.trail.map((t) => (t.m !== undefined ? t.m : t.x));
  const brackets = st.method !== 'newton';

  ctx.save();
  ctx.beginPath(); ctx.rect(pad.l - 4, pad.t - 4, mainR - pad.l + 8, H - pad.t - pad.b + 8); ctx.clip();

  if (brackets) {
    ctx.fillStyle = 'rgba(91,192,235,0.07)';
    ctx.fillRect(X(Math.min(st.x0, st.x1)), pad.t, Math.abs(X(st.x1) - X(st.x0)), H - pad.t - pad.b);
  }
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(pad.l, Y(0)); ctx.lineTo(mainR, Y(0));
  ctx.moveTo(X(0), pad.t); ctx.lineTo(X(0), H - pad.b); ctx.stroke();

  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= 400; i += 1) { const x = xmin + (xmax - xmin) * i / 400; i ? ctx.lineTo(X(x), Y(f(x))) : ctx.moveTo(X(x), Y(f(x))); }
  ctx.stroke();

  const guides = brackets ? [['x0', st.x0, '#5bc0eb'], ['x1', st.x1, '#ef476f']] : [['x0', st.x0, '#5bc0eb']];
  for (const [lab, xv, col] of guides) {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(X(xv), pad.t); ctx.lineTo(X(xv), H - pad.b); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(xv), Y(f(xv)), 5, 0, 2 * Math.PI); ctx.fill();
    ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${lab}=${xv.toFixed(2)}`, X(xv), pad.t - 6); ctx.textAlign = 'left';
  }

  if (st.method === 'newton') {
    for (let i = 0; i < iters.length - 1; i += 1) {
      ctx.strokeStyle = 'rgba(91,192,235,0.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(iters[i]), Y(f(iters[i]))); ctx.lineTo(X(iters[i + 1]), Y(0)); ctx.stroke();
    }
  } else if (st.method === 'secant') {
    for (let i = 0; i < iters.length - 1; i += 1) {
      ctx.strokeStyle = 'rgba(91,192,235,0.40)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(iters[i]), Y(f(iters[i]))); ctx.lineTo(X(iters[i + 1]), Y(f(iters[i + 1]))); ctx.stroke();
    }
  } else {
    for (let i = 0; i < result.trail.length; i += 1) {
      const tr = result.trail[i]; if (tr.a === undefined) continue;
      const yy = pad.t + 8 + i * Math.min(11, (H - pad.t - pad.b - 16) / Math.max(1, result.trail.length));
      ctx.strokeStyle = 'rgba(6,214,160,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(tr.a), yy); ctx.lineTo(X(tr.b), yy); ctx.stroke();
    }
  }

  const n = iters.length;
  for (let i = 0; i < n; i += 1) {
    const x = iters[i];
    ctx.fillStyle = `hsla(${150 + i * 6}, 70%, 60%, ${0.25 + 0.7 * (i / Math.max(1, n - 1))})`;
    ctx.beginPath(); ctx.arc(X(x), Y(f(x)), 4.5, 0, 2 * Math.PI); ctx.fill();
  }
  if (result.ok && isFinite(result.root)) {
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X(result.root), Y(0), 8, 0, 2 * Math.PI); ctx.stroke();
    ctx.fillStyle = '#06d6a0'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`root ≈ ${result.root.toFixed(6)}`, X(result.root), Y(0) + 22); ctx.textAlign = 'left';
  }
  ctx.restore();

  // Axis labels (outside the clip).
  ctx.fillStyle = '#7e828a'; ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.fillText('x', mainR - 8, Y(0) - 6);
  ctx.textAlign = 'left'; ctx.fillText('f(x)', X(0) + 6, pad.t + 2);

  // Per-method error proxy: bracket half-width for bisection (the
  // quantity that halves each step), |x_i - root| otherwise.
  let errs;
  if (st.method === 'bisect') errs = result.trail.filter((t) => t.a !== undefined).map((t) => Math.max(1e-16, Math.abs(t.b - t.a) / 2));
  else errs = iters.map((x) => Math.max(1e-16, Math.abs(x - result.root))).filter((e) => isFinite(e));

  let pOrder = NaN;
  const ne = errs.filter((e) => e > 1e-15);
  if (ne.length >= 3) {
    const a = ne[ne.length - 3], b = ne[ne.length - 2], c = ne[ne.length - 1];
    const lo = Math.log(b / a), hi = Math.log(c / b);
    if (Math.abs(lo) > 1e-9) pOrder = hi / lo;
  }

  // Reserved side panel (never overlaps the function plot).
  const px0 = mainR + 18, pw = W - pad.r - px0, py0 = pad.t, ph = H - pad.t - pad.b;
  ctx.fillStyle = '#0d0d14'; ctx.fillRect(px0, py0, pw, ph);
  ctx.strokeStyle = '#2a2a34'; ctx.strokeRect(px0, py0, pw, ph);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(st.method === 'bisect' ? 'bracket half-width (log)' : '|xᵢ − root|  (log)', px0 + 10, py0 + 18);
  const gx0 = px0 + 34, gx1 = px0 + pw - 12, gy0 = py0 + 30, gy1 = py0 + ph - 56;
  if (errs.length >= 2) {
    const top = Math.max(0, Math.ceil(Math.log10(Math.max(...errs))));
    const bot = -16;
    const ex = (i) => gx0 + i / Math.max(1, errs.length - 1) * (gx1 - gx0);
    const ey = (e) => gy0 + (1 - (Math.log10(e) - bot) / (top - bot)) * (gy1 - gy0);
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 1;
    for (let d = bot; d <= top; d += 4) { const yy = ey(Math.pow(10, d)); ctx.beginPath(); ctx.moveTo(gx0, yy); ctx.lineTo(gx1, yy); ctx.stroke(); ctx.fillStyle = '#5a5e66'; ctx.fillText(`1e${d}`, px0 + 4, yy + 3); }
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 1.6; ctx.beginPath();
    errs.forEach((e, i) => { i ? ctx.lineTo(ex(i), ey(e)) : ctx.moveTo(ex(i), ey(e)); });
    ctx.stroke();
    errs.forEach((e, i) => { ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(ex(i), ey(e), 2.5, 0, 2 * Math.PI); ctx.fill(); });
  }
  const expect = st.method === 'bisect' ? '≈ 1 (linear)' : st.method === 'newton' ? '≈ 2 (quadratic)' : '≈ 1.6 (superlinear)';
  ctx.fillStyle = '#cdd1d6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`est. order p ≈ ${isFinite(pOrder) ? pOrder.toFixed(2) : 'n/a'}`, px0 + 10, py0 + ph - 32);
  ctx.fillStyle = '#7e828a';
  ctx.fillText(`expected ${expect}`, px0 + 10, py0 + ph - 16);

  // Header / status.
  ctx.textAlign = 'left'; ctx.font = '12px ui-monospace, monospace';
  if (sameSign) {
    ctx.fillStyle = '#ef476f';
    ctx.fillText('f(x0)·f(x1) > 0: no sign change in [x0, x1], move a guide to bracket a root', 14, 24);
  } else if (!result.ok) {
    ctx.fillStyle = '#ef476f';
    ctx.fillText(`${st.method}: did not converge (derivative ≈ 0 or max iterations)`, 14, 24);
  } else {
    ctx.fillStyle = '#cdd1d6';
    ctx.fillText(`${st.method}   f(x) selector / sliders set the guesses   root ≈ ${result.root.toFixed(8)}   iters = ${result.trail.length - 1}`, 14, 24);
  }
  rR.textContent = isFinite(result.root) ? result.root.toFixed(5) : 'NaN';
  rN.textContent = String(result.trail.length - 1);
}

let rafOn = false;
function tick() { render(); if (running && !CAPTURE_NAME) requestAnimationFrame(tick); else rafOn = false; }
function startLoop() { if (!rafOn && !CAPTURE_NAME) { rafOn = true; requestAnimationFrame(tick); } }
btnP.addEventListener('click', startLoop);
btnR.addEventListener('click', startLoop);
function bootSync() {
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); startLoop(); }, { once: true }); } else { bootSync(); startLoop(); }
