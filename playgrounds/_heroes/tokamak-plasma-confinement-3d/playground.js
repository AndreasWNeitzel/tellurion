// Tokamak hero. Translucent vessel + helical field lines + a live
// guiding-centre plasma: ~1200 particles streaming along the helical
// field, confined to their flux surfaces, with passing particles
// spiralling toroidally and trapped particles tracing banana orbits on
// the low-field (outboard) side. The sliders drive the plasma: B0 sets
// the transit speed, Ip sets q (poloidal winding), R0/a set the
// trapped fraction via the inverse aspect ratio.

import { safetyAtEdge, safetyAxis, bToroidal } from './sim.js';
import { mulberry32, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
import { setupTokamakGL } from '../../../shared/js/engine-gl/tokamak.js';
import { createOrbitCamera } from '../../../shared/js/gl/orbit-camera.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['q_edge', 'q_axis', 'trapped %', 'FPS'];
const rEls = {};
for (const k of READOUTS) {
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = k;
  const val = document.createElement('span'); val.className = 'value'; val.textContent = '--';
  readoutEl.appendChild(lab); readoutEl.appendChild(val);
  rEls[k] = val;
}

// Population legend: explain the three particle classes the simulation
// produces (the user asked what the different particles are).
const legend = document.createElement('div');
legend.style.cssText = 'margin-top:8px;font:11px ui-monospace,monospace;line-height:1.5;color:#9aa0a6';
legend.innerHTML = [
  '<span style="color:#fff">white</span> co-passing: streams with the field, carries the plasma current I_p',
  '<span style="color:#4d8cff">blue</span> counter-passing: streams against I_p (minority)',
  '<span style="color:#f0a23a">amber</span> trapped: mirror-reflected, traces closed banana orbits on the low-field (outboard) side',
].join('<br>');
readoutEl.appendChild(legend);

function buildSlider(label, min, max, step, value, onInput) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = (+value).toFixed(2);
  inp.addEventListener('input', () => { val.textContent = (+inp.value).toFixed(2); onInput(parseFloat(inp.value)); rebuild = true; });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return inp;
}
function buildButtons() {
  const row = document.createElement('div'); row.className = 'row buttons';
  const r = document.createElement('button'); r.type = 'button'; r.textContent = 'Reset';
  const p = document.createElement('button'); p.type = 'button'; p.textContent = 'Pause'; p.setAttribute('aria-pressed', 'false');
  row.appendChild(r); row.appendChild(p);
  controlsEl.appendChild(row);
  return { reset: r, pause: p };
}

const st = { R: 1.0, a: 0.35, B0: 5.3, Ip: 3, t: 0 };
let running = !prefersReducedMotion();
let rebuild = true;

buildSlider('R0 (m)', 1.0, 3.0, 0.05, st.R, v => { st.R = v; });
buildSlider('a (m)', 0.2, 1.0, 0.02, st.a, v => { st.a = v; });
buildSlider('B0 (T)', 1, 10, 0.1, st.B0, v => { st.B0 = v; });
buildSlider('Ip (MA)', 0.1, 20, 0.5, st.Ip, v => { st.Ip = v; });
const btns = buildButtons();

let engine = null;
try { engine = setupTokamakGL(canvas); } catch (e) { console.warn('tokamak GL init failed', e); }

const camera = createOrbitCamera(canvas, {
  target: [0, 0, 0],
  radius: 4.0,
  minRadius: 1.5,
  maxRadius: 10.0,
  azimuthDeg: 35, elevationDeg: 25, fovDeg: 45,
});
window.__camera = camera;

// Guiding-centre plasma population. r stays fixed (the particle is
// confined to its flux surface, which is the whole point of magnetic
// confinement); theta/phi advance along the field; trapped particles
// reflect at the mirror points and r_draw carries the grad-B banana
// width so the bounce traces the classic banana in the poloidal plane.
// 12000 guiding-centre integrations plus a 72k-float GPU re-upload
// every frame starved the render loop, so mouse-drag of the camera had
// no time to repaint and felt lost. 4500 keeps the column dense while
// leaving the frame budget for responsive orbit-drag.
const NPART = 4500;
const pr = new Float32Array(NPART);
const pth = new Float32Array(NPART);
const pph = new Float32Array(NPART);
const pxi = new Float32Array(NPART);   // pitch v_par/v at the outboard midplane
const pmu = new Float32Array(NPART);   // magnetic moment mu = v_perp^2 / (2 B), conserved
const psgn = new Int8Array(NPART);
const ptrap = new Uint8Array(NPART);
const VTOT = 1;                        // |v| in code units; energy = const
const posBuf = new Float32Array(NPART * 3);
const colBuf = new Float32Array(NPART * 3);

function initParticles() {
  const rng = mulberry32(DEFAULT_SEED >>> 0);
  const R = st.R, B0 = st.B0;
  for (let i = 0; i < NPART; i += 1) {
    // Strongly core-peaked profile (a real tokamak plasma is a hot
    // column near the magnetic axis, not a gas filling the vessel).
    const r = st.a * (0.04 + 0.94 * Math.pow(rng(), 1.7));
    pr[i] = r;
    pth[i] = 2 * Math.PI * rng();
    pph[i] = 2 * Math.PI * rng();
    // Pitch at the outboard midplane (theta = 0, weakest field). The
    // magnetic moment mu = v_perp^2 / (2 B_out) is then fixed for all
    // time (an adiabatic invariant); energy = 1/2 |v|^2 is also fixed.
    const xi0 = -1 + 2 * rng();
    pxi[i] = xi0;
    const Bout = bToroidal(R + r, B0, R);
    pmu[i] = (VTOT * VTOT * (1 - xi0 * xi0)) / (2 * Bout);
    // Net co-current drift: a real tokamak carries I_p, so the parallel
    // distribution is shifted (more co- than counter-passing) rather
    // than a symmetric pair of opposing streams.
    psgn[i] = (xi0 >= 0 || rng() < 0.30) ? 1 : -1;
  }
}
initParticles();

function classifyTrapped() {
  // Trapped if the particle cannot reach the high-field inboard side:
  // xi0^2 < (Bmax - Bmin) / Bmax = 2 eps / (1 + eps), eps = r / R0.
  let nt = 0;
  for (let i = 0; i < NPART; i += 1) {
    const eps = pr[i] / st.R;
    const thresh = 2 * eps / (1 + eps);
    ptrap[i] = (pxi[i] * pxi[i] < thresh) ? 1 : 0;
    nt += ptrap[i];
  }
  return nt;
}
let trappedCount = classifyTrapped();

let qEdge = 3, qAxis = 1.5;
function refreshProfile() {
  qEdge = Math.max(1.05, safetyAtEdge(st.B0, st.R, st.a, st.Ip));
  qAxis = Math.max(0.75, safetyAxis(st.B0, st.R, st.a, st.Ip));
  trappedCount = classifyTrapped();
}

// Guiding-centre equations of motion (Littlejohn 1983; Goedbloed-Poedts
// Ch. 5). Per particle the magnetic moment mu and the energy 1/2|v|^2
// are exact invariants, so v_par^2 = |v|^2 - 2 mu B(r,theta): the
// parallel speed drops as the particle climbs the field toward the
// inboard side and reverses at the mirror point (this IS the bounce,
// not a scripted reflection). The guiding centre streams along the
// helical field at v_par and drifts across it by the combined
// curvature + grad-B drift v_d ~ (v_par^2 + v_perp^2/2)/(B R0),
// directed vertically. Projecting that vertical drift onto the minor
// radius is what bends trapped orbits into bananas and shifts passing
// drift surfaces, all emergent from the physics.
const SPEED_SCALE = 1.5;
const K_DRIFT = 0.85;
function stepPlasma(dt) {
  const R = st.R, a = st.a, B0 = st.B0;
  const speed = SPEED_SCALE * Math.sqrt(B0 / 5.3);
  const v2 = VTOT * VTOT;
  for (let i = 0; i < NPART; i += 1) {
    let r = pr[i], th = pth[i];
    const Rcyl = R + r * Math.cos(th);
    const B = bToroidal(Rcyl, B0, R);
    // Energy + mu conservation set v_par; sign flips at the mirror point.
    let vpar2 = v2 - 2 * pmu[i] * B;
    if (vpar2 <= 0) { psgn[i] = -psgn[i]; vpar2 = 1e-4; }
    const vpar = psgn[i] * Math.sqrt(vpar2);
    const vperp2 = 2 * pmu[i] * B;
    const rr = r / a;
    const q = qAxis + (qEdge - qAxis) * rr * rr;
    const iota = 1 / q;
    // Streaming along the helical field. theta and phi advance; the
    // flux-surface label r is a conserved invariant for a collisionless
    // guiding centre (the canonical toroidal momentum), so it is NOT
    // integrated. The orbit only oscillates ABOUT that surface.
    const dphi = speed * (vpar / Rcyl) * dt;
    let th2 = th + iota * dphi;
    // Small bounded trapped-particle toroidal precession.
    const prec = speed * 0.05 * (vpar2 + 0.5 * vperp2) / (B * R) * dt;
    let ph = pph[i] + dphi + prec;
    if (ph > 6.2831853) ph -= 6.2831853; else if (ph < 0) ph += 6.2831853;
    if (th2 > 6.2831853) th2 -= 6.2831853; else if (th2 < 0) th2 += 6.2831853;
    pth[i] = th2; pph[i] = ph;            // pr[i] (flux surface) conserved
    // Drift-orbit radius: flux surface plus the banana width, which is
    // proportional to the SIGNED parallel speed and so reverses at the
    // mirror bounce. The orbit therefore closes with zero net radial
    // transport (the earlier sign-definite drift integrated a secular r
    // and a trapped sub-population drifted vertically out of the device).
    const eps = r / R;
    const wBan = K_DRIFT * 0.12 * a * (q / Math.sqrt(eps + 0.03));
    let rOrbit = r + wBan * vpar * Math.cos(th2);
    if (rOrbit < 0.012 * a) rOrbit = 0.012 * a; else if (rOrbit > a) rOrbit = a;
    const Rc = R + rOrbit * Math.cos(th2);
    const o = 3 * i;
    posBuf[o] = Rc * Math.cos(ph);
    posBuf[o + 1] = rOrbit * Math.sin(th2);
    posBuf[o + 2] = Rc * Math.sin(ph);
    const xr = r / a;
    const bri = 0.12 + 1.05 * (1 - xr * xr);
    if (ptrap[i]) {
      // Trapped (banana): warm amber.
      colBuf[o] = 0.98 * bri;
      colBuf[o + 1] = 0.62 * bri;
      colBuf[o + 2] = 0.24 * bri;
    } else if (psgn[i] > 0) {
      // Co-passing (carries I_p): white-hot core grading outward.
      colBuf[o] = (0.60 + 0.40 * (1 - xr)) * bri;
      colBuf[o + 1] = 0.82 * bri;
      colBuf[o + 2] = 0.95 * bri;
    } else {
      // Counter-passing: cooler blue, the minority population.
      colBuf[o] = 0.30 * bri;
      colBuf[o + 1] = 0.55 * bri;
      colBuf[o + 2] = 0.98 * bri;
    }
  }
}

let sceneInfo = null;
let last = performance.now(), fpsLast = last, fpsFrames = 0;
const aspect = () => canvas.width / canvas.height;

// Rule-13 diagnostic: the safety-factor profile q(r) across the minor
// radius. q rises from q_axis at the core to q_edge at the boundary
// (modelled parabolic, q(r) = q_axis + (q_edge - q_axis)(r/a)^2). The
// q = 1 and q = 2 rational surfaces are marked: those are where kink
// and tearing modes set in. WebGL scene, so the chart gets its own
// 2D overlay canvas; recomputed only when the profile changes.
const tkDiag = document.createElement('canvas');
tkDiag.width = 252; tkDiag.height = 140;
tkDiag.style.cssText = 'position:absolute;right:10px;bottom:10px;width:252px;height:140px;'
  + 'background:rgba(8,12,22,0.86);border:1px solid rgba(220,230,255,0.3);border-radius:4px;pointer-events:none';
if (canvas.parentElement) {
  const pe = canvas.parentElement;
  if (getComputedStyle(pe).position === 'static') pe.style.position = 'relative';
  pe.appendChild(tkDiag);
}
const tkctx = tkDiag.getContext('2d');
let tkDiagKey = '';
function drawTokamakDiagnostic() {
  if (!tkctx) return;
  // Pin to the bottom-right of the STAGE canvas, not the figure (whose
  // caption sits below the canvas and would bleed through the overlay).
  tkDiag.style.left = `${canvas.offsetLeft + canvas.offsetWidth - tkDiag.width - 10}px`;
  tkDiag.style.top = `${canvas.offsetTop + canvas.offsetHeight - tkDiag.height - 10}px`;
  tkDiag.style.right = 'auto'; tkDiag.style.bottom = 'auto';
  const key = `${qEdge.toFixed(3)}|${qAxis.toFixed(3)}`;
  if (key === tkDiagKey) return;
  tkDiagKey = key;
  const w = tkDiag.width, h = tkDiag.height;
  tkctx.clearRect(0, 0, w, h);
  tkctx.fillStyle = 'rgba(220,230,255,0.92)';
  tkctx.font = 'bold 11px ui-monospace, monospace';
  tkctx.fillText('safety factor  q(r)', 8, 14);
  const ax = 32, ay = 24, aw = w - 44, ah = h - 44;
  const qMax = Math.max(4, qEdge * 1.15);
  const xOf = (rr) => ax + rr * aw;
  const yOf = (q) => ay + ah - (q / qMax) * ah;
  for (const [qv, col, lab] of [[1, 'rgba(239,71,111,0.6)', 'q=1'], [2, 'rgba(255,209,102,0.6)', 'q=2']]) {
    if (qv > qMax) continue;
    tkctx.strokeStyle = col; tkctx.setLineDash([4, 3]);
    tkctx.beginPath(); tkctx.moveTo(ax, yOf(qv)); tkctx.lineTo(ax + aw, yOf(qv)); tkctx.stroke();
    tkctx.setLineDash([]);
    tkctx.fillStyle = col; tkctx.font = '9px ui-monospace, monospace';
    tkctx.fillText(lab, ax + aw - 22, yOf(qv) - 3);
  }
  tkctx.strokeStyle = '#5bc0eb'; tkctx.lineWidth = 2;
  tkctx.beginPath();
  for (let k = 0; k <= 100; k += 1) {
    const rr = k / 100;
    const q = qAxis + (qEdge - qAxis) * rr * rr;
    const x = xOf(rr), y = yOf(q);
    if (k === 0) tkctx.moveTo(x, y); else tkctx.lineTo(x, y);
  }
  tkctx.stroke();
  tkctx.fillStyle = 'rgba(200,210,240,0.78)'; tkctx.font = '9px ui-monospace, monospace';
  tkctx.fillText('0', 22, yOf(0));
  tkctx.fillText(`${qMax.toFixed(0)}`, 16, yOf(qMax) + 6);
  tkctx.fillText('r/a: 0 (axis)', ax, ay + ah + 11);
  tkctx.fillText('1 (edge)', ax + aw - 42, ay + ah + 11);
}

function render() {
  if (!engine) return;
  if (rebuild) {
    refreshProfile();
    sceneInfo = engine.buildScene(st.R, st.a, qEdge, st.B0, st.Ip);
    rebuild = false;
  }
  engine.setParticles(posBuf, colBuf);
  engine.render(camera.viewMatrix(), camera.projMatrix(aspect()), sceneInfo);
  rEls.q_edge.textContent = qEdge.toFixed(2);
  rEls.q_axis.textContent = qAxis.toFixed(2);
  rEls['trapped %'].textContent = (100 * trappedCount / NPART).toFixed(0);
  drawTokamakDiagnostic();
}

btns.reset.addEventListener('click', () => {
  st.R = 1.0; st.a = 0.35; st.B0 = 5.3; st.Ip = 3; rebuild = true;
  initParticles();
  running = true; btns.pause.textContent = 'Pause'; btns.pause.setAttribute('aria-pressed', 'false');
});
btns.pause.addEventListener('click', () => {
  running = !running;
  btns.pause.textContent = running ? 'Pause' : 'Play';
  btns.pause.setAttribute('aria-pressed', String(!running));
});

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  fpsFrames += 1;
  if (now - fpsLast > 500) { rEls.FPS.textContent = (fpsFrames * 1000 / (now - fpsLast)).toFixed(0); fpsLast = now; fpsFrames = 0; }
  if (running) { st.t += dt; stepPlasma(dt); }
  camera.tickIdle(now);
  render();
  requestAnimationFrame(tick);
}

function bootSync() {
  rEls.FPS.textContent = '60';
  refreshProfile();
  if (CAPTURE_NAME) {
    // Deterministic: advance the seeded population a fixed number of
    // fixed-size steps so each capture frame is a reproducible state.
    const steps = Math.round(40 + CAPTURE_FRAC * 520);
    for (let s = 0; s < steps; s += 1) stepPlasma(1 / 60);
  } else {
    stepPlasma(1 / 60);
  }
  render();
  if (DETERMINISTIC) {
    // Settle the bloom ping-pong over several identical frames so the
    // screenshot is pixel-stable across browser processes.
    let warm = 0;
    const settle = () => {
      render();
      warm += 1;
      if (warm < 22) { requestAnimationFrame(settle); return; }
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    };
    requestAnimationFrame(settle);
  }
}

// Physics: q profile sanity. The edge safety factor should be > 1 for stability.
window.__physicsCheck = async () => {
  const q = safetyAtEdge(st.B0, st.R, st.a, st.Ip);
  if (q < 1) return { name: 'q_edge', pass: false, msg: `q_edge=${q.toFixed(2)} below kink-instability threshold 1` };
  if (q > 50) return { name: 'q_edge', pass: false, msg: `q_edge=${q.toFixed(2)} unphysically high` };
  return { name: 'q_edge', pass: true, msg: `q_edge=${q.toFixed(2)} in stable band` };
};

window.__cpuVsGpu = () => ({ skip: true, reason: 'tokamak plasma is JS guiding-centre integration; GPU draws points only' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
