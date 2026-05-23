// Photoelectric effect. The primary scene is the phototube: light of
// frequency nu strikes a metal cathode, and if h nu > phi electrons
// are ejected and drift to the anode under the applied voltage. Below
// threshold no electrons appear no matter how bright the light. The
// side panels are the I-V curve (cutoff at -V_stop, saturation set by
// intensity) and the Einstein line V_stop(nu) of slope h/e. Numerics
// in sim.js. Reference: Eisberg and Resnick, Quantum Physics of Atoms
// (2nd ed.), Sec. 2.2-2.3.

import { METALS, photonEnergy, thresholdFreqPHz, kMax, emits, stoppingVoltage, photocurrent, einsteinLine, H_EV } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';
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

const READOUTS = ['metal', 'nu (PHz)', 'h nu (eV)', 'K_max (eV)', 'V_stop (V)', 'current'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const st = { metal: 'sodium', nu: 0.9, intensity: 1.0, V: 0.5, t: 0, running: 1 };
const NU_MIN = 0.3, NU_MAX = 2.0;             // PHz
const rngBase = makeRng(DEFAULT_SEED);
const ph = []; for (let i = 0; i < 64; i += 1) ph.push([rngBase(), rngBase(), rngBase()]);

// geometry
const TX = 30, TY = 56, TW = 500, TH = 300;   // phototube scene
const IVX = 556, IVY = 196, IVW = 316, IVH = 150;
const ELX = 556, ELY = 384, ELW = 316, ELH = 150;

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const phi = METALS[st.metal], nu = st.nu, E = photonEnergy(nu), K = kMax(nu, phi);
  const on = emits(nu, phi), Vs = stoppingVoltage(nu, phi);
  const reach = on && (st.V > -Vs);            // electrons reach the anode

  // phototube
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(TX, TY, TW, TH);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(TX, TY, TW, TH);
  const catX = TX + 120, anX = TX + TW - 70, midY = TY + TH / 2;
  // cathode (metal) and anode plates
  ctx.fillStyle = '#6a7180'; ctx.fillRect(catX - 8, midY - 80, 8, 160);
  ctx.fillStyle = '#3a3f4b'; ctx.fillRect(anX, midY - 80, 8, 160);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`cathode (${st.metal}, phi=${phi.toFixed(2)} eV)`, catX + 30, midY + 100);
  ctx.fillText('anode', anX + 4, midY + 100);
  // photon beam: a bold colour band (hue tracks frequency), opacity
  // and ripple density set by intensity (a large-area visual)
  const beamHue = 280 - 210 * ((nu - NU_MIN) / (NU_MAX - NU_MIN));
  const bx0 = TX + 8, bx1 = catX - 8, by0 = midY - 78, bh = 156;
  const bg = ctx.createLinearGradient(bx0, 0, bx1, 0);
  bg.addColorStop(0, `hsla(${beamHue},85%,60%,${0.12 + 0.16 * st.intensity})`);
  bg.addColorStop(1, `hsla(${beamHue},90%,66%,${0.3 + 0.16 * st.intensity})`);
  ctx.fillStyle = bg; ctx.fillRect(bx0, by0, bx1 - bx0, bh);
  const nPh = Math.round(3 + st.intensity * 7);
  ctx.strokeStyle = `hsl(${beamHue},92%,72%)`; ctx.lineWidth = 2.5;
  for (let i = 0; i < nPh; i += 1) {
    const fr = (st.t * 1.4 + ph[i][0]) % 1, sx = bx0 + fr * (bx1 - bx0), sy = by0 + 8 + ph[i][1] * (bh - 16);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 18, sy); ctx.stroke();
  }
  ctx.lineWidth = 1;
  ctx.fillStyle = `hsl(${beamHue},90%,70%)`; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('light source', TX + 8, TY + 20);
  // applied-voltage field in the gap: a large tinted region, green
  // when accelerating (V > 0), red when retarding (V < 0), opacity
  // tracking |V| (always perceptible across the whole V range)
  const vNorm = Math.max(-1, Math.min(1, st.V / 6));
  const vCol = vNorm >= 0 ? `rgba(90,210,150,${0.05 + 0.16 * vNorm})` : `rgba(255,110,100,${0.05 + 0.20 * -vNorm})`;
  ctx.fillStyle = vCol; ctx.fillRect(catX, by0, anX - catX, bh);
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`V = ${st.V.toFixed(1)} (${st.V >= 0 ? 'accelerating' : 'retarding'})`, (catX + anX) / 2, by0 - 6);
  ctx.textAlign = 'left';
  // ejected electrons: a dense field filling the gap when h nu > phi.
  // density scales with intensity; the field extends a fraction
  // (V + V_stop)/(2 V_stop) toward the anode (retarding V shrinks it).
  if (on) {
    const spd = Math.sqrt(Math.max(0.02, K));
    const reachFrac = reach ? 1 : Math.max(0.06, (st.V + Vs) / (2 * Vs + 1e-6));
    const gap = (anX - catX) * reachFrac;
    const nE = Math.round(10 + st.intensity * 60);
    for (let i = 0; i < nE; i += 1) {
      const a = ph[i % ph.length], b = ph[(i * 7 + 3) % ph.length];
      const base = (a[0] + b[1]) % 1;
      const fr = (st.t * (0.3 + 0.5 * spd) + base) % 1;
      const ex = catX + fr * gap;
      const ey = midY - 70 + ((a[1] + 0.37 * i) % 1) * 140 + Math.sin(st.t * 5 + i) * 3;
      ctx.fillStyle = `rgba(127,214,255,${0.5 + 0.4 * Math.sqrt(spd / 3)})`;
      ctx.beginPath(); ctx.arc(ex, ey, 2.6, 0, 6.2832); ctx.fill();
    }
    if (!reach) { ctx.strokeStyle = 'rgba(255,120,110,0.5)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(catX + gap, by0); ctx.lineTo(catX + gap, by0 + bh); ctx.stroke(); ctx.setLineDash([]); }
  }
  ctx.fillStyle = on ? '#7fd6ff' : '#ff8a78'; ctx.font = fontString(canvas, 'body', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(on ? (reach ? 'photoelectrons reach the anode: current flows' : 'electrons ejected but the retarding V repels them')
    : 'h nu < phi: NO electrons, at any intensity', TX + TW / 2, TY + TH + 22);
  // ammeter
  const I = photocurrent(st.V, nu, phi, st.intensity);
  ctx.strokeStyle = 'rgba(200,205,215,0.5)'; ctx.beginPath(); ctx.arc(anX + 36, midY, 18, 0, 6.2832); ctx.stroke();
  ctx.fillStyle = '#ffd24a'; ctx.save(); ctx.translate(anX + 36, midY);
  ctx.rotate(-Math.PI * 0.6 + Math.PI * 1.2 * Math.min(1, I / 12)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#9aa0ad'; ctx.fillText('A', anX + 36, midY + 32);
  ctx.textAlign = 'left';

  // I-V curve panel
  function panel(x, y, w, h, title) {
    ctx.fillStyle = '#0b0d13'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    ctx.fillText(title, x + w / 2, y - 6); ctx.textAlign = 'left';
  }
  panel(IVX, IVY, IVW, IVH, 'photocurrent vs applied voltage');
  const Vlo = -4, Vhi = 6, Imax = 1 * 4 + 0.5;
  const ivx = (v) => IVX + 6 + ((v - Vlo) / (Vhi - Vlo)) * (IVW - 12);
  const ivy = (i) => IVY + IVH - 8 - (i / Imax) * (IVH - 20);
  ctx.strokeStyle = 'rgba(200,205,215,0.25)'; ctx.beginPath(); ctx.moveTo(ivx(0), IVY + 4); ctx.lineTo(ivx(0), IVY + IVH - 4); ctx.moveTo(IVX + 6, ivy(0)); ctx.lineTo(IVX + IVW - 6, ivy(0)); ctx.stroke();
  ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let q = 0; q <= 120; q += 1) { const v = Vlo + (Vhi - Vlo) * q / 120; const ii = photocurrent(v, nu, phi, st.intensity); const X = ivx(v), Yy = ivy(ii); q === 0 ? ctx.moveTo(X, Yy) : ctx.lineTo(X, Yy); }
  ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(ivx(st.V), ivy(I), 4, 0, 6.2832); ctx.fill();
  if (on) { ctx.strokeStyle = 'rgba(255,210,90,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ivx(-Vs), IVY + 4); ctx.lineTo(ivx(-Vs), IVY + IVH - 4); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.fillText('-V_stop', ivx(-Vs), IVY + IVH - 2); ctx.textAlign = 'left'; }

  // Einstein line panel
  panel(ELX, ELY, ELW, ELH, 'Einstein line: V_stop vs nu (slope h/e)');
  const nu0 = thresholdFreqPHz(phi), VsMax = stoppingVoltage(NU_MAX, phi) * 1.1 + 1e-6;
  const elx = (n) => ELX + 6 + ((n - NU_MIN) / (NU_MAX - NU_MIN)) * (ELW - 12);
  const ely = (v) => ELY + ELH - 10 - (v / VsMax) * (ELH - 22);
  ctx.strokeStyle = 'rgba(200,205,215,0.25)'; ctx.beginPath(); ctx.moveTo(ELX + 6, ely(0)); ctx.lineTo(ELX + ELW - 6, ely(0)); ctx.stroke();
  ctx.strokeStyle = '#ffcf5d'; ctx.lineWidth = 1.8; ctx.beginPath();
  einsteinLine(phi, NU_MIN, NU_MAX, 80).forEach(([n, v], k) => { const X = elx(n), Yy = ely(v); k === 0 ? ctx.moveTo(X, Yy) : ctx.lineTo(X, Yy); });
  ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(elx(nu), ely(Math.max(0, K)), 4, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`nu0 = ${nu0.toFixed(2)} PHz`, elx(nu0), ELY + ELH - 2);
  ctx.fillText('ν', ELX + ELW / 2, ELY + ELH + 13); ctx.textAlign = 'left';

  rEls['metal'].textContent = st.metal;
  rEls['nu (PHz)'].textContent = nu.toFixed(3);
  rEls['h nu (eV)'].textContent = E.toFixed(3);
  rEls['K_max (eV)'].textContent = on ? K.toFixed(3) : 'none';
  rEls['V_stop (V)'].textContent = on ? Vs.toFixed(3) : '-';
  rEls['current'].textContent = I.toFixed(2);
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const mRow = document.createElement('div'); mRow.className = 'row';
const mLab = document.createElement('span'); mLab.className = 'label'; mLab.textContent = 'metal';
const mSel = document.createElement('select'); mSel.setAttribute('aria-label', 'metal');
for (const k of Object.keys(METALS)) { const o = document.createElement('option'); o.value = k; o.textContent = `${k} (phi=${METALS[k]})`; mSel.appendChild(o); }
mSel.value = st.metal;
mSel.addEventListener('change', () => { st.metal = mSel.value; render(); });
mRow.appendChild(mLab); mRow.appendChild(mSel); const msp = document.createElement('span'); msp.className = 'value'; mRow.appendChild(msp);
controlsEl.appendChild(mRow);
const cNu = buildSlider('frequency nu (PHz)', NU_MIN, NU_MAX, 0.01, st.nu, 'nu', v => v.toFixed(2));
const cI = buildSlider('light intensity', 0.2, 4, 0.1, st.intensity, 'intensity', v => v.toFixed(1) + 'x');
const cV = buildSlider('applied voltage V', -4, 6, 0.1, st.V, 'V', v => v.toFixed(1));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { metal: 'sodium', nu: 0.9, intensity: 1.0, V: 0.5, t: 0, running: 1 });
  mSel.value = 'sodium'; cNu.inp.value = '0.9'; cNu.val.textContent = '0.90'; cI.inp.value = '1'; cI.val.textContent = '1.0x'; cV.inp.value = '0.5'; cV.val.textContent = '0.5';
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
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * 4 : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const phi = METALS.sodium, nu0 = thresholdFreqPHz(phi);
  if (emits(nu0 * 0.8, phi)) return { name: 'threshold', pass: false, msg: 'emits below nu0' };
  const K1 = kMax(nu0 * 1.5, phi);
  if (Math.abs(K1 - (photonEnergy(nu0 * 1.5) - phi)) > 1e-9) return { name: 'Einstein eq', pass: false, msg: 'K != hv-phi' };
  if (Math.abs((stoppingVoltage(nu0 * 1.5, phi) - stoppingVoltage(nu0 * 1.2, phi)) / ((nu0 * 0.3) * 1e15) - H_EV) > 1e-6) return { name: 'slope h/e', pass: false, msg: 'slope wrong' };
  return { name: 'Einstein K=hv-phi, threshold, slope h/e', pass: true, msg: 'no emission below nu0; V_stop slope = h/e' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'frequency', label: 'Light frequency', value: st.freq || 0, format: 'float' },
      { key: 'intensity', label: 'Light intensity', value: st.intensity || 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  return [{ key: 'photoelectric-threshold', label: 'hf >= work-function', value: 'pass', status: 'pass' }];
};
