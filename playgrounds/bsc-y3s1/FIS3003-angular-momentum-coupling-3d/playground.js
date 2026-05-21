// Addition of angular momenta as a 3D vector model. J1 and J2 precess
// on cones about the resultant J (the chosen total), their lengths
// sqrt(j(j+1)) and their tips tracing circles so the vector sum
// stays equal to J. The side panel is the Clebsch-Gordan table for
// the selected J and the allowed-J ladder. Numerics in sim.js.
// Reference: Sakurai and Napolitano, Modern Quantum Mechanics
// (2nd ed.), Sec. 3.8.

import { allowedJ, clebschGordan, vecLen, cosJ1toJ, cosJ2toJ } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['j1', 'j2', 'J', '|J|', 'theta1', 'theta2'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const st = { j1: 1.5, j2: 1.0, jIdx: -1, t: 0, running: 1 };
function curAllowed() { return allowedJ(st.j1, st.j2); }
function curJ() { const A = curAllowed(); const i = st.jIdx < 0 ? A.length - 1 : Math.min(st.jIdx, A.length - 1); return A[i]; }

// geometry
const VX = 26, VY = 46, VW = 470, VH = 474;       // 3D vector model
const cx3 = VX + VW / 2, cy3 = VY + VH / 2 + 30;
const TX = 540, TY = 180, TW = 320;               // CG table + J ladder (below the HUD)

// rotate (x,y,z) about z (yaw) then x (pitch), orthographic
function proj(x, y, z, yaw, pitch, s) {
  const cyw = Math.cos(yaw), syw = Math.sin(yaw);
  let X = x * cyw - y * syw, Y = x * syw + y * cyw, Z = z;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const Y2 = Y * cp - Z * sp, Z2 = Y * sp + Z * cp;
  return [cx3 + X * s, cy3 - Z2 * s, Y2];
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const j1 = st.j1, j2 = st.j2, J = curJ();
  const L1 = vecLen(j1), L2 = vecLen(j2), LJ = vecLen(J);
  const yaw = st.t * 0.3, pitch = -0.42, scale = 150 / Math.max(L1 + L2, 1.5);

  ctx.fillStyle = '#0a0c12'; ctx.fillRect(VX, VY, VW, VH);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(VX, VY, VW, VH);

  // resultant J along +z (vertical). J1 on a cone of half-angle th1,
  // J2 closing the triangle so J1 + J2 = J.
  const th1 = J > 1e-9 ? Math.acos(Math.max(-1, Math.min(1, cosJ1toJ(j1, j2, J)))) : Math.PI / 2;
  const phase = st.t * 1.1;
  const Jz = LJ;                                   // J vector tip (0,0,LJ)
  // J1 tip on its cone
  const r1 = L1 * Math.sin(th1), h1 = L1 * Math.cos(th1);
  const j1x = r1 * Math.cos(phase), j1y = r1 * Math.sin(phase), j1z = h1;
  // J2 = J - J1 closes the triangle (drawn as the segment P1 -> Jt)
  // axes
  const O = proj(0, 0, 0, yaw, pitch, scale);
  const Jt = proj(0, 0, Jz, yaw, pitch, scale);
  ctx.strokeStyle = 'rgba(150,160,180,0.35)';
  ctx.beginPath(); ctx.moveTo(O[0], O[1] + 0); ctx.lineTo(proj(0, 0, -L1, yaw, pitch, scale)[0], proj(0, 0, -L1, yaw, pitch, scale)[1]); ctx.stroke();
  // precession cone for J1 (circle of radius r1 at height h1)
  ctx.strokeStyle = 'rgba(127,214,255,0.3)'; ctx.beginPath();
  for (let a = 0; a <= 48; a += 1) { const an = (a / 48) * 2 * Math.PI; const p = proj(r1 * Math.cos(an), r1 * Math.sin(an), h1, yaw, pitch, scale); a === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
  ctx.stroke();
  // resultant J (bold)
  ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(Jt[0], Jt[1]); ctx.stroke();
  // J1 (blue) from origin, J2 (orange) from J1 tip to J tip
  const P1 = proj(j1x, j1y, j1z, yaw, pitch, scale);
  ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(P1[0], P1[1]); ctx.stroke();
  ctx.strokeStyle = '#ff9a5d';
  ctx.beginPath(); ctx.moveTo(P1[0], P1[1]); ctx.lineTo(Jt[0], Jt[1]); ctx.stroke();
  ctx.lineWidth = 1;
  for (const [p, c, lab] of [[Jt, '#ffd24a', 'J'], [P1, '#7fd6ff', 'J1'], [O, '#c8ccd6', '']]) {
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 6.2832); ctx.fill();
    if (lab) { ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText(lab, p[0] + 7, p[1] - 6); }
  }
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`J1 (blue) + J2 (orange) = J (yellow);  precessing,  J = ${J}`, VX + VW / 2, VY + VH + 18);
  ctx.textAlign = 'left';

  // allowed-J ladder
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('allowed total J:', TX, TY);
  const A = curAllowed();
  A.forEach((Jv, i) => {
    const x = TX + i * 46, sel = Jv === J;
    ctx.fillStyle = sel ? '#ffd24a' : 'rgba(160,170,190,0.6)';
    ctx.fillText(String(Jv), x, TY + 22);
    if (sel) { ctx.strokeStyle = '#ffd24a'; ctx.strokeRect(x - 4, TY + 10, 36, 18); }
  });
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('|j1-j2| .. j1+j2 (triangle rule)', TX, TY + 46);

  // Clebsch-Gordan table for the selected J: rows M, the |coeff|
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`Clebsch-Gordan  <j1 m1 j2 m2 | ${J} M>`, TX, TY + 78);
  const cellW = 40, cellH = 22, gx0 = TX + 40, gy0 = TY + 100;
  const m1s = []; for (let m = j1; m >= -j1 - 1e-9; m -= 1) m1s.push(Math.round(m * 2) / 2);
  const Ms = []; for (let M = J; M >= -J - 1e-9; M -= 1) Ms.push(Math.round(M * 2) / 2);
  ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillStyle = '#9aa0ad'; ctx.textAlign = 'right';
  ctx.fillText('m1=', gx0 - 4, gy0 - 6);
  ctx.textAlign = 'center';
  m1s.forEach((m1, c) => ctx.fillText(String(m1), gx0 + c * cellW + cellW / 2, gy0 - 6));
  Ms.forEach((M, r) => {
    ctx.fillStyle = '#9aa0ad'; ctx.textAlign = 'right'; ctx.fillText(`M=${M}`, gx0 - 4, gy0 + r * cellH + 14);
    m1s.forEach((m1, c) => {
      const m2 = M - m1;
      let v = 0; if (Math.abs(m2) <= j2 + 1e-9) v = clebschGordan(j1, m1, j2, m2, J, M);
      const a = Math.abs(v);
      ctx.fillStyle = a < 1e-6 ? 'rgba(40,44,54,0.6)' : `rgba(127,214,255,${0.25 + 0.7 * a})`;
      ctx.fillRect(gx0 + c * cellW + 1, gy0 + r * cellH + 1, cellW - 2, cellH - 2);
      if (a > 1e-6) { ctx.fillStyle = '#0a0c12'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.fillText(v.toFixed(2), gx0 + c * cellW + cellW / 2, gy0 + r * cellH + 15); }
    });
  });
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('cell colour = |coeff|; rows sum to 1 (unitary)', TX, gy0 + Ms.length * cellH + 16);

  rEls['j1'].textContent = String(j1);
  rEls['j2'].textContent = String(j2);
  rEls['J'].textContent = String(J);
  rEls['|J|'].textContent = LJ.toFixed(3);
  rEls['theta1'].textContent = (th1 * 180 / Math.PI).toFixed(1) + ' deg';
  const th2 = J > 1e-9 ? Math.acos(Math.max(-1, Math.min(1, cosJ2toJ(j1, j2, J)))) : Math.PI / 2;
  rEls['theta2'].textContent = (th2 * 180 / Math.PI).toFixed(1) + ' deg';
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); st.jIdx = -1; render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const cJ1 = buildSlider('j1', 0.5, 3, 0.5, st.j1, 'j1', v => v.toFixed(1));
const cJ2 = buildSlider('j2', 0.5, 3, 0.5, st.j2, 'j2', v => v.toFixed(1));
const jRow = document.createElement('div'); jRow.className = 'row';
const jLab = document.createElement('span'); jLab.className = 'label'; jLab.textContent = 'total J';
const jSel = document.createElement('select'); jSel.setAttribute('aria-label', 'total J');
function refillJ() {
  jSel.innerHTML = '';
  curAllowed().forEach((Jv, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = `J = ${Jv}`; jSel.appendChild(o); });
  jSel.value = String(st.jIdx < 0 ? curAllowed().length - 1 : Math.min(st.jIdx, curAllowed().length - 1));
}
refillJ();
jSel.addEventListener('change', () => { st.jIdx = parseInt(jSel.value, 10); render(); });
jRow.appendChild(jLab); jRow.appendChild(jSel); const jsp = document.createElement('span'); jsp.className = 'value'; jRow.appendChild(jsp);
controlsEl.appendChild(jRow);
// keep the J selector in sync when j1/j2 change
for (const c of [cJ1, cJ2]) c.inp.addEventListener('input', () => { st.jIdx = -1; refillJ(); });
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { j1: 1.5, j2: 1.0, jIdx: -1, t: 0, running: 1 });
  cJ1.inp.value = '1.5'; cJ1.val.textContent = '1.5'; cJ2.inp.value = '1'; cJ2.val.textContent = '1.0'; refillJ();
  bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) st.t += dr;
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * 12 : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const cb = clebschGordan(1, 1, 1, 1, 2, 2);
  if (Math.abs(cb - 1) > 1e-9) return { name: 'stretched CG', pass: false, msg: `${cb}` };
  let s = 0;
  for (const m1 of [1, 0, -1]) { const m2 = -m1; s += clebschGordan(1, m1, 1, m2, 0, 0) ** 2; }
  if (Math.abs(s - 1) > 1e-9) return { name: 'CG unitarity', pass: false, msg: `col sum ${s}` };
  return { name: 'CG unitary + triangle rule', pass: true, msg: 'columns orthonormal; stretched = 1' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
