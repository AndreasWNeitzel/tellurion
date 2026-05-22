// Multipole expansion explorer. Three potential-field maps of the z=0
// slice: the exact Coulomb sum, the multipole expansion truncated at
// the chosen order, and the absolute error between them. The error map
// blows up near the charges and collapses far away; a sweeping probe
// ring traces error vs distance in a side panel. Exact/multipole come
// from the headless sim.js.
// Reference: Griffiths, Introduction to Electrodynamics (4th ed.),
// Sec. 3.4; Jackson, Classical Electrodynamics, Sec. 4.1.

import { exactPotential, multipolePotential, buildDist, monopole, dipole } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['dist', 'order', '|p|', 'err@probe', 'leading'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { dist: 'quadrupole', order: 2, scale: 0.32, t: 0, q: +1 };
let charges = buildDist(st.dist, st.scale);
function rebuild() { charges = buildDist(st.dist, st.scale); }

function selectRow(label, opts, value, onChange) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = String(v); o.textContent = t; s.appendChild(o); }
  s.value = String(value); s.addEventListener('change', () => onChange(s.value));
  row.appendChild(lab); row.appendChild(s); const sp = document.createElement('span'); sp.className = 'value'; row.appendChild(sp);
  controlsEl.appendChild(row); return s;
}
const selD = selectRow('distribution', [['monopole', 'single charge'], ['offset', 'offset charges'], ['dipole', 'dipole'], ['quadrupole', 'quadrupole'], ['octupole', 'octupole']], st.dist, v => { st.dist = v; rebuild(); });
const selO = selectRow('expansion order', [[0, 'monopole'], [1, '+ dipole'], [2, '+ quadrupole']], st.order, v => { st.order = parseInt(v, 10); });
const row = document.createElement('div'); row.className = 'row';
const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = 'source size';
const sInp = document.createElement('input'); sInp.type = 'range'; sInp.min = '0.1'; sInp.max = '0.9'; sInp.step = '0.02'; sInp.value = String(st.scale); sInp.setAttribute('aria-label', 'source size');
const sVal = document.createElement('span'); sVal.className = 'value'; sVal.textContent = st.scale.toFixed(2);
sInp.addEventListener('input', () => { st.scale = parseFloat(sInp.value); sVal.textContent = st.scale.toFixed(2); rebuild(); });
row.appendChild(lab); row.appendChild(sInp); row.appendChild(sVal); controlsEl.appendChild(row);
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bSign = document.createElement('button'); bSign.type = 'button'; bSign.textContent = 'click charge: +';
bSign.addEventListener('click', () => { st.q = -st.q; bSign.textContent = `click charge: ${st.q > 0 ? '+' : '-'}`; });
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bSign); bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
let running = !prefersReducedMotion();
bReset.addEventListener('click', () => { Object.assign(st, { dist: 'quadrupole', order: 2, scale: 0.32, t: 0 }); selD.value = 'quadrupole'; selO.value = '2'; sInp.value = '0.32'; sVal.textContent = '0.32'; rebuild(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });
// Click to add a charge in the exact-map panel.
canvas.addEventListener('pointerdown', e => {
  const r = canvas.getBoundingClientRect();
  const cxp = (e.clientX - r.left) * canvas.width / r.width, cyp = (e.clientY - r.top) * canvas.height / r.height;
  const W = canvas.width, pw = (W - 264 - 26) / 3, D = 3.2;
  // Any of the three map panels maps to the same world; add a charge
  // at the clicked point (it reshapes the exact, multipole and error
  // maps together).
  for (let m = 0; m < 3; m += 1) {
    const x0 = 14 + m * (pw + 6);
    if (cxp >= x0 && cxp <= x0 + pw && cyp >= 40 && cyp <= 40 + pw) {
      const wx = ((cxp - x0) / pw - 0.5) * 2 * D, wy = -((cyp - 40) / pw - 0.5) * 2 * D;
      charges.push({ q: (e.shiftKey ? -1 : st.q) * 1.4, r: [wx, wy, 0] });
      break;
    }
  }
});

function rdbu(t) {
  const a = Math.max(-1, Math.min(1, t)); const e = Math.sign(a) * Math.pow(Math.abs(a), 0.6);
  if (e >= 0) return [244 + (178 - 244) * e, 244 + (24 - 244) * e, 248 + (43 - 248) * e];
  const f = -e; return [244 + (33 - 244) * f, 244 + (102 - 244) * f, 248 + (172 - 248) * f];
}
function inferno(t) { const a = Math.max(0, Math.min(1, t)); return [20 + 235 * Math.pow(a, 0.75), 12 + 110 * a * a, 50 + 120 * a * (1 - a) * 2]; }

const NG = 88;
const buf = [ctx.createImageData(NG, NG), ctx.createImageData(NG, NG), ctx.createImageData(NG, NG)];
const off = (() => { const c = document.createElement('canvas'); c.width = NG; c.height = NG; return c; })();
const offc = off.getContext('2d');

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  // Interactive maps are the primary visual; the error plot below is
  // a small secondary strip. Maps are kept narrow enough to clear the
  // top-right readout HUD; the maps are taller than before and the
  // plot height is now fixed small.
  const D = 3.2, pw = (W - 264 - 26) / 3, ptop = 30, ph = 260;
  // Sample fields.
  let vmax = 1e-6, emax = 1e-6;
  const vex = new Float64Array(NG * NG), vmp = new Float64Array(NG * NG);
  for (let j = 0; j < NG; j += 1) for (let i = 0; i < NG; i += 1) {
    const x = (i / (NG - 1) - 0.5) * 2 * D, y = -(j / (NG - 1) - 0.5) * 2 * D;
    const ve = exactPotential(charges, [x, y, 0]);
    const vm = multipolePotential(charges, st.order, [x, y, 0]);
    vex[j * NG + i] = ve; vmp[j * NG + i] = vm;
    vmax = Math.max(vmax, Math.min(8, Math.abs(ve)));
    emax = Math.max(emax, Math.min(8, Math.abs(ve - vm)));
  }
  for (let j = 0; j < NG; j += 1) for (let i = 0; i < NG; i += 1) {
    const k = j * NG + i;
    const ce = rdbu(vex[k] / vmax), cm = rdbu(vmp[k] / vmax), cr = inferno(Math.abs(vex[k] - vmp[k]) / emax);
    for (const [b, c] of [[buf[0], ce], [buf[1], cm], [buf[2], cr]]) { const o = k * 4; b.data[o] = c[0]; b.data[o + 1] = c[1]; b.data[o + 2] = c[2]; b.data[o + 3] = 255; }
  }
  const titles = ['exact V', `multipole (order ${st.order})`, '|error|'];
  for (let m = 0; m < 3; m += 1) {
    offc.putImageData(buf[m], 0, 0);
    const x0 = 14 + m * (pw + 6);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, x0, ptop, pw, ph);
    ctx.strokeStyle = '#2a2a34'; ctx.strokeRect(x0, ptop, pw, ph);
    ctx.fillStyle = '#cdd1d6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText(titles[m], x0 + 6, ptop - 8);
    // Charges overlaid.
    for (const c of charges) {
      const px = x0 + ((c.r[0] / (2 * D)) + 0.5) * pw, py = ptop + ((-c.r[1] / (2 * D)) + 0.5) * ph;
      ctx.fillStyle = c.q > 0 ? '#ff6b6b' : '#5b8cff';
      ctx.beginPath(); ctx.arc(px, py, 4, 0, 6.28); ctx.fill();
    }
  }
  // Sweeping probe ring on the exact map + error(r) inset.
  const rp = 0.4 + 2.6 * (0.5 + 0.5 * Math.sin(st.t * 0.7));
  const x0 = 14, cxm = x0 + pw / 2, cym = ptop + ph / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cxm, cym, rp / (2 * D) * pw, 0, 6.28); ctx.stroke();
  // error(r) panel: small secondary strip beneath the dominant maps.
  const ay0 = ptop + ph + 26, ah = 90, ax0 = 60, ax1 = W - 30;
  ctx.fillStyle = '#0b0b13'; ctx.fillRect(20, ay0 - 16, W - 40, ah + 24);
  ctx.fillStyle = '#9aa0a6'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('relative error |V_exact - V_multipole| / |V_exact|  vs  distance r', 28, ay0 - 2);
  ctx.strokeStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(ax0, ay0 + ah); ctx.lineTo(ax1, ay0 + ah); ctx.moveTo(ax0, ay0); ctx.lineTo(ax0, ay0 + ah); ctx.stroke();
  ctx.strokeStyle = '#5bc6ff'; ctx.lineWidth = 2; ctx.beginPath();
  let probeErr = 0;
  for (let s = 0; s <= 80; s += 1) {
    const r = 0.35 + 5.5 * s / 80; const P = [r * 0.8, r * 0.6, 0];
    const ve = exactPotential(charges, P), vm = multipolePotential(charges, st.order, P);
    const rel = Math.min(1.2, Math.abs(ve - vm) / (Math.abs(ve) + 1e-6));
    const X = ax0 + (r - 0.35) / 5.5 * (ax1 - ax0), Y = ay0 + ah - Math.min(1, rel) * (ah - 6);
    s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    if (Math.abs(r - rp) < 0.04) probeErr = rel;
  }
  ctx.stroke();
  const mx = ax0 + (rp - 0.35) / 5.5 * (ax1 - ax0);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(mx, ay0); ctx.lineTo(mx, ay0 + ah); ctx.stroke(); ctx.setLineDash([]);

  const Q = monopole(charges), p = dipole(charges);
  rEls.dist.textContent = st.dist;
  rEls.order.textContent = ['mono', '+dip', '+quad'][st.order];
  rEls['|p|'].textContent = Math.hypot(...p).toFixed(3);
  rEls['err@probe'].textContent = probeErr.toExponential(1);
  rEls.leading.textContent = Math.abs(Q) > 1e-6 ? '1/r' : Math.hypot(...p) > 1e-6 ? '1/r²' : '1/r³';
}

function tick() { if (running) st.t += 0.02; render(); requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME) st.t = CAPTURE_FRAC * 9;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}

window.__physicsCheck = async () => {
  const c = buildDist('quadrupole', 0.3);
  const errFar = Math.abs(exactPotential(c, [40, 12, 8]) - multipolePotential(c, 2, [40, 12, 8]));
  const errNear = Math.abs(exactPotential(c, [5, 1.5, 1]) - multipolePotential(c, 2, [5, 1.5, 1]));
  if (!(errFar < errNear)) return { name: 'error collapse', pass: false, msg: `far ${errFar} >= near ${errNear}` };
  return { name: 'multipole error collapses with distance', pass: true, msg: `far ${errFar.toExponential(1)} < near ${errNear.toExponential(1)}` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const qTotal = charges.reduce((s, c) => s + c.q, 0);
  const p = [0, 0, 0];
  for (const c of charges) {
    p[0] += c.q * c.r[0]; p[1] += c.q * c.r[1]; p[2] += c.q * c.r[2];
  }
  const pMag = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
  return {
    fields: [
      { key: 'dist', label: 'Distribution', value: st.dist, format: undefined },
      { key: 'order', label: 'Expansion order', value: st.order, format: undefined },
      { key: 'monopole', label: 'Monopole Q', value: qTotal, format: 'float' },
      { key: 'dipole-mag', label: 'Dipole |p|', value: pMag, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const exact1 = Math.abs(exactPotential(charges, [20, 0, 0]));
  const approx1 = Math.abs(multipolePotential(charges, st.order, [20, 0, 0]));
  const rel1 = exact1 > 1e-10 ? Math.abs(exact1 - approx1) / exact1 : Math.abs(exact1 - approx1);
  const status = rel1 < 0.1 ? 'pass' : (rel1 < 0.5 ? 'pending' : 'drift');
  return [
    { key: 'expansion-error', label: 'Truncation error @ r=20', value: rel1.toExponential(2), status }
  ];
};
