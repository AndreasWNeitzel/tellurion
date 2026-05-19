// Chandrasekhar dynamical friction, shown as the thing it actually
// does: a massive perturber sweeping through a sea of light stars
// gravitationally focuses them into a trailing wake, and the pull of
// that wake drags it back so its orbit decays and it sinks to the
// centre. The background is a small live N-body so the wake forms on
// its own; the deceleration magnitude is the Chandrasekhar formula
// from sim.frictionMag (unchanged, gate-tested). The |a_df| vs v/sigma
// curve is the demoted diagnostic. Reference: Binney and Tremaine,
// Galactic Dynamics (2nd ed.), Ch. 8.
import { frictionMag } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rA = document.getElementById('readout-a');
const sV = document.getElementById('slider-v'), vV = document.getElementById('value-v');
const sM = document.getElementById('slider-M'), vM = document.getElementById('value-M');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const CX = 250, CY = 250;                  // host-galaxy centre (px)
const V0 = 1.7;                            // flat rotation speed (sim units)
const SIGMA = 1.3;                         // background dispersion (sim units)
const M_SUN = 1.989e30, SIG_PHYS = 200e3, RHO = 1e-21;
const st = { v0: 1.5, logM: 8, t: 0 };
let running = true;

// background sea: live particles on near-circular host orbits
const NB = 1500;
let _s = 0x2F1D;
function rnd() { _s = (Math.imul(_s, 1664525) + 1013904223) >>> 0; return _s / 4294967296; }
let bg = [];
function seedBg() {
  _s = 0x2F1D; bg = [];
  for (let i = 0; i < NB; i += 1) {
    const r = 26 + 188 * Math.sqrt(rnd()), a = rnd() * 6.2832;
    const vc = V0;                         // flat Vc
    bg.push({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a),
      vx: -vc * Math.sin(a) + (rnd() - 0.5) * SIGMA, vy: vc * Math.cos(a) + (rnd() - 0.5) * SIGMA });
  }
}
let P;
function resetSim() {
  seedBg();
  // near-circular orbit that decays under dynamical friction: state
  // is (r, phi); flat-Vc so the orbital speed stays ~V0.
  P = { r: 195, phi: 0, x: CX + 195, y: CY, trail: [] };
  st.t = 0;
}

sV.addEventListener('input', () => { st.v0 = parseFloat(sV.value); vV.textContent = st.v0.toFixed(2); resetSim(); });
sM.addEventListener('input', () => { st.logM = parseFloat(sM.value); vM.textContent = st.logM.toFixed(1); });
btnR.addEventListener('click', () => { st.v0 = 1.5; st.logM = 8; sV.value = '1.5'; vV.textContent = '1.50'; sM.value = '8'; vM.textContent = '8.0'; resetSim(); running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
resetSim();

// host central acceleration for a flat rotation curve: |a| = V0^2 / r
function hostAcc(x, y) {
  const dx = x - CX, dy = y - CY, r = Math.hypot(dx, dy);
  const rc = Math.max(14, r);                            // softened core
  const a = V0 * V0 / rc;
  return [-a * dx / rc, -a * dy / rc];
}
// Friction deceleration (sim units). sim.frictionMag supplies the
// VELOCITY SHAPE (M and the constant prefactor cancel in the ratio,
// leaving the Chandrasekhar bracket that peaks near v ~ sigma); the
// magnitude is a small bounded log-mass term so the perturber always
// inspirals gently over the loop instead of being flung out.
function fShape(speed) {
  const M = Math.pow(10, st.logM) * M_SUN;
  const vP = Math.max(1, (speed / V0) * 1.5 * SIG_PHYS);
  return frictionMag(vP, M, RHO, SIG_PHYS) / frictionMag(SIG_PHYS, M, RHO, SIG_PHYS);
}
// Friction strength spans orders of magnitude with M (the sinking
// time scales as 1/M), so a 1e11 perturber plunges in while a 1e5
// one barely moves over the same window.
function dfK() { return 0.06 * Math.pow(10, (st.logM - 8) / 3); }

function step(dt) {
  // Circular-orbit inspiral (Binney and Tremaine Sec. 8.1): the
  // orbital speed stays ~V0 (flat Vc), and dynamical friction drains
  // angular momentum so the radius shrinks at a rate that scales with
  // M (the f(X) shape comes from sim.frictionMag). dr/dt ~ -k/r.
  P.phi += (V0 / Math.max(14, P.r)) * dt;
  const decay = dfK() * fShape(V0) * 340 / Math.max(20, P.r);
  P.r = Math.max(13, P.r - decay * dt);
  P.x = CX + P.r * Math.cos(P.phi);
  P.y = CY + P.r * Math.sin(P.phi);
  // background: host orbit + a gentle softened pull (the wake);
  // particles that leave respawn on a fresh host orbit so the sea
  // stays populated and the trailing overdensity is steady
  const Mp = 4.5;
  for (const b of bg) {
    const [hx, hy] = hostAcc(b.x, b.y);
    const dx = P.x - b.x, dy = P.y - b.y, d2 = dx * dx + dy * dy + 360;
    const g = Mp / (d2 * Math.sqrt(d2));
    b.vx += (hx + g * dx) * dt; b.vy += (hy + g * dy) * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    const rr = Math.hypot(b.x - CX, b.y - CY);
    if (rr < 20 || rr > 220) {
      const r = 26 + 188 * Math.sqrt(rnd()), a = rnd() * 6.2832;
      b.x = CX + r * Math.cos(a); b.y = CY + r * Math.sin(a);
      b.vx = -V0 * Math.sin(a) + (rnd() - 0.5) * SIGMA;
      b.vy = V0 * Math.cos(a) + (rnd() - 0.5) * SIGMA;
    }
  }
}

function render() {
  if (!CAPTURE_NAME && running) { for (let k = 0; k < 6; k += 1) step(0.16); st.t += 1; P.trail.push([P.x, P.y]); if (P.trail.length > 240) P.trail.shift(); }
  ctx.fillStyle = '#070810'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '16px sans-serif';
  ctx.fillText('A heavy body drags a wake of stars behind it, and the wake pulls it down', 18, 26);

  // background sea, brighter where compressed near/behind the perturber
  for (const b of bg) {
    if (b.x < 18 || b.x > 482 || b.y < 40 || b.y > 470) continue;
    const dx = b.x - P.x, dy = b.y - P.y, d = Math.hypot(dx, dy);
    const near = Math.max(0, 1 - d / 70);
    ctx.fillStyle = `rgba(${(150 + 90 * near) | 0},${(170 + 60 * near) | 0},255,${(0.22 + 0.6 * near).toFixed(3)})`;
    ctx.fillRect(b.x, b.y, near > 0.3 ? 2.2 : 1.5, near > 0.3 ? 2.2 : 1.5);
  }
  // galactic centre
  ctx.fillStyle = 'rgba(255,220,150,0.55)'; ctx.beginPath(); ctx.arc(CX, CY, 6, 0, 6.2832); ctx.fill();
  // perturber inspiral trail
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < P.trail.length; i += 1) { const [tx, ty] = P.trail[i]; if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty); }
  ctx.stroke();
  // the perturber
  const pg = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, 16);
  pg.addColorStop(0, '#ffd166'); pg.addColorStop(1, 'rgba(255,209,102,0)');
  ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(P.x, P.y, 16, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(P.x, P.y, 5.5, 0, 6.2832); ctx.fill();

  const rOrb = P.r;
  const vsig = V0 / SIGMA;                               // flat Vc: speed ~ V0
  ctx.fillStyle = '#94a3b8'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`M = 10^${st.logM.toFixed(1)} Msun    orbit r = ${(rOrb / 195 * 10).toFixed(1)} kpc    v/sigma = ${vsig.toFixed(2)}`, 26, 466);

  // diagnostic: |a_df| vs v/sigma with the perturber's marker
  const dx0 = 500, dy0 = 70, dw = canvas.width - dx0 - 24, dh = 360;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx0, dy0, dw, dh);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx0 + 0.5, dy0 + 0.5, dw - 1, dh - 1);
  ctx.fillStyle = '#64748b'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Chandrasekhar |a_df|(v/sigma)  (diagnostic)', dx0 + 8, dy0 + 16);
  const M = Math.pow(10, st.logM) * M_SUN;
  let mx = 1e-30; const vmax = 5;
  for (let i = 1; i <= 120; i += 1) { const x = i / 120 * vmax; mx = Math.max(mx, frictionMag(x * SIG_PHYS, M, RHO, SIG_PHYS)); }
  const xPk = (x) => dx0 + 12 + x / vmax * (dw - 24);
  const yPk = (f) => dy0 + dh - 16 - f / mx * (dh - 40);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 1; i <= 120; i += 1) {
    const x = i / 120 * vmax, f = frictionMag(x * SIG_PHYS, M, RHO, SIG_PHYS);
    if (i === 1) ctx.moveTo(xPk(x), yPk(f)); else ctx.lineTo(xPk(x), yPk(f));
  }
  ctx.stroke();
  const fcur = frictionMag(Math.max(1, vsig * SIG_PHYS), M, RHO, SIG_PHYS);
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xPk(Math.min(vmax, vsig)), yPk(Math.min(mx, fcur)), 5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#94a3b8'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('peaks near v ~ sigma', dx0 + 10, dy0 + dh - 6);
  ctx.fillText('v/sigma', dx0 + dw - 50, dy0 + dh - 6);

  rA.textContent = fcur.toExponential(2) + ' m/s^2';
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const Ms = [5, 7, 8.5, 10, 11.5];
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.logM = Ms[Math.min(Ms.length - 1, Math.round(frac * (Ms.length - 1)))];
    sM.value = String(st.logM); vM.textContent = st.logM.toFixed(1);
    resetSim();
    for (let s = 0; s < 430; s += 1) { step(0.16); if (s % 5 === 0) { P.trail.push([P.x, P.y]); if (P.trail.length > 260) P.trail.shift(); } }
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
