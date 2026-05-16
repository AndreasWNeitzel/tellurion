// Mixing-length convection as a live stellar cross-section. The star has
// a permanently radiative core; the envelope switches transport
// mechanism on the Schwarzschild criterion (nabla - nabla_ad > 0 ->
// convective). Convection is drawn as discrete buoyant plumes that
// detach from the core, rise exactly one mixing length l_m = alpha * H_p
// while expanding and cooling, then dissolve and mix, with cool
// downflows in the lanes between. That travel-then-mix step is the
// closure assumption of mixing-length theory itself, so the alpha slider
// visibly sets how far a blob carries its heat. Below the criterion the
// envelope is radiative and energy crawls outward by a photon random
// walk (isotropic short steps, slow net drift), the canonical picture of
// radiative diffusion. The photospheric granulation ring is the
// observable top of the convection zone.
// Reference: Kippenhahn, Weigert and Weiss, Stellar Structure and
// Evolution, 2nd ed., Ch. 6-7; Hansen and Kawaler, Stellar Interiors,
// Ch. 5.

import { schwarzschild, vConv } from './sim.js';
import { makeRng } from '../../../shared/js/render/rng.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rR = document.getElementById('readout-r');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const st = { dnabla: 0.05, alpha: 1.7, t: 0 }; let running = true;
let last = performance.now();

// Seeded per-element phases so plumes and photons are spread out yet the
// render stays a pure function of st.t (capture-deterministic).
const NPLUME = 64;        // pool; only the first nActive are drawn
const NPHOT = 520;
const plPhase = new Float32Array(NPLUME);
const plAng = new Float32Array(NPLUME);
const plJit = new Float32Array(NPLUME);
const phBase = new Float32Array(NPHOT);
const phF1 = new Float32Array(NPHOT), phF2 = new Float32Array(NPHOT);
const phP1 = new Float32Array(NPHOT), phP2 = new Float32Array(NPHOT);
const phSpd = new Float32Array(NPHOT), phOff = new Float32Array(NPHOT);
function seed() {
  const rng = makeRng(0xC0FFEE);
  for (let i = 0; i < NPLUME; i += 1) {
    plPhase[i] = rng(); plAng[i] = rng(); plJit[i] = rng() - 0.5;
  }
  for (let i = 0; i < NPHOT; i += 1) {
    phBase[i] = 2 * Math.PI * rng();
    phF1[i] = 1.4 + 3.6 * rng(); phF2[i] = 3.0 + 6.0 * rng();
    phP1[i] = 2 * Math.PI * rng(); phP2[i] = 2 * Math.PI * rng();
    phSpd[i] = 0.55 + 0.9 * rng(); phOff[i] = rng();
  }
}
seed();

sN.addEventListener('input', () => { st.dnabla = parseFloat(sN.value); vN.textContent = st.dnabla.toFixed(2); render(); });
sA.addEventListener('input', () => { st.alpha = parseFloat(sA.value); vA.textContent = st.alpha.toFixed(2); render(); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); render(); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

// Hot-to-cool blackbody-like ramp for a rising element as it expands and
// loses its temperature excess over the mixing length (frac 0 -> 1).
function plumeColor(frac, a) {
  const r = 255;
  const g = Math.round(255 - 150 * frac);
  const b = Math.round(210 - 200 * frac);
  return `rgba(${r},${Math.max(60, g)},${Math.max(20, b)},${a})`;
}

function drawBlob(x, y, rad, col) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, col);
  g.addColorStop(0.55, col.replace(/[\d.]+\)$/, '0.35)'));
  g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, rad, 0, 2 * Math.PI); ctx.fill();
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#040407'; ctx.fillRect(0, 0, W, H);
  const cx = W * 0.42, cy = H * 0.5, R = Math.min(W * 0.42, H * 0.46);
  const Rc = 0.40 * R;                    // radiative core radius
  const conv = st.dnabla > 0;             // Schwarzschild unstable
  // MLT: convective speed grows as sqrt of the superadiabatic excess.
  const vc = conv ? vConv(1e3, st.dnabla * 1e6, 1e7, st.alpha * 1e8) : 0;
  const vRise = conv ? 0.10 + 0.55 * Math.sqrt(st.dnabla) : 0;
  // Mixing length as a fraction of the envelope thickness: l_m grows
  // with alpha. A blob conserves its heat over exactly this distance.
  const lmFrac = Math.min(0.97, Math.max(0.16, 0.34 * st.alpha));
  const lm = lmFrac * (R - Rc);
  // Bigger eddies (larger alpha) means fewer, wider plumes.
  const nActive = Math.max(7, Math.min(NPLUME, Math.round(34 / st.alpha)));

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.clip();

  // Radiative core: always present, smooth and hot.
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rc);
  core.addColorStop(0, '#fff6d8'); core.addColorStop(0.55, '#ffc15a'); core.addColorStop(1, '#c2641f');
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, Rc, 0, 2 * Math.PI); ctx.fill();

  if (conv) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < nActive; i += 1) {
      const a = (i / nActive) * 2 * Math.PI + 0.35 * plAng[i];
      // Closed-form rise so capture at any t reproduces: travel one
      // mixing length, then a fresh blob detaches (mod cycle).
      const cyc = (st.t * vRise + plPhase[i]) % 1;
      const rr = Rc + cyc * lm;
      const frac = cyc;
      const wob = 0.05 * lm * Math.sin(6 * cyc + 9 * plJit[i]);
      const ang = a + wob / Math.max(1, rr) + 0.15 * plJit[i] * Math.sin(2 * st.t + i);
      const x = cx + rr * Math.cos(ang), y = cy + rr * Math.sin(ang);
      const rad = (0.10 + 0.16 * st.alpha) * (R - Rc) * (0.45 + 0.85 * frac);
      const fade = Math.sin(Math.PI * Math.min(1, cyc)) ** 0.6;   // grow then dissolve
      drawBlob(x, y, rad, plumeColor(frac, 0.85 * fade));
      // Cool downflow in the lane trailing the rising blob.
      const dx = cx + (Rc + (1 - cyc) * lm) * Math.cos(a + Math.PI / nActive);
      const dy = cy + (Rc + (1 - cyc) * lm) * Math.sin(a + Math.PI / nActive);
      drawBlob(dx, dy, rad * 0.7, `rgba(70,120,205,${0.32 * fade})`);
    }
    ctx.globalCompositeOperation = 'source-over';
    // Photospheric granulation: bright cells, dark intergranular lanes,
    // slowly reshuffling. This is the observable top of the zone.
    const gran = Math.max(10, Math.round(40 / st.alpha));
    for (let i = 0; i < gran; i += 1) {
      const a0 = (i / gran) * 2 * Math.PI;
      const tw = 0.5 + 0.5 * Math.sin(2.1 * st.t + i * 1.7 + plPhase[i % NPLUME] * 6);
      const rr = R - 0.045 * R + 0.012 * R * Math.sin(3 * st.t + i);
      const gx = cx + rr * Math.cos(a0), gy = cy + rr * Math.sin(a0);
      drawBlob(gx, gy, 0.052 * R, `rgba(255,${200 - 70 * tw | 0},${110 - 70 * tw | 0},${0.30 + 0.4 * tw})`);
    }
  } else {
    // Radiative envelope: a photon random walk. Each packet takes many
    // short isotropic steps with a slow net outward drift, the picture
    // of energy diffusing out over a very long time. A short fading
    // trail makes the walk legible even in a single frame; packets are
    // brighter near the core (just escaped, more energy) and dim toward
    // the surface, so the outward energy flow has a visible direction.
    const jit = 0.065 * (R - Rc);
    const pos = (i, tt) => {
      const drift = (tt * 0.018 * phSpd[i] + phOff[i]) % 1;
      const rr = Rc + drift * (R - Rc);
      const wx = Math.sin(phF1[i] * tt + phP1[i]) + 0.6 * Math.sin(phF2[i] * tt + phP2[i]);
      const wy = Math.cos(phF1[i] * tt * 0.9 + phP2[i]) + 0.6 * Math.cos(phF2[i] * tt + phP1[i]);
      return [cx + rr * Math.cos(phBase[i]) + jit * wx, cy + rr * Math.sin(phBase[i]) + jit * wy, drift];
    };
    for (let i = 0; i < NPHOT; i += 1) {
      const [x, y, drift] = pos(i, st.t);
      const energy = 1 - 0.6 * drift;                                // hotter near core
      for (let k = 2; k >= 1; k -= 1) {
        const [tx, ty] = pos(i, st.t - 0.06 * k);
        ctx.strokeStyle = `rgba(150,190,240,${0.05 * energy * (3 - k)})`;
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      }
      const fade = 0.20 + 0.55 * energy * Math.sin(Math.PI * drift) ** 0.4;
      ctx.fillStyle = `rgba(${175 + 50 * energy | 0},200,245,${fade})`;
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 2 * Math.PI); ctx.fill();
    }
    // Diffusion glow, very slowly breathing so the regime is not static.
    const pulse = 0.20 + 0.06 * Math.sin(0.5 * st.t);
    const gl = ctx.createRadialGradient(cx, cy, Rc, cx, cy, R);
    gl.addColorStop(0, `rgba(120,155,215,${pulse})`);
    gl.addColorStop(1, 'rgba(120,155,215,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
  }

  // Core boundary and limb-darkened photosphere.
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, Rc, 0, 2 * Math.PI); ctx.stroke();
  const limb = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R);
  limb.addColorStop(0, 'rgba(0,0,0,0)'); limb.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = limb; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,205,135,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, R - 1, 0, 2 * Math.PI); ctx.stroke();
  ctx.restore();

  // Mixing-length ruler: a radial bar of length l_m = alpha * H_p drawn
  // at the top so the alpha slider has a visible physical meaning.
  if (conv) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy - Rc); ctx.lineTo(cx, cy - Rc - lm); ctx.stroke();
    for (const yy of [cy - Rc, cy - Rc - lm]) { ctx.beginPath(); ctx.moveTo(cx - 5, yy); ctx.lineTo(cx + 5, yy); ctx.stroke(); }
    ctx.fillStyle = '#cfd3d8'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText('l_m = α·H_p', cx + 9, cy - Rc - lm / 2);
  }

  // Side annotation.
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  const reg = schwarzschild(0.5 + st.dnabla, 0.5);
  const tx = cx + R + 18;
  ctx.fillText(conv ? 'convective envelope' : 'radiative envelope', tx, cy - 78);
  ctx.fillText(conv ? '(buoyant plumes, MLT)' : '(photon random walk)', tx, cy - 60);
  ctx.fillText('radiative core', tx, cy - 38);
  ctx.fillText(`∇ − ∇_ad = ${st.dnabla.toFixed(2)}`, tx, cy - 8);
  ctx.fillText(`Schwarzschild: ${reg}`, tx, cy + 12);
  ctx.fillText(`α = l_m/H_p = ${st.alpha.toFixed(2)}`, tx, cy + 32);
  ctx.fillText(`v_conv ${conv ? '~ ' + vc.toExponential(1) + ' (MLT)' : '= 0 (stable)'}`, tx, cy + 52);
  ctx.fillStyle = '#9aa0a6';
  ctx.fillText('drag ∇−∇_ad below 0 to shut off convection (Schwarzschild stable)', 14, H - 14);
  rR.textContent = reg;
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) st.t += dt;
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) st.t = CAPTURE_FRAC * 12;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
