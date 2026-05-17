// Two-body scattering shown in the lab frame and the CM frame at once,
// with a live differential-cross-section polar panel. The relative
// coordinate r(t) is integrated for the chosen potential; the lab
// particles add the uniform CM drift, the CM particles are back-to-back.
// Reference: Goldstein, Classical Mechanics (3rd ed.), Ch. 3.7.

import { reducedMass, chiOf, relTrajectory, dsigmaRutherford } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['χ_CM (deg)', 'θ_lab (deg)', 'b', 'potential', 'regime'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { massRatio: 1.0, v1: 4.0, b: 0.6, kind: 'coulomb', t: 0 };
function physParams() {
  const m1 = 1, m2 = st.massRatio, mu = reducedMass(m1, m2);
  const E = 0.5 * mu * st.v1 * st.v1;
  return { kind: st.kind, R: 1.0, alpha: 1.2, lambda: 1.6, mu, v0: st.v1, E, m1, m2 };
}
let P = physParams(), rel = relTrajectory(st.b, P);
function rebuild() { P = physParams(); rel = relTrajectory(st.b, P); st.t = 0; }
let running = true;

function buildSlider(label, min, max, stp, value, key, fmt = v => v.toFixed(2)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); rebuild(); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
  return { inp, val };
}
const cM = buildSlider('m₂/m₁', 0.2, 6, 0.1, st.massRatio, 'massRatio', v => v.toFixed(1));
const cV = buildSlider('speed v₁', 1.5, 9, 0.1, st.v1, 'v1', v => v.toFixed(1));
const cB = buildSlider('impact b', 0.0, 3, 0.02, st.b, 'b');
const selRow = document.createElement('div'); selRow.className = 'row';
const selLab = document.createElement('span'); selLab.className = 'label'; selLab.textContent = 'potential';
const sel = document.createElement('select'); sel.setAttribute('aria-label', 'potential');
for (const [v, t] of [['coulomb', 'inverse-square (Rutherford)'], ['hard', 'hard sphere'], ['yukawa', 'Yukawa (screened)']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
sel.value = st.kind;
sel.addEventListener('change', () => { st.kind = sel.value; rebuild(); render(); });
selRow.appendChild(selLab); selRow.appendChild(sel); const ss = document.createElement('span'); ss.className = 'value'; selRow.appendChild(ss);
controlsEl.appendChild(selRow);
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => { Object.assign(st, { massRatio: 1.0, v1: 4.0, b: 0.6, kind: 'coulomb', t: 0 }); cM.inp.value = '1'; cM.val.textContent = '1.0'; cV.inp.value = '4'; cV.val.textContent = '4.0'; cB.inp.value = '0.6'; cB.val.textContent = '0.60'; sel.value = 'coulomb'; rebuild(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render(); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#06070b'; ctx.fillRect(0, 0, W, H);
  const half = W / 2;
  const m1 = P.m1, m2 = P.m2, M = m1 + m2;
  const n = rel.length;
  // Bias toward mid/late encounter so paused and captured frames always
  // show a developed, scattered trajectory (not just the approach).
  const idx = Math.min(n - 1, Math.floor((0.35 + 0.6 * ((st.t * 0.3) % 1)) * n));
  const SC = 64;

  const chi = chiOf(st.b, P);
  const Vcm = m1 * st.v1 / M;
  const r1m = 7 + 5 * Math.cbrt(m1), r2m = 7 + 5 * Math.cbrt(m2);

  // PRIMARY: large CM-frame collision. Particles meet and recoil
  // back-to-back; thick fading trails fill the scene; a bold dashed
  // deflection wedge with an arc shows chi.
  const cmx = W / 2, cmy = 248, sceneH = 430;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '13px ui-monospace, monospace';
  ctx.fillText('Centre-of-mass frame', 18, 26);
  ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cmx - 150, cmy); ctx.lineTo(cmx + 150, cmy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cmx, cmy); ctx.lineTo(cmx + 150 * Math.cos(chi), cmy - 150 * Math.sin(chi)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cmx, cmy, 46, -chi, 0); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(`χ = ${(chi * 180 / Math.PI).toFixed(1)}°`, cmx + 54, cmy - 20);
  for (const [sign, mfac, col, rad] of [[+1, m2 / M, '#5bc6ff', r1m], [-1, m1 / M, '#ff9d6e', r2m]]) {
    ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.beginPath();
    for (let k = 0; k <= idx; k += 1) { const r = rel[k]; const X = cmx + sign * mfac * r[0] * SC, Y = cmy - sign * mfac * r[1] * SC; k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke();
    const r = rel[idx]; const X = cmx + sign * mfac * r[0] * SC, Y = cmy - sign * mfac * r[1] * SC;
    const g = ctx.createRadialGradient(X, Y, 0, X, Y, rad * 1.8);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, rad * 1.8, 0, 6.28); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X, Y, rad, 0, 6.28); ctx.fill();
  }

  // SECONDARY (small inset, top-left): the same event in the LAB frame.
  const lx = 22, ly = 60, lw = 250, lh = 150;
  ctx.fillStyle = '#0b0b13'; ctx.fillRect(lx, ly, lw, lh);
  ctx.strokeStyle = '#2a2a34'; ctx.strokeRect(lx, ly, lw, lh);
  ctx.fillStyle = '#7e828a'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('LAB frame (target at rest)', lx + 8, ly + 14);
  const lsc = 14, lcy = ly + lh * 0.6;
  for (const [sign, mfac, col] of [[+1, m2 / M, '#5bc6ff'], [-1, m1 / M, '#ff9d6e']]) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let k = 0; k <= idx; k += 1) { const r = rel[k]; const Rx = (k - n / 2) * Vcm * 0.05; const X = lx + 30 + (Rx + sign * mfac * r[0]) * lsc; const Y = lcy - sign * mfac * r[1] * lsc; if (X > lx + 4 && X < lx + lw - 4) (k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); }
    ctx.stroke();
  }

  // dsigma/dOmega polar (bottom strip), FIXED log-decade radial scale
  // (not per-frame normalised) so the potential, speed and b visibly
  // reshape it. Rutherford analytic overlaid for the inverse-square law.
  const py0 = H - 150, pcx = W / 2, pcy = H - 22, pr = 122;
  ctx.fillStyle = '#0b0b13'; ctx.fillRect(8, py0, W - 16, 142);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('dσ/dΩ  (polar; radius = log decades, fixed scale)', pcx, py0 + 16);
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(pcx, pcy, pr, Math.PI, 2 * Math.PI); ctx.stroke();
  for (let d = 1; d <= 4; d += 1) { const rr = pr * d / 4; ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.arc(pcx, pcy, rr, Math.PI, 2 * Math.PI); ctx.stroke(); }
  // V(r) profile inset (left of the polar): redraws entirely with the
  // potential selector, so that control is always perceptible.
  const vx0 = 26, vy0 = py0 + 26, vw = 220, vh = 96;
  ctx.strokeStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(vx0, vy0); ctx.lineTo(vx0, vy0 + vh); ctx.lineTo(vx0 + vw, vy0 + vh); ctx.stroke();
  ctx.fillStyle = '#7e828a'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('V(r): ' + st.kind, vx0 + 4, vy0 - 4); ctx.fillText('r', vx0 + vw - 8, vy0 + vh + 12);
  ctx.strokeStyle = '#9d8bff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 80; i += 1) {
    const r = 0.12 + 4 * i / 80;
    let V;
    if (st.kind === 'hard') V = r < P.R ? 6 : 0;
    else if (st.kind === 'coulomb') V = P.alpha / r;
    else V = P.alpha / r * Math.exp(-r / P.lambda);
    const X = vx0 + (r / 4.12) * vw, Y = vy0 + vh - Math.max(0, Math.min(1, V / 6)) * vh;
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  }
  ctx.stroke();

  const RAD = (ds) => pr * Math.max(0.04, Math.min(1, (Math.log10(ds + 1e-6) + 3) / 6));   // fixed: 1e-3..1e3 -> 0..1
  ctx.strokeStyle = '#5bc6ff'; ctx.lineWidth = 2.4; ctx.beginPath();
  let first = true;
  for (let i = 1; i <= 90; i += 1) {
    const bb = 0.015 + (3.0 - 0.015) * i / 90;
    const c = chiOf(bb, P); if (c < 0.02) continue;
    const c2 = chiOf(bb + 0.008, P);
    const ds = (bb / Math.max(1e-6, Math.sin(c))) * Math.abs(0.008 / Math.max(1e-6, c2 - c));
    const rr = RAD(ds); const X = pcx + rr * Math.cos(Math.PI + c), Y = pcy - rr * Math.sin(c);
    first ? (ctx.moveTo(X, Y), first = false) : ctx.lineTo(X, Y);
  }
  ctx.stroke();
  if (st.kind === 'coulomb') {
    ctx.strokeStyle = 'rgba(255,209,102,0.85)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.8; ctx.beginPath();
    for (let i = 1; i <= 90; i += 1) { const c = 0.06 + (Math.PI - 0.12) * i / 90; const v = dsigmaRutherford(c, P.alpha, P.E); const rr = RAD(v); const X = pcx + rr * Math.cos(Math.PI + c), Y = pcy - rr * Math.sin(c); i === 1 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffd166'; ctx.fillText('Rutherford (analytic)', W - 220, py0 + 16);
  }

  const thetaLab = Math.atan2(Math.sin(chi), Math.cos(chi) + m1 / m2);
  rEls['χ_CM (deg)'].textContent = (chi * 180 / Math.PI).toFixed(1);
  rEls['θ_lab (deg)'].textContent = (thetaLab * 180 / Math.PI).toFixed(1);
  rEls.b.textContent = st.b.toFixed(2);
  rEls.potential.textContent = st.kind;
  rEls.regime.textContent = chi > 2.2 ? 'back-scatter' : chi > 0.5 ? 'wide-angle' : 'forward';
}

let last = performance.now();
function tick(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) st.t = CAPTURE_FRAC * 2.6;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}

window.__physicsCheck = async () => {
  const E = 4, alpha = 1.5;
  const ratio = dsigmaRutherford(Math.PI / 3, alpha, E) / dsigmaRutherford(Math.PI / 2, alpha, E);
  const analytic = Math.sin(Math.PI / 4) ** 4 / Math.sin(Math.PI / 6) ** 4;
  const err = Math.abs(ratio - analytic) / analytic;
  if (err > 1e-3) return { name: 'Rutherford 1/sin^4', pass: false, msg: `err=${(err * 100).toFixed(3)}%` };
  return { name: 'Rutherford cross section', pass: true, msg: `1/sin^4(chi/2) within ${(err * 100).toFixed(4)}%` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
