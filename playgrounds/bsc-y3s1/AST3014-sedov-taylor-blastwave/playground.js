// Sedov-Taylor blast wave, shown as the supernova remnant it is. A
// point explosion of energy E in an ambient medium of density rho1
// drives a spherical shock that sweeps the interstellar gas into a
// thin dense shell (post-shock compression rho2/rho1 = 4 for
// gamma=5/3) and self-similarly decelerates, R(t) = xi (E t^2 /
// rho1)^(1/5), v_s = (2/5) R/t. More energy or thinner gas -> a
// bigger, faster remnant. The log R vs log t panel (slope 2/5) is
// the demoted diagnostic. sim.js (shockRadius / shockSpeed /
// postShockDensity) is unchanged. Reference: Shu, The Physics of
// Astrophysics Vol. II, Ch. 17.
import { shockRadius, shockSpeed, postShockDensity } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sE = document.getElementById('slider-E'), vE = document.getElementById('value-E');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const st = { logE: 51, logn: 0, t: 0 };
let running = !prefersReducedMotion();
const CX = W / 2, CY = 338, RMAX = 300;       // remnant centre + max px radius
const PC = 3.086e16, YR = 3.155e7, WIN_PC = 16;

// seeded ambient ISM: base radius (px from centre) + angle
let _s = 0x51D0;
function rnd() { _s = (Math.imul(_s, 1664525) + 1013904223) >>> 0; return _s / 4294967296; }
const amb = [];
for (let i = 0; i < 1700; i += 1) amb.push({ rb: 8 + RMAX * 1.18 * Math.sqrt(rnd()), a: rnd() * 6.2832, j: rnd() });

sE.addEventListener('input', () => { st.logE = parseFloat(sE.value); vE.textContent = st.logE.toFixed(2); });
sN.addEventListener('input', () => { st.logn = parseFloat(sN.value); vN.textContent = st.logn.toFixed(2); });
btnR.addEventListener('click', () => { st.logE = 51; st.logn = 0; st.t = 0; sE.value = '51'; vE.textContent = '51.00'; sN.value = '0'; vN.textContent = '0.00'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function render() {
  if (!CAPTURE_NAME && running) st.t += 0.03;
  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('A supernova sweeps interstellar gas into a decelerating shell', 18, 26);

  const E = Math.pow(10, st.logE) * 1e-7;            // erg -> J
  const rho1 = Math.pow(10, st.logn) * 1.66e-27 * 1.4 * 1e6;
  const tcyc = 0.5 + (st.t % 9) * 1200 * YR;          // loop the expansion
  const Rphys = shockRadius(E, tcyc, rho1);
  const vs = shockSpeed(E, tcyc, rho1);
  const Rpx = Math.max(2, Math.min(RMAX, Rphys / (WIN_PC * PC) * RMAX));
  const shellTh = Math.max(3, Rpx * 0.07);            // thin dense shell
  // colour cools (white-blue -> orange -> deep red) as the shock slows
  const sp = Math.max(0, Math.min(1, vs / 6e6));
  const shellCol = `rgb(${255},${(120 + 110 * sp) | 0},${(60 + 170 * sp) | 0})`;

  // hot rarefied interior (Sedov interior is hot, low density)
  const ig = ctx.createRadialGradient(CX, CY, 0, CX, CY, Rpx);
  ig.addColorStop(0, 'rgba(120,90,200,0.18)'); ig.addColorStop(0.7, 'rgba(180,90,80,0.10)'); ig.addColorStop(1, 'rgba(255,180,120,0.05)');
  ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(CX, CY, Rpx, 0, 6.2832); ctx.fill();

  // ambient ISM + the swept-up shell: a particle inside R is swept to
  // the shell (mass conservation made visible); outside it is pristine
  for (const p of amb) {
    let r, br, col;
    if (p.rb < Rpx) {
      r = Rpx - shellTh * (0.15 + 0.8 * p.j);          // packed into the shell
      br = 0.45 + 0.5 * p.j; col = shellCol;
    } else {
      r = p.rb; br = 0.12 + 0.10 * p.j; col = 'rgb(150,165,200)';
    }
    const x = CX + r * Math.cos(p.a), y = CY + r * Math.sin(p.a);
    if (x < 16 || x > W - 16 || y < 36 || y > 666) continue;
    ctx.globalAlpha = br; ctx.fillStyle = col;
    ctx.fillRect(x, y, 1.8, 1.8);
  }
  ctx.globalAlpha = 1;
  // the shock front itself
  ctx.strokeStyle = shellCol; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(CX, CY, Rpx, 0, 6.2832); ctx.stroke();
  const gl = ctx.createRadialGradient(CX, CY, Rpx, CX, CY, Rpx + 14);
  gl.addColorStop(0, shellCol.replace('rgb', 'rgba').replace(')', ',0.35)'));
  gl.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.strokeStyle = gl; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(CX, CY, Rpx + 7, 0, 6.2832); ctx.stroke(); ctx.lineWidth = 1;
  // explosion site
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(CX, CY, 3, 0, 6.2832); ctx.fill();

  ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`E = 10^${st.logE.toFixed(1)} erg   n = 10^${st.logn.toFixed(1)} cm^-3`, 18, 50);
  ctx.fillText(`R = ${(Rphys / PC).toFixed(1)} pc   v_s = ${(vs / 1e3).toFixed(0)} km/s   t = ${(tcyc / YR / 1e3).toFixed(1)} kyr`, 18, 68);
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`R proportional to (E/rho) ^1/5 t^2/5    shell compression rho2/rho1 = ${postShockDensity(1)}`, 18, 700);

  // diagnostic: log R vs log t, the self-similar 2/5 slope
  const dx0 = 60, dx1 = W - 30, dy0 = 716, dy1 = H - 18;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx0 + 0.5, dy0 + 0.5, dx1 - dx0 - 1, dy1 - dy0 - 1);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('diagnostic: log R vs log t  (slope 2/5)', dx0 + 8, dy0 + 13);
  const t0 = 200 * YR, t1 = 1.2e4 * YR;
  const lr = (tt) => Math.log10(shockRadius(E, tt, rho1) / PC);
  const lrMin = lr(t0), lrMax = lr(t1);
  const xP = (tt) => dx0 + 10 + (Math.log10(tt) - Math.log10(t0)) / (Math.log10(t1) - Math.log10(t0)) * (dx1 - dx0 - 20);
  const yP = (lrv) => dy1 - 8 - (lrv - lrMin) / (lrMax - lrMin + 1e-9) * (dy1 - dy0 - 26);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= 60; i += 1) { const tt = t0 * Math.pow(t1 / t0, i / 60); const p = { x: xP(tt), y: yP(lr(tt)) }; i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
  ctx.stroke();
  const tc = Math.max(t0, Math.min(t1, tcyc));
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xP(tc), yP(lr(tc)), 4, 0, 6.2832); ctx.fill();

  rR.textContent = `${(Rphys / PC).toFixed(1)} pc`;
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.t = 0.6 + frac * 8.0;                            // young -> old remnant
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const t = st.t;
  const E = Math.pow(10, st.logE);
  const rho0 = Math.pow(10, st.logn);
  const Rs = shockRadius(E, rho0, t);
  const Vs = shockSpeed(E, rho0, t);
  const rho_post = postShockDensity(rho0);
  return {
    fields: [
      { key: 'time', label: 'Simulation time t', value: t, format: 'float' },
      { key: 'shock-radius', label: 'Shock radius R', value: Rs, format: 'float' },
      { key: 'shock-speed', label: 'Shock speed v_s', value: Vs, format: 'float' },
      { key: 'post-shock-density', label: 'Post-shock density rho', value: rho_post, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const t = st.t;
  if (t < 1e-6) {
    return [{ key: 'state-init', label: 'Initializing', value: 'pending', status: 'pending' }];
  }
  const E = Math.pow(10, st.logE);
  const rho0 = Math.pow(10, st.logn);
  const Rs = shockRadius(E, rho0, t);
  const R_expect_t = Math.pow(E / rho0, 0.2) * Math.pow(t, 0.4);
  const rel_err = Math.abs(Rs - R_expect_t) / Math.max(Math.abs(R_expect_t), 1e-9);
  return [
    {
      key: 'sedov-taylor-scaling',
      label: 'Shock radius R ~ t^(2/5)',
      value: rel_err.toExponential(2),
      status: rel_err < 0.05 ? 'pass' : 'drift'
    }
  ];
};
