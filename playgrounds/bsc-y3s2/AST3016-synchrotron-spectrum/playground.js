import { nu_c, singleSpec, spectralIndex } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rA = document.getElementById('readout-a');
const sG = document.getElementById('slider-g'), vG = document.getElementById('value-g');
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const sP = document.getElementById('slider-p'), vP = document.getElementById('value-p');
const selM = document.getElementById('select-m');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
// Default to the power-law ensemble: that is the headline physics and
// the only mode where the electron index p affects the spectrum. In
// single-electron mode F(nu/nu_c) is p-independent, so with the old
// 'single' default the p slider correctly did nothing (it read as a
// dead slider). Every handler calls render() so interaction is
// authoritative regardless of the animation loop.
let st = { gamma: 2000, logB: -4, p: 2.4, mode: 'ensemble' }; let running = true;
sG.addEventListener('input', () => { st.gamma = parseFloat(sG.value); vG.textContent = st.gamma.toFixed(0); render(); });
sB.addEventListener('input', () => { st.logB = parseFloat(sB.value); vB.textContent = st.logB.toFixed(2); render(); });
sP.addEventListener('input', () => { st.p = parseFloat(sP.value); vP.textContent = st.p.toFixed(2); render(); });
selM.addEventListener('change', () => { st.mode = selM.value; render(); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const mainW = W * 0.6, rightW = W * 0.4;
  const padL = 60, padR = 15, padT = 30, padB = 50;
  const B = Math.pow(10, st.logB) * 1e-4;
  const nu_peak = nu_c(st.gamma, B);
  const alpha = spectralIndex(st.p);

  // Left panel: photon spectrum F(nu) log-log
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, H - padB);
  ctx.lineTo(mainW - padR, H - padB);
  ctx.stroke();

  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('log F', 8, padT + 10);
  ctx.fillText('log ν (Hz)', padL + (mainW - padL - padR) / 2 - 28, H - padB + 32);

  // Build the spectrum on a log-nu grid. Single mode: one electron's
  // F(nu/nu_c). Ensemble mode: the physically correct integral of the
  // single-electron spectrum over N(gamma) ~ gamma^-p, which produces
  // the low-nu nu^(1/3) rise, the nu^-((p-1)/2) power-law segment, and
  // the exponential cutoff, all from sim.js (no hand-rolled branches).
  const N = 500;
  const gMax = st.gamma, gMin = gMax / 300;
  // Fixed absolute frequency axis (Hz). The earlier axis auto-ranged on
  // nu_c(B), which slid with the spectrum and cancelled the visible
  // effect of the B and gamma sliders. With a fixed axis the whole SED
  // shifts right as nu_c ~ gamma^2 B grows, so B and gamma visibly act.
  const lnumin = 4, lnumax = 20;
  const xToPx = (l) => padL + (l - lnumin) / (lnumax - lnumin) * (mainW - padL - padR);
  const lf = new Float64Array(N);
  let lmax = -1e30;
  const NG = 56;
  for (let i = 0; i < N; i += 1) {
    const lnu = lnumin + (lnumax - lnumin) * i / (N - 1);
    const nu = Math.pow(10, lnu);
    let F;
    if (st.mode === 'single') {
      F = singleSpec(nu / nu_peak);
    } else {
      F = 0;
      for (let k = 0; k < NG; k += 1) {
        const g = gMin * Math.pow(gMax / gMin, k / (NG - 1));
        F += Math.pow(g, -st.p) * singleSpec(nu / nu_c(g, B)) * g;   // * g for d(ln g)
      }
    }
    lf[i] = Math.log10(F + 1e-300);
    if (lf[i] > lmax) lmax = lf[i];
  }
  // Auto-scale: peak near the top, 8 decades of dynamic range shown.
  const DR = 8;
  const yToPx = (v) => {
    let u = (v - (lmax - DR)) / DR; if (u < 0) u = 0; else if (u > 1) u = 1;
    return H - padB - u * (H - padT - padB);
  };
  // Decade grid + labels on the frequency axis.
  ctx.fillStyle = '#9aa0a6'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
  for (let d = Math.ceil(lnumin); d <= Math.floor(lnumax); d += 1) {
    const px = xToPx(d);
    ctx.strokeStyle = '#1b1b1f'; ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, H - padB); ctx.stroke();
    if (d % 2 === 0) { ctx.fillStyle = '#6b7077'; ctx.fillText(`10^${d}`, px, H - padB + 14); }
  }
  ctx.textAlign = 'left';
  // The spectrum.
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const lnu = lnumin + (lnumax - lnumin) * i / (N - 1);
    if (i === 0) ctx.moveTo(xToPx(lnu), yToPx(lf[i])); else ctx.lineTo(xToPx(lnu), yToPx(lf[i]));
  }
  ctx.stroke();
  // Reference slope -alpha through the power-law segment so the user
  // can read off that the slope equals -(p-1)/2 and watch it tilt with
  // the p slider.
  if (st.mode === 'ensemble') {
    const la = Math.log10(nu_c(gMin, B)) + 0.6, lb = Math.log10(nu_c(gMax, B)) - 0.3;
    const fa = lmax - 1.0;
    ctx.strokeStyle = 'rgba(91,192,235,0.8)'; ctx.lineWidth = 1.4; ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(xToPx(la), yToPx(fa));
    ctx.lineTo(xToPx(lb), yToPx(fa - alpha * (lb - la)));
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#5bc0eb'; ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`slope = -α = -(p-1)/2 = ${(-alpha).toFixed(2)}`, xToPx(la), yToPx(fa) - 8);
  }
  const lcut = Math.log10(st.mode === 'single' ? nu_peak : nu_c(gMax, B));
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(lcut), padT); ctx.lineTo(xToPx(lcut), H - padB); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ef476f'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText(`ν_c = ${Math.pow(10, lcut).toExponential(1)} Hz`, Math.min(xToPx(lcut) + 4, mainW - 120), padT + 12);

  // Right panel: electron distribution N(gamma) ~ gamma^-p (ensemble mode only)
  if (st.mode === 'ensemble') {
    const rightPadL = mainW + 8, rightPadR = 8, rightPadT = padT, rightPadB = padB;
    ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(rightPadL, rightPadT);
    ctx.lineTo(rightPadL, H - rightPadB);
    ctx.lineTo(W - rightPadR, H - rightPadB);
    ctx.stroke();

    ctx.fillStyle = '#9aa0a6'; ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('log N', mainW + 4, rightPadT + 10);
    ctx.fillText('log γ', mainW + (rightW - rightPadR) * 0.4, H - rightPadB + 16);

    const lgmin = 0, lgmax = 4.5;
    const xDist = (lg) => rightPadL + (lg - lgmin) / (lgmax - lgmin) * (W - rightPadR - rightPadL);
    const refDist = 0;
    const yDist = (ln) => H - rightPadB - (ln - refDist + 6) / 6 * (H - rightPadT - rightPadB);

    ctx.save();
    ctx.beginPath();
    ctx.rect(rightPadL, rightPadT, W - rightPadR - rightPadL, H - rightPadB - rightPadT);
    ctx.clip();
    // Normalise the line to the top-left so the chosen p only tilts the
    // slope and the line stays inside the panel for any p.
    ctx.strokeStyle = '#6cc24a'; ctx.lineWidth = 2; ctx.beginPath();
    const ND = 300;
    for (let i = 0; i < ND; i += 1) {
      const lg = lgmin + (lgmax - lgmin) * i / (ND - 1);
      const ln = -st.p * (lg - lgmin);
      const py = yDist(ln + 1);
      const px = xDist(lg);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`γ = ${st.gamma.toFixed(0)}, B = 10^${st.logB.toFixed(1)} G, p = ${st.p.toFixed(2)}, α = ${alpha.toFixed(2)}`, padL + 70, 16);
  rA.textContent = alpha.toFixed(2);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) {
    // Headline view: the ensemble power-law spectrum, with p swept
    // across frames so the goldens show the slope tilting (the slider
    // the user reported as dead now visibly drives the spectral index).
    st.mode = 'ensemble';
    st.p = 1.8 + CAPTURE_FRAC * 1.6;
    if (selM) selM.value = 'ensemble';
    if (vP) vP.textContent = st.p.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
