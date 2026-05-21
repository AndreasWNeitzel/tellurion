// Lin-Shu density waves and the Toomre criterion, shown as the disk
// itself. A differentially-rotating face-on disk of stars carries a
// two-armed density wave. Where the dispersion relation
// (omega - m Omega)^2 = kappa^2 - 2 pi G Sigma |k| + k^2 sigma^2 has a
// negative minimum (Q = sigma kappa / (pi G Sigma) < 1) the wave grows
// at rate sqrt(-nu^2_min) and the disk fragments into spiral clumps;
// for Q > 1 it shears away and the disk stays smooth. The nu^2(k)
// curve is the demoted diagnostic. sim.js is unchanged. Reference:
// Binney and Tremaine, Galactic Dynamics (2nd ed.), Ch. 6.
import { nuSquared, ToomreQ, kCrit } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rQ = document.getElementById('readout-q');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const sK = document.getElementById('slider-k'), vK = document.getElementById('value-k');
const sG = document.getElementById('slider-G'), vG = document.getElementById('value-G');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const st = { sigma: 1.5, kappa: 1.5, GSig: 3, t: 0 };
let running = !prefersReducedMotion();
const CX = 250, CY = 250, RIN = 36, ROUT = 196;
const N = 2200;

// seeded disk: particle base radius + angle, fixed
let _s = 0x1234;
function rnd() { _s = (Math.imul(_s, 1664525) + 1013904223) >>> 0; return _s / 4294967296; }
const part = [];
function seedDisk() { _s = 0x1234; part.length = 0; for (let i = 0; i < N; i += 1) { const u = rnd(); const r = RIN + (ROUT - RIN) * Math.sqrt(u); part.push({ r, th: rnd() * 6.2832 }); } }
seedDisk();

sS.addEventListener('input', () => { st.sigma = parseFloat(sS.value); vS.textContent = st.sigma.toFixed(2); });
sK.addEventListener('input', () => { st.kappa = parseFloat(sK.value); vK.textContent = st.kappa.toFixed(2); });
sG.addEventListener('input', () => { st.GSig = parseFloat(sG.value); vG.textContent = st.GSig.toFixed(2); });
btnR.addEventListener('click', () => { st.sigma = 1.5; st.kappa = 1.5; st.GSig = 3; st.t = 0; sS.value = '1.5'; vS.textContent = '1.50'; sK.value = '1.5'; vK.textContent = '1.50'; sG.value = '3'; vG.textContent = '3.00'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Track Q state changes so the growth clock resets each time the disc
// crosses into the unstable regime. Without this the user saw the
// arms 'instantly spawn' when Q is dropped below 1 after the sim has
// been running, because the exponential growth was already saturated;
// physically the arms grow from a seed perturbation on timescale
// 1/gamma each time Q becomes < 1.
let lastStable = true, tUnstable = 0;
function render() {
  if (!CAPTURE_NAME && running) st.t += 0.02;
  ctx.fillStyle = '#070810'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '16px sans-serif';
  ctx.fillText('Toomre Q decides it: below 1 the disk fragments into spiral arms', 18, 26);

  const GS = st.GSig / (2 * Math.PI);
  const Q = ToomreQ(st.sigma, st.kappa, GS);
  // minimum of nu^2 over k -> growth rate sqrt(-nu2min); argmin -> k*
  let nu2min = Infinity, kStar = 0.5;
  for (let kk = 0.05; kk <= 6; kk += 0.02) { const v = nuSquared(kk, st.kappa, st.sigma, GS); if (v < nu2min) { nu2min = v; kStar = kk; } }
  const gamma = Math.sqrt(Math.max(0, -nu2min));

  // State machine on Q crossing 1: when entering the unstable regime,
  // restart the growth clock so the user sees the arms grow over
  // ~1/gamma rather than appearing already-saturated.
  if (Q < 1 && lastStable) { tUnstable = 0; }
  if (Q < 1 && running) tUnstable += 0.02;
  lastStable = (Q >= 1);

  // Use TWO time clocks: st.t is the always-running wall clock that
  // drives both disc rotation AND the perturbation phase oscillation,
  // tUnstable is the growth clock that only advances when the disc
  // is unstable. Previously both were tied to tUnstable, so in the
  // stable regime the entire scene froze; in reality, a stable disc
  // still rotates and still shows an oscillating (non-growing) wake.
  const tRot = st.t;
  const tt = tUnstable;
  const ampU = 0.95 * (1 - Math.exp(-gamma * tt * 1.1));   // physical e-fold ~ 1/gamma
  // Stable: small oscillating amplitude (sheared transient); unstable:
  // grows exponentially toward saturation.
  const ampStableOsc = 0.08 * (0.5 + 0.5 * Math.cos(0.6 * tRot));
  const amp = Q < 1 ? Math.min(1.05, ampU) : ampStableOsc;
  const mArms = 2;
  const pitch = 1.7;

  for (let i = 0; i < N; i += 1) {
    const p = part[i];
    const Om = 0.9 / p.r * 90;                            // flat-Vc => Omega ~ 1/r
    const th0 = p.th + Om * tRot * 0.6;
    const phase = mArms * th0 - pitch * Math.log(p.r / RIN) - st.kappa * tRot * 0.2;
    const th = th0 + (amp / mArms) * Math.sin(phase);
    const rr = p.r * (1 + 0.05 * amp * Math.cos(phase));
    const x = CX + rr * Math.cos(th), y = CY + rr * Math.sin(th);
    if (x < 24 || x > 476 || y < 40 || y > 470) continue;
    const comp = 0.5 + 0.5 * Math.cos(phase);             // bright on the crest
    const a = 0.22 + 0.7 * (Q < 1 ? comp : 0.4);
    ctx.fillStyle = `rgba(${(160 + 80 * comp) | 0},${(190 + 45 * comp) | 0},255,${a.toFixed(3)})`;
    ctx.fillRect(x, y, 2.0, 2.0);
  }
  // galactic centre
  ctx.fillStyle = 'rgba(255,220,150,0.9)'; ctx.beginPath(); ctx.arc(CX, CY, 5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = Q < 1 ? '#ef476f' : '#06d6a0'; ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(Q < 1 ? `UNSTABLE  Q = ${Q.toFixed(2)} < 1  (growing spiral, rate ${gamma.toFixed(2)})`
    : `STABLE  Q = ${Q.toFixed(2)} > 1  (perturbation shears away)`, 26, 470);

  // diagnostic: nu^2(k) dispersion curve with the unstable band
  const dx = 500, dy = 70, dw = canvas.width - dx - 24, dh = 360;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx, dy, dw, dh);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);
  ctx.fillStyle = '#64748b'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('dispersion nu^2(k)  (diagnostic)', dx + 8, dy + 16);
  const kMax = 6, y0 = -6, y1 = 12;
  const xPk = (k) => dx + 10 + k / kMax * (dw - 20);
  const yPk = (v) => dy + dh - 14 - (v - y0) / (y1 - y0) * (dh - 36);
  ctx.strokeStyle = 'rgba(120,130,150,0.4)'; ctx.beginPath(); ctx.moveTo(dx + 10, yPk(0)); ctx.lineTo(dx + dw - 10, yPk(0)); ctx.stroke();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 160; i += 1) {
    const k = i / 160 * kMax, v = Math.max(y0, Math.min(y1, nuSquared(k, st.kappa, st.sigma, GS)));
    if (i === 0) ctx.moveTo(xPk(k), yPk(v)); else ctx.lineTo(xPk(k), yPk(v));
  }
  ctx.stroke();
  if (nu2min < 0) {
    ctx.fillStyle = 'rgba(239,71,111,0.16)';
    ctx.fillRect(dx + 10, yPk(0), dw - 20, dy + dh - 14 - yPk(0));
    ctx.strokeStyle = 'rgba(239,71,111,0.7)'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xPk(kStar), dy + 18); ctx.lineTo(xPk(kStar), dy + dh - 14); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ef476f'; ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`k* = ${kStar.toFixed(2)}`, xPk(kStar) + 4, dy + 30);
  }
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('k', dx + dw - 16, dy + dh - 2); ctx.fillText('nu^2', dx + 6, dy + 28);
  ctx.fillText(`k_crit(cs=0) = ${kCrit(st.kappa, GS).toFixed(2)}`, dx + 8, dy + dh - 4);

  rQ.textContent = Q.toFixed(2);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    // sweep sigma so Q crosses 1 (unstable clumpy -> stable smooth)
    const sig = [0.4, 0.8, 1.2, 2.0, 3.2];
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.sigma = sig[Math.min(sig.length - 1, Math.round(frac * (sig.length - 1)))];
    st.t = 9.0;                                         // evolved state
    sS.value = String(st.sigma); vS.textContent = st.sigma.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
