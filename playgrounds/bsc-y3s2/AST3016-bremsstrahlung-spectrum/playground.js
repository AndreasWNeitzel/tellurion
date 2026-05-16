import { emissivity, cutoffHz, H, KB } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rC = document.getElementById('readout-c');
const sT = document.getElementById('slider-T'), vT = document.getElementById('value-T');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { logT: 7, logn: 0 }; let running = true;
sT.addEventListener('input', () => { st.logT = parseFloat(sT.value); vT.textContent = st.logT.toFixed(2); });
sN.addEventListener('input', () => { st.logn = parseFloat(sN.value); vN.textContent = st.logn.toFixed(1); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
// Bremsstrahlung scene state: an electron repeatedly flies past an ion,
// gets deflected, and emits an expanding radiation wavefront at periapsis.
// A physically integrated Coulomb flyby: the electron moves under the
// attractive 1/r^2 force of the ion, so its path is a real hyperbola
// (asymmetric: the outgoing asymptote is rotated from the incoming
// one, and |acceleration| peaks sharply at periapsis). Hotter plasma
// = faster electron (v ~ sqrt(T)) = straighter path and a harder,
// weaker kink, exactly as the slider should show. The emitted pulse
// is the Larmor dipole: amplitude ~ sin^2(psi) about the acceleration
// direction at periapsis, NOT an isotropic circle.
const scene = { t: 0 };
function integrateFlyby(W, sceneH, phase, vScale) {
  const ionX = W * 0.52, ionY = sceneH * 0.52;
  const b = sceneH * 0.20;                 // impact parameter (px)
  const Kc = 9.0e5;                        // scaled Z e^2 / m strength
  let x = W * 0.06, y = ionY - b;          // start upper-left
  let vx = vScale, vy = 0;
  const dt = 0.7;
  const path = [];
  let aMax = 0, aAtPeri = [1, 0], periPt = [x, y];
  const span = W * 0.9;
  const totalSteps = Math.max(1, Math.round(span / (vScale * dt)));
  const upto = Math.floor(phase * totalSteps);
  for (let s = 0; s <= totalSteps; s += 1) {
    const dx = x - ionX, dy = y - ionY;
    const r2 = dx * dx + dy * dy, r = Math.sqrt(r2) + 4;
    const aMag = Kc / (r2 + 16);
    const ax = -aMag * dx / r, ay = -aMag * dy / r;     // attractive
    if (aMag > aMax) { aMax = aMag; aAtPeri = [ax / aMag, ay / aMag]; periPt = [x, y]; }
    if (s <= upto) path.push([x, y]);
    vx += ax * dt; vy += ay * dt;
    x += vx * dt; y += vy * dt;
    if (x > W * 0.97) break;
  }
  const cur = path.length ? path[path.length - 1] : [x, y];
  return { ionX, ionY, path, cur, aAtPeri, periPt, emitted: upto > totalSteps * 0.5 };
}
function drawScene(W, sceneH) {
  if (!CAPTURE_NAME) scene.t += 0.016;
  const period = 3.6;
  const phase = (scene.t % period) / period;
  // Electron speed from temperature: v_th ~ sqrt(T). Map the slider
  // band to a visible px/step speed.
  const vScale = 3.2 * Math.sqrt(Math.pow(10, st.logT - 7));
  const fly = integrateFlyby(W, sceneH, phase, Math.max(1.4, Math.min(9, vScale)));

  // Ion nucleus + Coulomb halo.
  const g = ctx.createRadialGradient(fly.ionX, fly.ionY, 0, fly.ionX, fly.ionY, 80);
  g.addColorStop(0, 'rgba(255,150,90,0.5)'); g.addColorStop(1, 'rgba(255,150,90,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fly.ionX, fly.ionY, 80, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#ff9351';
  ctx.beginPath(); ctx.arc(fly.ionX, fly.ionY, 9, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('ion (Ze)', fly.ionX + 12, fly.ionY - 12);

  // Dipole radiation: lobes ~ sin^2(psi) about the periapsis
  // acceleration direction, expanding from the periapsis point.
  if (fly.emitted) {
    const [nx, ny] = fly.aAtPeri;
    const pdone = Math.max(0, (phase - 0.5) / 0.5);
    for (let ring = 0; ring < 4; ring += 1) {
      const rr = (pdone * 230) - ring * 26;
      if (rr <= 4) continue;
      ctx.beginPath();
      for (let d = 0; d <= 72; d += 1) {
        const th = (d / 72) * 2 * Math.PI;
        const cx = Math.cos(th), cy = Math.sin(th);
        const cospsi = cx * nx + cy * ny;
        const w = 1 - cospsi * cospsi;                   // sin^2(psi)
        const R = rr * (0.32 + 0.68 * w);
        const X = fly.periPt[0] + cx * R, Y = fly.periPt[1] + cy * R;
        if (d === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(125,211,252,${Math.max(0, 0.45 - pdone * 0.32).toFixed(3)})`;
      ctx.lineWidth = 1.4; ctx.stroke();
    }
  }
  // True hyperbolic trajectory + electron.
  ctx.strokeStyle = 'rgba(124,156,255,0.45)'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  fly.path.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
  ctx.fillStyle = '#7c9cff';
  ctx.beginPath(); ctx.arc(fly.cur[0], fly.cur[1], 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#dcdde2';
  ctx.fillText('Coulomb flyby: hyperbola, dipole emission at periapsis (raise T -> faster, straighter)', W * 0.05, 22);
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, Hc = canvas.height;
  const sceneH = Hc * 0.46;
  drawScene(W, sceneH);
  // Spectrum is now the secondary lower panel.
  const H_px = Hc;
  const pad = { l: 60, r: 30, t: sceneH + 24, b: 44 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H_px - pad.b); ctx.lineTo(W - pad.r, H_px - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('log10 e_nu', 12, pad.t + 10);
  ctx.fillText('log10 nu (Hz)', W / 2, H_px - pad.b + 18);
  const T = Math.pow(10, st.logT), n = Math.pow(10, st.logn);
  const lognu_min = 8, lognu_max = 22;
  const xToPx = (l) => pad.l + (l - lognu_min) / (lognu_max - lognu_min) * (W - pad.l - pad.r);
  let emax = -1e9, emin = 1e9;
  const N = 600; const eps = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const lognu = lognu_min + (lognu_max - lognu_min) * i / (N - 1);
    const nu = Math.pow(10, lognu);
    const e = emissivity(nu, T, n, n);
    eps[i] = e > 0 ? Math.log10(e) : -50;
    if (eps[i] > emax) emax = eps[i]; if (eps[i] < emin) emin = eps[i];
  }
  emin = Math.max(emin, emax - 12);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < N; i += 1) {
    const lognu = lognu_min + (lognu_max - lognu_min) * i / (N - 1);
    const e = Math.max(emin, eps[i]);
    const py = H_px - pad.b - (e - emin) / (emax - emin) * (H_px - pad.t - pad.b);
    if (i === 0) ctx.moveTo(xToPx(lognu), py); else ctx.lineTo(xToPx(lognu), py);
  }
  ctx.stroke();
  const nu_c = cutoffHz(T);
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(Math.log10(nu_c)), pad.t); ctx.lineTo(xToPx(Math.log10(nu_c)), H_px - pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText(`hν = kT @ log10 ν = ${Math.log10(nu_c).toFixed(2)}`, xToPx(Math.log10(nu_c)) + 4, pad.t + 16);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`T = 10^${st.logT.toFixed(1)} K, n = 10^${st.logn.toFixed(1)} cm⁻³`, 12, H_px - 14);
  rC.textContent = `10^${Math.log10(nu_c).toFixed(1)} Hz`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) {
    // Sweep one flyby across frames, and vary T so the gate exercises
    // the speed/deflection coupling.
    scene.t = 3.6 * (0.12 + CAPTURE_FRAC * 0.82);
    st.logT = 6.5 + CAPTURE_FRAC * 1.5;
    vT.textContent = st.logT.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
