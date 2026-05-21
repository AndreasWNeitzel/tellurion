// Second quantization. Panel A: the Fock-state ladder with the a^dag
// (raise, sqrt(n+1)) and a (lower, sqrt(n)) operators and the current
// state amplitudes; fermions stop at |1> by Pauli. Panel B: the
// (anti)commutator identity (a a^dag -+ a^dag a)|psi> = |psi>. Panel
// C: the occupation distribution |c_n|^2 (Poissonian for a coherent
// state). Gate-tested sim.js; deterministic. Dirac 1927; Fetter and
// Walecka 1971; Sakurai and Napolitano.
import {
  norm, expectationN, commutatorAction, coherentState, pump,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rStat = document.getElementById('readout-stat');
const rN = document.getElementById('readout-n');
const rNorm = document.getElementById('readout-norm');
const rRel = document.getElementById('readout-rel');
const selS = document.getElementById('select-stat');
const selM = document.getElementById('select-mode');
const sA = document.getElementById('slider-alpha'), vA = document.getElementById('value-alpha');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const NM_B = 24, NM_F = 1, DEF_STAT = 'boson', DEF_MODE = 'pump', DEF_A = 2.4;
const st = { stat: DEF_STAT, mode: DEF_MODE, alpha: DEF_A, running: !prefersReducedMotion(), ph: 0 };

function nMax() { return st.stat === 'fermion' ? NM_F : NM_B; }
function currentState() {
  if (st.mode === 'coherent' && st.stat === 'boson') {
    return coherentState(st.alpha * st.ph, NM_B);        // alpha ramps with the sweep
  }
  const kMax = st.stat === 'fermion' ? 4 : 10;           // stay on the visible ladder
  return pump(Math.round(st.ph * kMax), st.stat, nMax());
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawLadder(x, y, w, h, state) {
  panel(x, y, w, h, 'Fock ladder: a^dag raises by sqrt(n+1), a lowers by sqrt(n)');
  const shown = Math.min(state.length - 1, 11);
  const x0 = x + 70, y0 = y + 32, y1 = y + h - 24;
  const dy = (y1 - y0) / shown;
  const Yr = (n) => y1 - dy * n;
  for (let n = 0; n <= shown; n += 1) {
    const yy = Yr(n);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + 70, yy); ctx.stroke();
    ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`|${n}>`, x0 - 34, yy + 3);
    // amplitude bar for the current state
    const c = Math.abs(state[n] ?? 0);
    ctx.fillStyle = '#7fd1ff';
    ctx.fillRect(x0 + 86, yy - 6, (w - 200) * c, 12);
    if (c > 0.02) { ctx.fillStyle = 'rgba(127,209,255,0.85)'; ctx.fillText(c.toFixed(2), x0 + 90 + (w - 200) * c, yy + 3); }
    // ladder operator labels between rungs
    if (n < shown) {
      ctx.fillStyle = 'rgba(143,227,155,0.7)';
      ctx.fillText(`a^dag x sqrt(${n + 1})`, x0 + 6, yy - dy * 0.5 - 2);
    }
  }
  if (st.stat === 'fermion') {
    ctx.fillStyle = 'rgba(255,143,143,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('Pauli: a^dag|1> = 0 (no |2>)', x0, y0 - 8);
  }
  ctx.fillStyle = 'rgba(200,215,240,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('amplitude |c_n|', x0 + 90, y1 + 14);
}

function bars(x, y, w, h, vals, color, labelFn) {
  const n = vals.length;
  let mx = 1e-9; for (const v of vals) mx = Math.max(mx, Math.abs(v));
  const bw = (w - 8) / n;
  for (let i = 0; i < n; i += 1) {
    const bh = (h - 18) * Math.abs(vals[i]) / mx;
    ctx.fillStyle = color;
    ctx.fillRect(x + 4 + i * bw + 1, y + h - 14 - bh, Math.max(1, bw - 2), bh);
    if (labelFn && n <= 14) { ctx.fillStyle = 'rgba(200,215,240,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText(labelFn(i), x + 4 + i * bw + 1, y + h - 3); }
  }
}

function drawCommutator(x, y, w, h, state) {
  const isF = st.stat === 'fermion';
  panel(x, y, w, h, isF ? 'anticommutator {a, a^dag} = 1 (and a^2 = 0)' : 'commutator [a, a^dag] = 1');
  const result = commutatorAction(state, st.stat);        // must equal state
  const half = (h - 40) / 2;
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('|psi>', x + 8, y + 30);
  bars(x + 8, y + 32, w - 16, half - 6, Array.from(state), '#7fd1ff');
  ctx.fillStyle = 'rgba(200,215,240,0.7)';
  ctx.fillText(isF ? '(a a^dag + a^dag a)|psi>' : '(a a^dag - a^dag a)|psi>', x + 8, y + 36 + half);
  bars(x + 8, y + 38 + half, w - 16, half - 6, Array.from(result), '#8fe39b');
  let dev = 0; for (let i = 0; i < state.length; i += 1) dev = Math.max(dev, Math.abs(result[i] - state[i]));
  ctx.fillStyle = dev < 1e-9 ? 'rgba(143,227,155,0.9)' : 'rgba(255,143,143,0.9)';
  ctx.fillText(`identical to |psi> (max dev ${dev.toExponential(1)}) -> eigenvalue 1`, x + 8, y + h - 6);
}

function drawDist(x, y, w, h, state) {
  panel(x, y, w, h, 'occupation |c_n|^2 (Poissonian if coherent)');
  const shown = Math.min(state.length, 26);
  const p = []; for (let i = 0; i < shown; i += 1) p.push(state[i] * state[i]);
  bars(x + 8, y + 20, w - 16, h - 50, p, '#f1c069', (i) => (shown <= 14 ? String(i) : ''));
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`<N> = ${expectationN(state).toFixed(3)},  norm = ${norm(state).toFixed(4)}`, x + 10, y + h - 10);
  ctx.fillText('n ->', x + w - 34, y + h - 10);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const s = currentState();
  drawLadder(20, 22, W - 40, 232, s);
  drawCommutator(20, 270, (W - 52) / 2, H - 270 - 16, s);
  drawDist(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16, s);
  rStat.textContent = st.stat;
  rN.textContent = expectationN(s).toFixed(2);
  rNorm.textContent = norm(s).toFixed(3);
  rRel.textContent = st.stat === 'fermion' ? '{a,adag}=1' : '[a,adag]=1';
}

const LIVE = 1 / 300;
function tick() {
  if (st.running) { st.ph += LIVE; if (st.ph >= 1) st.ph = 0; }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vA.textContent = st.alpha.toFixed(2); }
function restart() { st.ph = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
selS.addEventListener('change', () => { st.stat = selS.value; restart(); draw(); });
selM.addEventListener('change', () => { st.mode = selM.value; restart(); draw(); });
sA.addEventListener('input', () => { st.alpha = parseFloat(sA.value) / 100; syncLabels(); draw(); });
bR.addEventListener('click', () => {
  st.stat = DEF_STAT; st.mode = DEF_MODE; st.alpha = DEF_A;
  selS.value = DEF_STAT; selM.value = DEF_MODE; sA.value = String(DEF_A * 100);
  syncLabels(); restart(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { stat: st.stat, mode: st.mode, alpha: st.alpha.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.stat) { st.stat = s.stat; selS.value = s.stat; }
  if (s.mode) { st.mode = s.mode; selM.value = s.mode; }
  if (s.alpha) { st.alpha = parseFloat(s.alpha); sA.value = String(Math.round(st.alpha * 100)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = f;
    draw();
  } else {
    draw();
  }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
// The canonical (anti)commutator [a, a-dag] = 1 (bosons) or
// {a, a-dag} = 1 (fermions) and the unit norm of the state are the
// invariants of the second-quantised algebra.
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () {
    try {
      const s = currentState();
      const r = commutatorAction(s, st.stat);
      let dev = 0;
      for (let i = 0; i < s.length; i += 1) dev = Math.max(dev, Math.abs(r[i] - s[i]));
      const nrm = norm(s);
      return [
        {
          key: 'commutator',
          label: st.stat === 'fermion' ? '{a, a-dag}|psi> = |psi>' : '[a, a-dag]|psi> = |psi>',
          value: dev.toExponential(1),
          status: dev < 1e-9 ? 'pass' : (dev < 1e-4 ? 'pending' : 'drift'),
        },
        {
          key: 'norm',
          label: 'state norm = 1',
          value: nrm.toFixed(4),
          status: Math.abs(nrm - 1) < 1e-6 ? 'pass' : (Math.abs(nrm - 1) < 1e-3 ? 'pending' : 'drift'),
        },
      ];
    } catch (e) { return []; }
  };
}
