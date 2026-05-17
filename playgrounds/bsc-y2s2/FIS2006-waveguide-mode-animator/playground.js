// Rectangular-waveguide mode animator. The primary scene is physical:
// the transverse field map of the chosen mode in the a x b cross
// section, and a longitudinal strip showing the wave travelling down
// the guide at the guide wavelength when f > f_c, or decaying
// evanescently with no propagation when f < f_c. The side panel is the
// mode-cutoff spectrum with the operating frequency. Numerics in
// sim.js. Reference: Jackson, Classical Electrodynamics (3rd ed.),
// Ch. 8.

import { cutoffFreq, propagation, fieldAt, modeSpectrum } from './sim.js';
import { rdbu, fieldToImageData } from '../../../shared/js/render/colormaps.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['mode', 'f GHz', 'fc GHz', 'state', 'lam_g', 'beta'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const MODES = [['TE', 1, 0], ['TE', 2, 0], ['TE', 0, 1], ['TE', 1, 1], ['TE', 2, 1], ['TM', 1, 1], ['TM', 2, 1]];
const st = { modeIdx: 0, fGHz: 10, aMM: 22.86, t: 0, running: 1 };
const B_MM = 10.16;                              // fixed guide height (mm)

function curMode() { return MODES[st.modeIdx]; }
function aM() { return st.aMM / 1000; }
function bM() { return B_MM / 1000; }

// geometry
const XX = 30, XY = 56, XW = 360, XH = 200;      // cross-section map
const LX = 30, LY = 300, LW = 540, LH = 150;     // longitudinal strip
const PX = 596, PW = 286, PYp = 196, PHp = 300;  // cutoff spectrum
const GN = 96;
let imgData = new ImageData(GN, Math.round(GN * (B_MM / 22.86)));
const offc = document.createElement('canvas');
const offx = offc.getContext('2d');

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const [type, m, n] = curMode(), a = aM(), b = bM(), f = st.fGHz * 1e9;
  const p = propagation(f, m, n, a, b), fc = p.fc;
  const omega = 2 * Math.PI * 3;                  // animation rate (display)

  // cross-section transverse field map
  const GNX = GN, GNY = Math.max(8, Math.round(GN * (b / a)));
  if (imgData.width !== GNX || imgData.height !== GNY) imgData = new ImageData(GNX, GNY);
  let mx = 1e-9;
  const buf = new Float32Array(GNX * GNY);
  for (let j = 0; j < GNY; j += 1) for (let i = 0; i < GNX; i += 1) {
    const v = fieldAt(type, m, n, (i + 0.5) / GNX * a, (j + 0.5) / GNY * b, a, b);
    buf[j * GNX + i] = v; if (Math.abs(v) > mx) mx = Math.abs(v);
  }
  const tphase = Math.cos(st.t * omega);
  const norm = new Float32Array(GNX * GNY);
  for (let i = 0; i < GNX * GNY; i += 1) norm[i] = (buf[i] / mx) * tphase;
  imgData = fieldToImageData(norm, GNX, GNY, -1, 1, rdbu, imgData);
  offc.width = GNX; offc.height = GNY; offx.putImageData(imgData, 0, 0);
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(XX, XY, XW, XH);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(offc, XX, XY, XW, XH);
  ctx.strokeStyle = 'rgba(220,225,235,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(XX, XY, XW, XH); ctx.lineWidth = 1;
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`cross-section ${type}${m}${n} field (a = ${st.aMM.toFixed(1)} mm, b = ${B_MM} mm)`, XX + XW / 2, XY + XH + 20);
  ctx.textAlign = 'left';

  // longitudinal strip: travelling wave (f > f_c) or evanescent decay
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(LX, LY, LW, LH);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(LX, LY, LW, LH);
  const midY = LY + LH / 2;
  ctx.strokeStyle = 'rgba(150,160,180,0.3)'; ctx.beginPath(); ctx.moveTo(LX, midY); ctx.lineTo(LX + LW, midY); ctx.stroke();
  ctx.lineWidth = 2.2; ctx.beginPath();
  for (let q = 0; q <= LW; q += 1) {
    const z = q / LW;                             // 0..1 along the guide
    let amp;
    if (p.propagating) {
      // the strip spans ~6 broad-wall widths of guide; visible cycles
      // = that length / lambda_g (so near cutoff the wave is long)
      const cycles = (6 * a) / p.lambdaG;
      amp = Math.cos(2 * Math.PI * z * cycles - st.t * omega * 2);
    } else {
      const decay = Math.exp(-z * (3 + 6 * Math.min(1, (fc - f) / fc)));   // evanescent envelope
      amp = decay * Math.cos(st.t * omega * 2);
    }
    const Y = midY - amp * (LH * 0.4);
    q === 0 ? ctx.moveTo(LX + q, Y) : ctx.lineTo(LX + q, Y);
  }
  ctx.strokeStyle = p.propagating ? '#7fd6ff' : '#ff8a78'; ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = p.propagating ? '#7fd6ff' : '#ff8a78'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(p.propagating ? `propagating down the guide (lambda_g = ${(p.lambdaG * 1000).toFixed(1)} mm)` : `below cutoff: evanescent, no propagation`, LX + LW / 2, LY + LH + 22);
  ctx.textAlign = 'left';

  // cutoff spectrum panel
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(PX, PYp, PW, PHp);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(PX, PYp, PW, PHp);
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('mode cutoff spectrum', PX + PW / 2, PYp - 6);
  const spec = modeSpectrum(a, b).slice(0, 10);
  const fMaxG = Math.max(st.fGHz * 1.15, spec[spec.length - 1].fc / 1e9 * 1.05);
  const fx = (gHz) => PX + 64 + (gHz / fMaxG) * (PW - 78);
  spec.forEach((s, k) => {
    const y = PYp + 22 + k * 26, on = s.fc <= f;
    ctx.fillStyle = on ? '#7fd6ff' : '#9aa0ad'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`${s.type}${s.m}${s.n}`, PX + 10, y + 4);
    ctx.strokeStyle = 'rgba(150,160,180,0.25)'; ctx.beginPath(); ctx.moveTo(fx(0), y); ctx.lineTo(fx(fMaxG), y); ctx.stroke();
    ctx.fillStyle = on ? 'rgba(127,214,255,0.85)' : 'rgba(255,138,120,0.7)';
    ctx.beginPath(); ctx.arc(fx(s.fc / 1e9), y, 4, 0, 6.2832); ctx.fill();
  });
  // operating-frequency line
  ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(fx(st.fGHz), PYp + 8); ctx.lineTo(fx(st.fGHz), PYp + PHp - 18); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#ffd24a'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`f = ${st.fGHz.toFixed(1)} GHz`, fx(st.fGHz), PYp + PHp - 4);
  ctx.fillText('cutoff (blue = propagates)', PX + PW / 2, PYp + PHp + 14);
  ctx.textAlign = 'left';

  rEls['mode'].textContent = `${type}${m}${n}`;
  rEls['f GHz'].textContent = st.fGHz.toFixed(2);
  rEls['fc GHz'].textContent = (fc / 1e9).toFixed(3);
  rEls['state'].textContent = p.propagating ? 'propagat' : 'evanesc';
  rEls['lam_g'].textContent = p.propagating ? (p.lambdaG * 1000).toFixed(1) : 'inf';
  rEls['beta'].textContent = p.propagating ? p.beta.toFixed(0) : `a${p.alpha.toFixed(0)}`;
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
const mLab = document.createElement('span'); mLab.className = 'label'; mLab.textContent = 'mode';
const mSel = document.createElement('select'); mSel.setAttribute('aria-label', 'mode');
MODES.forEach(([t, m, n], i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = `${t}${m}${n}`; mSel.appendChild(o); });
mSel.value = '0';
mSel.addEventListener('change', () => { st.modeIdx = parseInt(mSel.value, 10); render(); });
mRow.appendChild(mLab); mRow.appendChild(mSel); const msp = document.createElement('span'); msp.className = 'value'; mRow.appendChild(msp);
controlsEl.appendChild(mRow);
const cF = buildSlider('frequency (GHz)', 2, 30, 0.1, st.fGHz, 'fGHz', v => v.toFixed(1));
const cA = buildSlider('broad wall a (mm)', 12, 40, 0.5, st.aMM, 'aMM', v => v.toFixed(1));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { modeIdx: 0, fGHz: 10, aMM: 22.86, t: 0, running: 1 });
  mSel.value = '0'; cF.inp.value = '10'; cF.val.textContent = '10.0'; cA.inp.value = '22.86'; cA.val.textContent = '22.9';
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
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * 2 : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const a = 0.02286, b = 0.01016;
  if (Math.abs(cutoffFreq(1, 0, a, b) - 2.99792458e8 / (2 * a)) > 1) return { name: 'cutoff', pass: false, msg: 'fc10 wrong' };
  const fc = cutoffFreq(1, 0, a, b);
  if (propagation(0.7 * fc, 1, 0, a, b).propagating || !propagation(1.5 * fc, 1, 0, a, b).propagating) return { name: 'cutoff behaviour', pass: false, msg: 'prop/evan flip wrong' };
  return { name: 'cutoff f_c=(c/2)sqrt((m/a)^2+(n/b)^2), TE10 dominant', pass: true, msg: 'propagating above, evanescent below' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
