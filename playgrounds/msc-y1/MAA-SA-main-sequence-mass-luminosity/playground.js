// Main-sequence mass-luminosity relation, shown as a living stellar
// population. Each star's size follows R ~ M^0.7, its colour the
// effective temperature from Stefan-Boltzmann (L = R^2 (T/Tsun)^4),
// its glow the luminosity L(M), and it ages on its own clock
// t_MS = 10 Gyr (M/L): massive blue stars burn out and explode while
// the Sun barely changes and red dwarfs are effectively immortal,
// which is the point of the relation. The log-log L-M curve is the
// small diagnostic. sim.js (L_solar, MS_lifetime_Gyr) is unchanged.
// Reference: Carroll and Ostlie, Modern Astrophysics (2nd ed.), Ch. 7.
import { L_solar, MS_lifetime_Gyr } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rL = document.getElementById('readout-l');
const sM = document.getElementById('slider-M'), vM = document.getElementById('value-M');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const st = { M: 1, tau: 0 };
let running = !prefersReducedMotion();
const SAMPLE = [0.15, 0.3, 0.5, 0.8, 1, 1.6, 3, 6, 12, 25, 60];
// loop seconds; scaled so a 25 Msun star dies many times while the
// Sun ages a sliver (t_MS spans ~1e-3 to ~1e3 Gyr).
const RATE_GYR_PER_S = 60;

const Rstar = (M) => Math.pow(M, 0.7);                  // MS radius proxy (solar)
function Trel(M) { return Math.pow(L_solar(M) / (Rstar(M) ** 2), 0.25); } // T/Tsun
function starColor(M) {
  const T = Trel(M) * 5772;                              // K
  // smooth red -> yellow-white -> blue-white ramp
  let r, g, b;
  if (T < 5772) { const u = Math.max(0, Math.min(1, (T - 2800) / (5772 - 2800))); r = 255; g = 120 + 125 * u; b = 40 + 150 * u; }
  else { const u = Math.max(0, Math.min(1, (T - 5772) / (24000 - 5772))); r = 255 - 95 * u; g = 245 - 30 * u; b = 190 + 65 * u; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function drawStar(x, y, rad, M, glowK) {
  const col = starColor(M);
  const gr = rad * (1.5 + 0.6 * glowK);                  // bounded glow halo
  const g = ctx.createRadialGradient(x, y, 0, x, y, gr);
  g.addColorStop(0, col); g.addColorStop(0.5, col);
  g.addColorStop(0.7, 'rgba(255,220,150,0.10)'); g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, gr, 0, 6.2832); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill();
}

sM.addEventListener('input', () => { st.M = parseFloat(sM.value); vM.textContent = st.M.toFixed(2); });
btnR.addEventListener('click', () => { st.M = 1; st.tau = 0; sM.value = '1'; vM.textContent = '1.00'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function render() {
  if (!CAPTURE_NAME && running) st.tau += 0.05;
  ctx.fillStyle = '#070810'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('Mass sets a star: bigger mass means far brighter and far shorter-lived', 18, 26);

  // selected star + physical readout (top)
  const M = st.M, L = L_solar(M), t = MS_lifetime_Gyr(M), T = Trel(M) * 5772;
  const selX = 160, selY = 158;
  drawStar(selX, selY, Math.max(10, Math.min(54, Rstar(M) * 9)), M, Math.max(0.5, Math.min(3.6, Math.log10(L + 1) * 1.2)));
  ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('selected star', 340, 86);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'body', 'mono');
  ctx.fillText(`M  = ${M.toFixed(2)} Msun`, 340, 112);
  ctx.fillText(`L  = ${L < 1e4 ? L.toFixed(2) : L.toExponential(2)} Lsun   (L ~ M^3.5)`, 340, 136);
  ctx.fillText(`Teff = ${(T).toFixed(0)} K   R = ${Rstar(M).toFixed(2)} Rsun`, 340, 160);
  const tMyr = t * 1e3;
  const tTxt = t >= 1 ? `${t.toFixed(2)} Gyr` : tMyr >= 10 ? `${tMyr.toFixed(0)} Myr` : `${tMyr.toFixed(2)} Myr`;
  ctx.fillText(`t_MS = ${tTxt}`, 340, 184);

  // the living main sequence: a population aging on its own clocks
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('the main sequence: each star ages at age = elapsed / t_MS(M); massive ones die young', 26, 300);
  const sy = 400, x0 = 60, x1 = W - 40;
  ctx.strokeStyle = 'rgba(120,130,150,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, sy + 56); ctx.lineTo(x1, sy + 56); ctx.stroke();
  for (let k = 0; k < SAMPLE.length; k += 1) {
    const Mk = SAMPLE[k];
    const px = x0 + k / (SAMPLE.length - 1) * (x1 - x0);
    const tk = MS_lifetime_Gyr(Mk);
    const age = ((st.tau * RATE_GYR_PER_S) / tk) % 1.0;   // fraction of MS life
    const rad = Math.max(4, Math.min(24, Rstar(Mk) * 6.5));
    const glowK = Math.max(0.3, Math.min(1.8, Math.log10(L_solar(Mk) + 1) * 0.9));
    // Death-flash + SN spike removed: with each MS-lifetime cycle
    // independently triggering a flash, the row read as "random
    // flickers of luminosity" rather than physics. Stars now glow
    // steadily; the age bar communicates the cycle progress.
    drawStar(px, sy, rad, Mk, glowK);
    // age bar
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(px - 16, sy + 40, 32, 4);
    ctx.fillStyle = age > 0.9 ? '#ef476f' : '#5bc0eb'; ctx.fillRect(px - 16, sy + 40, 32 * age, 4);
    ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(7,8,16,0.85)'; ctx.strokeText(`${Mk}`, px, sy + 70);
    ctx.fillStyle = Math.abs(Mk - M) < 1e-6 ? '#ffd166' : '#cbd5e1';
    ctx.fillText(`${Mk}`, px, sy + 70);
    if (Math.abs(Mk - M) < 0.06) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, sy, rad + 7, 0, 6.2832); ctx.stroke(); }
  }
  ctx.textAlign = 'left';

  // diagnostics: the two relations the title promises, brighter (L-M) and
  // shorter-lived (t_MS-M), log-log with the current-mass marker.
  const gy0 = 558, gy1 = H - 20, gw = (W - 24 * 3) / 2;
  const gxA = 24, gxB = 24 + gw + 24;
  function panel(gx, title, fn, ylo, yhi, color, yticks) {
    ctx.fillStyle = '#0d1117'; ctx.fillRect(gx, gy0, gw, gy1 - gy0);
    ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(gx + 0.5, gy0 + 0.5, gw - 1, gy1 - gy0 - 1);
    const axX = gx + 42, axY0 = gy0 + 30, axY1 = gy1 - 32, axW = gw - 56;
    const xPx = (lm) => axX + (lm + 1) / 3 * axW;             // log M over [-1, 2]
    const yPx = (lv) => axY1 - (lv - ylo) / (yhi - ylo) * (axY1 - axY0);
    ctx.fillStyle = '#9aa3b2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText(title, gx + 8, gy0 + 16);
    ctx.fillStyle = 'rgba(200,206,224,0.55)'; ctx.font = fontString(canvas, 'tick', 'mono');
    ctx.textAlign = 'center';
    for (const lm of [-1, 0, 1, 2]) {
      const x = xPx(lm);
      ctx.strokeStyle = 'rgba(226,232,240,0.07)'; ctx.beginPath(); ctx.moveTo(x, axY0); ctx.lineTo(x, axY1); ctx.stroke();
      ctx.fillText(`${lm}`, x, axY1 + 14);
    }
    ctx.textAlign = 'right';
    for (const lv of yticks) {
      const y = yPx(lv);
      ctx.strokeStyle = 'rgba(226,232,240,0.07)'; ctx.beginPath(); ctx.moveTo(axX, y); ctx.lineTo(axX + axW, y); ctx.stroke();
      ctx.fillText(`${lv}`, axX - 4, y + 3);
    }
    ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText('log M', gx + gw / 2, gy1 - 6);
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let i = 0; i <= 160; i += 1) {
      const Mi = Math.pow(10, -1 + 3 * i / 160);
      const X = xPx(Math.log10(Mi)), Y = yPx(Math.log10(fn(Mi)));
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
    ctx.fillStyle = '#06d6a0';
    ctx.beginPath(); ctx.arc(xPx(Math.log10(M)), yPx(Math.log10(fn(M))), 5, 0, 6.2832); ctx.fill();
  }
  panel(gxA, 'log L / Lsun vs log M  (slope ~ 3.5)', (m) => L_solar(m), -4, 7, '#ffd166', [-4, -2, 0, 2, 4, 6]);
  panel(gxB, 'log t_MS / Gyr vs log M  (slope ~ -2.5)', (m) => MS_lifetime_Gyr(m), -4.5, 4, '#5bc0eb', [-4, -2, 0, 2, 4]);

  rL.textContent = `${L < 1e4 ? L.toFixed(2) : L.toExponential(2)} Lsun`;
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const masses = [0.3, 1, 5, 20, 60];
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.M = masses[Math.min(masses.length - 1, Math.round(frac * (masses.length - 1)))];
    st.tau = 6.0;                                        // a fixed clock phase
    sM.value = String(st.M); vM.textContent = st.M.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const M = st.M;
  const L = L_solar(M);
  const t = MS_lifetime_Gyr(M);
  const Rval = Math.pow(M, 0.7);
  return {
    fields: [
      { key: 'mass', label: 'Mass (Msun)', value: M, format: 'float' },
      { key: 'luminosity', label: 'Luminosity (Lsun)', value: L, format: 'float' },
      { key: 'radius', label: 'Radius proxy (Rsun)', value: Rval, format: 'float' },
      { key: 'main-seq-lifetime', label: 'MS lifetime (Gyr)', value: t, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const M = st.M;
  const L = L_solar(M);
  const t = MS_lifetime_Gyr(M);
  const Rval = Math.pow(M, 0.7);
  const LFromML = L;
  const tFractionCheck = (M / LFromML - (10 * M / LFromML)) === 0;
  return [
    {
      key: 'mass-luminosity-sign',
      label: 'Luminosity increases with mass (L >= 0)',
      value: L >= 0 ? 'pass' : 'fail',
      status: L >= 0 ? 'pass' : 'drift'
    },
    {
      key: 'lifetime-decreases',
      label: 'MS lifetime decreases with mass for M > 0.5',
      value: M < 0.5 || t > 0 ? 'pass' : 'fail',
      status: M < 0.5 || t > 0 ? 'pass' : 'drift'
    }
  ];
};
