// Hydrogen under electric (Stark) and magnetic (Zeeman) fields. The
// primary scene is the physical term diagram: the n = 1..4 Rydberg
// levels fan into sublevels as the fields ramp, with the chosen
// transition drawn; beside it the synthetic spectrum shows the line
// splitting a spectrometer would record (a normal-Zeeman triplet, a
// Stark multiplet). The ground state shows the headline result: no
// first-order Stark shift. Numerics in sim.js. Reference: Griffiths,
// Introduction to Quantum Mechanics (3rd ed.), Ch. 6.

import { energyLevel, sublevels, spectrumLines, zeemanTriplet, MU_B } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['line', 'B (T)', 'F (a.u.)', 'split dE', 'lines', 'Stark n1'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const TRANS = [[2, 1, 'Lyman-alpha 2->1'], [3, 2, 'Balmer-alpha 3->2'], [4, 2, 'Balmer-beta 4->2'], [4, 3, 'Paschen 4->3']];
const st = { ti: 1, B: 4, F: 2, t: 0, running: 1 };
function curB() { return st.running ? st.B * (0.55 + 0.45 * (0.5 - 0.5 * Math.cos(st.t * 0.6))) : st.B; }
function curF() { return st.running ? st.F * (0.55 + 0.45 * (0.5 - 0.5 * Math.cos(st.t * 0.6 + 1.7))) : st.F; }

// geometry
const DX = 26, DY = 50, DW = 360, DH = 470;       // term diagram
const SX = 410, SY = 50, SW = 274, SH = 470;      // synthetic spectrum (clears the HUD)

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const [nU, nL, label] = TRANS[st.ti], B = curB(), F = curF();

  // term diagram: energy axis (eV), levels n=1..4 fanning into sublevels
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(DX, DY, DW, DH);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(DX, DY, DW, DH);
  const Emin = -13.9, Emax = 0.3;
  const ey = (E) => DY + 18 + ((Emax - E) / (Emax - Emin)) * (DH - 36);
  // Zeeman and Stark shifts differ by orders of magnitude, so each
  // level's fan is auto-normalised to a fixed pixel spread (the term
  // diagram is schematic; true magnitudes are in the readout and the
  // zoomed spectrum panel).
  const FAN = 17;
  for (let n = 1; n <= 4; n += 1) {
    const subs = sublevels(n, B, F).map(s => s.E - energyLevel(n));
    let mxd = 0; for (const d of subs) mxd = Math.max(mxd, Math.abs(d));
    const y0 = ey(energyLevel(n));
    ctx.strokeStyle = 'rgba(150,160,180,0.35)';
    ctx.beginPath(); ctx.moveTo(DX + 10, y0); ctx.lineTo(DX + DW - 60, y0); ctx.stroke();
    ctx.fillStyle = '#9aa0ad'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`n=${n}`, DX + DW - 52, y0 + 4);
    const onU = n === nU, onL = n === nL;
    for (const d of subs) {
      const yy = y0 - (mxd > 1e-12 ? (d / mxd) * FAN : 0);
      ctx.strokeStyle = onU ? '#ffd24a' : onL ? '#7fd6ff' : 'rgba(200,205,215,0.55)';
      ctx.lineWidth = (onU || onL) ? 1.8 : 1;
      ctx.beginPath(); ctx.moveTo(DX + 24, yy); ctx.lineTo(DX + DW - 70, yy); ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
  // transition arrow (upper -> lower)
  const yU = ey(energyLevel(nU)), yL = ey(energyLevel(nL)), ax = DX + 40;
  ctx.strokeStyle = '#ff8a5d'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ax, yU); ctx.lineTo(ax, yL); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax, yL); ctx.lineTo(ax - 5, yL - 8); ctx.lineTo(ax + 5, yL - 8); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 1;
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`hydrogen term diagram (${label})`, DX + DW / 2, DY + DH + 18);
  ctx.fillStyle = '#ff8a8a'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('n=1: no linear Stark', DX + 24, ey(energyLevel(1)) + 22);
  ctx.textAlign = 'left';

  // synthetic spectrum: the emission line and its field-split multiplet
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(SX, SY, SW, SH);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(SX, SY, SW, SH);
  ctx.fillStyle = '#c8ccd6'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('synthetic spectrum', SX + SW / 2, SY - 8);
  const lines = spectrumLines(nU, nL, B, F);
  const E0 = energyLevel(nU) - energyLevel(nL);
  let span = 0; for (const e of lines) span = Math.max(span, Math.abs(e - E0));
  span = Math.max(span, 1e-5) * 1.25;
  const lx = (e) => SX + SW / 2 + ((e - E0) / span) * (SW / 2 - 24);
  // a wavelength-style strip
  const stripY = SY + 70, stripH = 260;
  ctx.fillStyle = 'rgba(20,22,30,0.9)'; ctx.fillRect(SX + 14, stripY, SW - 28, stripH);
  ctx.strokeStyle = 'rgba(120,130,150,0.4)'; ctx.strokeRect(SX + 14, stripY, SW - 28, stripH);
  // unsplit reference (faint, dashed)
  ctx.strokeStyle = 'rgba(150,160,180,0.4)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(lx(E0), stripY); ctx.lineTo(lx(E0), stripY + stripH); ctx.stroke(); ctx.setLineDash([]);
  for (const e of lines) {
    ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(lx(e), stripY + 6); ctx.lineTo(lx(e), stripY + stripH - 6); ctx.stroke();
  }
  ctx.lineWidth = 1;
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`E0 = ${E0.toFixed(3)} eV`, lx(E0), stripY + stripH + 18);
  ctx.fillText(`${lines.length} component${lines.length === 1 ? '' : 's'}  (split <- 0 -> )`, SX + SW / 2, stripY - 8);
  ctx.fillStyle = '#9aa0ad'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('B = Zeeman triplet,  F = Stark multiplet', SX + SW / 2, SY + SH + 18);
  ctx.textAlign = 'left';

  const tz = zeemanTriplet(E0, B);
  rEls['line'].textContent = label.split(' ')[0];
  rEls['B (T)'].textContent = B.toFixed(2);
  rEls['F (a.u.)'].textContent = F.toFixed(2);
  rEls['split dE'].textContent = (tz[2] - tz[0]).toExponential(2);
  rEls['lines'].textContent = String(lines.length);
  rEls['Stark n1'].textContent = '0 (none)';
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
const tRow = document.createElement('div'); tRow.className = 'row';
const tLab = document.createElement('span'); tLab.className = 'label'; tLab.textContent = 'transition';
const tSel = document.createElement('select'); tSel.setAttribute('aria-label', 'transition');
TRANS.forEach(([u, l, lab], i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = lab; tSel.appendChild(o); void u; void l; });
tSel.value = '1';
tSel.addEventListener('change', () => { st.ti = parseInt(tSel.value, 10); render(); });
tRow.appendChild(tLab); tRow.appendChild(tSel); const tsp = document.createElement('span'); tsp.className = 'value'; tRow.appendChild(tsp);
controlsEl.appendChild(tRow);
const cB = buildSlider('Zeeman B (T)', 0, 12, 0.2, st.B, 'B', v => v.toFixed(1));
const cF = buildSlider('Stark field F', 0, 6, 0.1, st.F, 'F', v => v.toFixed(1));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { ti: 1, B: 4, F: 2, t: 0, running: 1 });
  tSel.value = '1'; cB.inp.value = '4'; cB.val.textContent = '4.0'; cF.inp.value = '2'; cF.val.textContent = '2.0';
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
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * 10 : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const s1 = sublevels(1, 0, 5).map(z => z.E);
  if (Math.max(...s1) - Math.min(...s1) !== 0) return { name: 'no n=1 linear Stark', pass: false, msg: 'n=1 split' };
  const tz = zeemanTriplet(10.2, 4);
  if (Math.abs((tz[2] - tz[0]) - 2 * MU_B * 4) > 1e-12) return { name: 'Zeeman triplet', pass: false, msg: 'spacing wrong' };
  return { name: 'no 1st-order Stark n=1; Zeeman ~ B', pass: true, msg: 'triplet spacing 2 mu_B B' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
