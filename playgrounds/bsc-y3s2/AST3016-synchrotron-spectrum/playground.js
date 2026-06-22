import { nu_c, singleSpec, spectralIndex } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';
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
let scenePhase = 0;            // electron-gyration animation clock (s)
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  const padL = 60, padR = 15, padT = 30, padB = 50;
  const mainW = W;                       // spectrum spans the full width (top)
  const specBot = Math.round(H * 0.48);  // spectrum occupies the top portion
  const rTop = specBot + 34;              // emission + N(gamma) panels stack below
  const rightW = W - padL - padR;
  const B = Math.pow(10, st.logB) * 1e-4;
  const nu_peak = nu_c(st.gamma, B);
  const alpha = spectralIndex(st.p);

  // Left panel: photon spectrum F(nu) log-log
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, specBot);
  ctx.lineTo(mainW - padR, specBot);
  ctx.stroke();

  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('log F', 8, padT + 10);
  ctx.fillText('log ν (Hz)', padL + (mainW - padL - padR) / 2 - 28, specBot + 32);

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
    return specBot - u * (specBot - padT);
  };
  // Decade grid + labels on the frequency axis.
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  for (let d = Math.ceil(lnumin); d <= Math.floor(lnumax); d += 1) {
    const px = xToPx(d);
    ctx.strokeStyle = '#1b1b1f'; ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, specBot); ctx.stroke();
    if (d % 2 === 0) { ctx.fillStyle = '#6b7077'; ctx.fillText(`10^${d}`, px, specBot + 14); }
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
    ctx.fillStyle = '#5bc0eb'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText(`slope = -α = -(p-1)/2 = ${(-alpha).toFixed(2)}`, xToPx(la), yToPx(fa) - 8);
  }
  const lcut = Math.log10(st.mode === 'single' ? nu_peak : nu_c(gMax, B));
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(lcut), padT); ctx.lineTo(xToPx(lcut), specBot); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ef476f'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`ν_c = ${Math.pow(10, lcut).toExponential(1)} Hz`, Math.min(xToPx(lcut) + 4, mainW - 120), padT + 12);

  // Right panel: top = an animated relativistic electron gyrating in B
  // with its 1/gamma forward-beamed emission cone (the physical origin
  // of the spectrum: a distant observer sees a sharp pulse each time the
  // narrow cone sweeps past, and a sharp pulse Fourier-transforms to the
  // broad power law on the left). Bottom = N(gamma) ~ gamma^-p.
  if (st.mode === 'ensemble') {
    const rPadL = padL, rPadR = 8;
    const splitY = rTop + (H - rTop - padB) * 0.46;
    // Emission animation sub-panel.
    const ecx = (rPadL + W - rPadR) / 2, ecy = (rTop + splitY) / 2;
    const orbR = Math.min((W - rPadR - rPadL), (splitY - rTop)) * 0.30;
    ctx.strokeStyle = '#2c2f36'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ecx, ecy, orbR, 0, 2 * Math.PI); ctx.stroke();
    ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText('relativistic electron + 1/γ beam', rPadL, rTop + 10);
    // Gyrofrequency ~ B / gamma; beam half-angle ~ 1/gamma.
    const gyro = 0.7 + 0.5 * (st.logB + 5);
    const ang = (scenePhase * gyro / (1 + st.gamma / 1500)) % (2 * Math.PI);
    const ex = ecx + orbR * Math.cos(ang), ey = ecy + orbR * Math.sin(ang);
    const vdir = ang + Math.PI / 2;                         // velocity is tangent
    const halfBeam = Math.max(0.05, Math.min(0.6, 320 / st.gamma));
    // Beamed emission cone (a wedge of half-angle ~1/gamma along v).
    const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, orbR * 1.7);
    grad.addColorStop(0, 'rgba(255,209,102,0.55)'); grad.addColorStop(1, 'rgba(255,209,102,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(ex, ey);
    ctx.arc(ex, ey, orbR * 1.7, vdir - halfBeam, vdir + halfBeam); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath(); ctx.arc(ex, ey, 4, 0, 2 * Math.PI); ctx.fill();
    // Observer to the right; a sharp pulse strip lights when the cone
    // points at them (this sharpness is why the spectrum is broadband).
    const obsDir = 0;
    let dphi = Math.abs(((vdir - obsDir + Math.PI) % (2 * Math.PI)) - Math.PI);
    const hit = Math.exp(-(dphi * dphi) / (2 * halfBeam * halfBeam));
    const stripY = splitY - 16, sx0 = rPadL, sx1 = W - rPadR;
    ctx.strokeStyle = '#3a3d44'; ctx.beginPath(); ctx.moveTo(sx0, stripY); ctx.lineTo(sx1, stripY); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(sx1 - 4, stripY - 22 * hit, 4, 22 * hit);
    ctx.fillStyle = '#9aa0a6'; ctx.fillText('observed pulse ->', sx0, stripY - 4);

    // N(gamma) sub-panel (bottom).
    const rPadT2 = splitY + 14;
    ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(rPadL, rPadT2); ctx.lineTo(rPadL, H - padB); ctx.lineTo(W - rPadR, H - padB); ctx.stroke();
    ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('log N', rPadL + 4, rPadT2 + 10);
    ctx.fillText('log γ', rPadL + rightW * 0.4, H - padB + 16);
    const lgmin = 0, lgmax = 4.5;
    const xDist = (lg) => rPadL + (lg - lgmin) / (lgmax - lgmin) * (W - rPadR - rPadL);
    const yDist = (ln) => H - padB - (ln + 6) / 6 * (H - rPadT2 - padB);
    ctx.save();
    ctx.beginPath(); ctx.rect(rPadL, rPadT2, W - rPadR - rPadL, H - padB - rPadT2); ctx.clip();
    ctx.strokeStyle = '#6cc24a'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 300; i += 1) {
      const lg = lgmin + (lgmax - lgmin) * i / 299;
      const px = xDist(lg), py = yDist(-st.p * (lg - lgmin) + 1);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`γ = ${st.gamma.toFixed(0)}, B = 10^${st.logB.toFixed(1)} G, p = ${st.p.toFixed(2)}, α = ${alpha.toFixed(2)}`, padL + 70, 16);
  rA.textContent = alpha.toFixed(2);
}
function tick(ts) { if (!CAPTURE_NAME) scenePhase = (ts || 0) / 1000; render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) {
    // Headline view: the ensemble power-law spectrum, with p swept
    // across frames so the goldens show the slope tilting (the slider
    // the user reported as dead now visibly drives the spectral index).
    st.mode = 'ensemble';
    st.p = 1.8 + CAPTURE_FRAC * 1.6;
    if (selM) selM.value = 'ensemble';
    if (vP) vP.textContent = st.p.toFixed(2);
    scenePhase = CAPTURE_FRAC * 6;          // deterministic electron phase per frame
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const B = Math.pow(10, st.logB) * 1e-4;
  const nu_peak = nu_c(st.gamma, B);
  const alpha = spectralIndex(st.p);
  return {
    fields: [
      { key: 'electron-lorentz', label: 'Electron gamma', value: st.gamma, format: 'float' },
      { key: 'mag-field', label: 'Magnetic field log10(B)', value: st.logB, format: 'float' },
      { key: 'spectral-index', label: 'Spectral index p', value: st.p, format: 'float' },
      { key: 'crit-frequency', label: 'Critical frequency nu_c', value: nu_peak, format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const B = Math.pow(10, st.logB) * 1e-4;
  const nu_peak = nu_c(st.gamma, B);
  const alphaOk = st.p >= 1 && st.p <= 4;
  const nuOk = nu_peak > 0 && Number.isFinite(nu_peak);
  return [
    {
      key: 'physics-bounds',
      label: 'Lorentz factor and frequency positive',
      value: (alphaOk && nuOk) ? 'pass' : 'drift',
      status: (alphaOk && nuOk) ? 'pass' : 'drift',
    },
  ];
};
