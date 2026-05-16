// playground.js
// The Cauchy criterion made visceral. Top: the sequence terms on a
// number line; the tail n >= N0 is highlighted and its diameter
// (sup |a_m - a_n|) is drawn as a band that collapses inside the
// epsilon ruler as you raise N0, with a live "Cauchy at this N0?"
// verdict (it never collapses for the harmonic series). Bottom: the
// convergence trace with the epsilon tube. sim.js core is unchanged.

import { SEQUENCES, cauchyWidth } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutAn = document.getElementById('readout-an');
const readoutW = document.getElementById('readout-w');
const selectSeq = document.getElementById('select-seq');
const sliderN = document.getElementById('slider-n');
const sliderEps = document.getElementById('slider-eps');
const valueSeq = document.getElementById('value-seq');
const valueN = document.getElementById('value-n');
const valueEps = document.getElementById('value-eps');

const W = canvas.width, H = canvas.height;
const NMAX = 200;
const st = { name: selectSeq.value, N0: parseInt(sliderN.value, 10), eps: Math.pow(10, parseFloat(sliderEps.value)), playing: !DETERMINISTIC };

function seqVals() {
  const f = SEQUENCES[st.name].fn;
  const v = new Float64Array(NMAX + 1);
  for (let n = 1; n <= NMAX; n += 1) v[n] = f(n);
  return v;
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const S = SEQUENCES[st.name];
  const v = seqVals();
  // Visible value range from the first few terms (robust for divergent).
  let lo = Infinity, hi = -Infinity;
  for (let n = 1; n <= NMAX; n += 1) { if (v[n] < lo) lo = v[n]; if (v[n] > hi) hi = v[n]; }
  if (!Number.isFinite(S.limit)) { lo = Math.min(lo, 0); hi = v[NMAX]; }
  const span = (hi - lo) || 1; lo -= 0.08 * span; hi += 0.08 * span;

  // Number-line panel (top): a_n positions, tail band.
  const nlY = 150, nlX0 = 60, nlX1 = W - 40;
  const valToX = (val) => nlX0 + (nlX1 - nlX0) * (val - lo) / (hi - lo);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(nlX0, nlY); ctx.lineTo(nlX1, nlY); ctx.stroke();
  // tail diameter band
  let tmin = Infinity, tmax = -Infinity;
  for (let n = st.N0; n <= NMAX; n += 1) { if (v[n] < tmin) tmin = v[n]; if (v[n] > tmax) tmax = v[n]; }
  ctx.fillStyle = 'rgba(91,192,235,0.18)';
  ctx.fillRect(valToX(tmin), nlY - 46, valToX(tmax) - valToX(tmin), 92);
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.5;
  ctx.strokeRect(valToX(tmin), nlY - 46, valToX(tmax) - valToX(tmin), 92);
  // limit + epsilon ruler around it (or around tail centre if divergent)
  const centre = Number.isFinite(S.limit) ? S.limit : 0.5 * (tmin + tmax);
  if (Number.isFinite(S.limit)) {
    ctx.strokeStyle = '#ef476f'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(valToX(S.limit), nlY - 60); ctx.lineTo(valToX(S.limit), nlY + 60); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef476f'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`limit ${S.limit.toFixed(4)}`, valToX(S.limit), nlY - 66);
  }
  ctx.strokeStyle = 'rgba(255,209,102,0.7)'; ctx.lineWidth = 1;
  for (const sgn of [-1, 1]) {
    const ex = valToX(centre + sgn * st.eps);
    ctx.beginPath(); ctx.moveTo(ex, nlY - 56); ctx.lineTo(ex, nlY + 56); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,209,102,0.8)'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('epsilon tube', valToX(centre), nlY + 74);
  // term dots: early grey, tail blue
  for (let n = 1; n <= NMAX; n += 1) {
    ctx.fillStyle = n >= st.N0 ? 'rgba(91,192,235,0.9)' : 'rgba(150,156,168,0.45)';
    const r = n >= st.N0 ? 3 : 2;
    ctx.beginPath(); ctx.arc(valToX(v[n]), nlY + (n % 2 ? -1 : 1) * 0, r, 0, 2 * Math.PI); ctx.fill();
  }
  const w = cauchyWidth(st.name, st.N0, NMAX);
  const ok = w < st.eps;
  ctx.font = 'bold 14px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = ok ? '#06d6a0' : '#ef476f';
  ctx.fillText(ok ? `tail fits in epsilon  ->  Cauchy at N0 = ${st.N0}`
                   : `tail diameter ${w.toExponential(2)} > epsilon  ->  not yet`, 60, 40);
  // Ground-truth verdict: a finite limit means convergent, hence
  // Cauchy. (isCauchy with a tight epsilon and a short horizon would
  // mislabel slowly-converging series such as the Leibniz sum.)
  const convergent = Number.isFinite(S.limit);
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`sequence: ${S.label}    ${convergent ? 'Cauchy (converges)' : 'NOT Cauchy (diverges)'}`, 60, 60);

  // Convergence trace (bottom).
  const tY0 = 250, tY1 = H - 40, tX0 = 60, tX1 = W - 40;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.strokeRect(tX0, tY0, tX1 - tX0, tY1 - tY0);
  const nToX = (n) => tX0 + (tX1 - tX0) * (n - 1) / (NMAX - 1);
  const vToY = (val) => tY1 - (tY1 - tY0) * (val - lo) / (hi - lo);
  if (Number.isFinite(S.limit)) {
    ctx.fillStyle = 'rgba(255,209,102,0.12)';
    ctx.fillRect(tX0, vToY(S.limit + st.eps), tX1 - tX0, Math.abs(vToY(S.limit - st.eps) - vToY(S.limit + st.eps)));
    ctx.strokeStyle = '#ef476f'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(tX0, vToY(S.limit)); ctx.lineTo(tX1, vToY(S.limit)); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let n = 1; n <= NMAX; n += 1) { const X = nToX(n), Y = vToY(v[n]); if (n === 1) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
  ctx.stroke();
  const nx = nToX(st.N0);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(nx, tY0); ctx.lineTo(nx, tY1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`N0 = ${st.N0}`, nx, tY1 + 14);
  ctx.textAlign = 'left'; ctx.fillText('partial value a_n  vs  n', tX0 + 6, tY0 + 14);

  readoutAn.textContent = v[st.N0].toFixed(5);
  readoutW.textContent = w.toExponential(2);
}

selectSeq.addEventListener('change', () => { st.name = selectSeq.value; valueSeq.textContent = st.name; render(); });
sliderN.addEventListener('input', () => { st.N0 = parseInt(sliderN.value, 10); valueN.textContent = String(st.N0); render(); });
sliderEps.addEventListener('input', () => { st.eps = Math.pow(10, parseFloat(sliderEps.value)); valueEps.textContent = st.eps.toExponential(1); render(); });

function bootSync() {
  valueSeq.textContent = st.name;
  valueN.textContent = String(st.N0);
  valueEps.textContent = st.eps.toExponential(1);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const keys = Object.keys(SEQUENCES);
    st.name = keys[Math.min(keys.length - 1, Math.round(f * (keys.length - 1)))];
    selectSeq.value = st.name; valueSeq.textContent = st.name;
    st.N0 = Math.max(1, Math.round(f * 120));
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  render();
}

bootSync();
