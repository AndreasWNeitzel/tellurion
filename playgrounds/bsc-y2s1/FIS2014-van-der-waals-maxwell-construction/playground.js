// Van der Waals fluid shown as a real piston-cylinder: compress an
// isotherm and the gas condenses, a liquid meniscus rises by the lever
// rule, the pressure sticks on the Maxwell plateau, then the liquid is
// nearly incompressible. Above the critical temperature the meniscus
// never forms. The side panel is the p-V S-curve with the Maxwell line
// and the binodal/spinodal envelope. Reference: Callen, Thermodynamics
// (2nd ed.), Sec. 3.6.

import { pVdW, observedP, maxwell, spinodal, liquidFraction, criticalPoint } from './sim.js';
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

const PERIOD = 10;                 // seconds for one compress+expand cycle
const VMIN = 0.55, VMAX = 7.0;     // swept reduced volume range
const NP = 520;
const READOUTS = ['T_r', 'V_r', 'p_r', 'x_liq', 'phase', 'p_co'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { T: 0.92, V: 2.5, auto: 1, t: 0, _lastV: 2.5 };
let running = !prefersReducedMotion();

// Fixed particle identities (seeded once): a stable condensation rank
// so the same molecules join the liquid first as V shrinks, plus phase
// offsets for gas jitter.
let baseRank = new Float64Array(NP), phx = new Float64Array(NP), phy = new Float64Array(NP), lat = new Float64Array(NP);
function seedParticles() {
  const rng = makeRng(DEFAULT_SEED);
  for (let i = 0; i < NP; i += 1) { baseRank[i] = rng(); phx[i] = rng() * Math.PI * 2; phy[i] = rng() * Math.PI * 2; lat[i] = rng(); }
}
seedParticles();

function currentV() {
  if (!st.auto) return st.V;
  const ph = (st.t / PERIOD) % 1;                       // 0..1 over a cycle
  const s = 0.5 - 0.5 * Math.cos(2 * Math.PI * ph);     // 0 at gas, 1 at liquid
  return Math.exp(Math.log(VMAX) + (Math.log(VMIN) - Math.log(VMAX)) * s);
}

// geometry
const CX = 44, CY = 36, CW = 300, CH = 528;             // cylinder interior
const PX = 432, PY = 182, PW = 404, PH = 358;           // p-V plot rect (clears the HUD)
const P_PMAX = 1.6, lnVmin = Math.log(0.38), lnVmax = Math.log(9);
const vX = (V) => PX + ((Math.log(V) - lnVmin) / (lnVmax - lnVmin)) * PW;
const pY = (p) => PY + PH - (Math.max(0, Math.min(P_PMAX, p)) / P_PMAX) * PH;

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const T = st.T, V = currentV();
  const m = maxwell(T);
  const xL = liquidFraction(V, T);
  const pObs = observedP(V, T);
  const sup = T >= 1;
  const twoPhase = !!m && V > m.Vl && V < m.Vg;

  // primary scene: piston-cylinder. The piston height encodes V; the
  // liquid pool fills the bottom of the contained space by the lever
  // rule and always sits under the piston.
  const floorY = CY + CH;
  const pistonTh = 13;
  const frac = Math.min(1, Math.max(0, (Math.log(V) - Math.log(VMIN)) / (Math.log(VMAX) - Math.log(VMIN))));
  const pistonY = floorY - pistonTh - (0.10 + 0.88 * frac) * (CH - pistonTh);
  ctx.fillStyle = '#0c0f16'; ctx.fillRect(CX, CY, CW, CH);
  const availH = floorY - (pistonY + pistonTh);
  const liqH = sup ? 0 : Math.min(availH, xL * availH * 0.92);
  if (liqH > 1) {
    const gld = ctx.createLinearGradient(0, floorY - liqH, 0, floorY);
    gld.addColorStop(0, 'rgba(70,150,180,0.55)'); gld.addColorStop(1, 'rgba(40,110,150,0.85)');
    ctx.fillStyle = gld; ctx.fillRect(CX, floorY - liqH, CW, liqH);
    ctx.strokeStyle = 'rgba(150,210,230,0.9)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 40; i += 1) { const xx = CX + (i / 40) * CW; const yy = floorY - liqH + 3 * Math.sin(i * 0.5 + st.t); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
    ctx.stroke(); ctx.lineWidth = 1;
  }
  // molecules: liquid ones packed in the pool, gas ones agitated above
  const gasTop = pistonY + pistonTh + 4, gasBot = floorY - liqH;
  for (let i = 0; i < NP; i += 1) {
    const isLiq = !sup && baseRank[i] < xL;
    if (isLiq && liqH > 2) {
      const cols = 26, row = Math.floor((i % NP) / cols), col = i % cols;
      const px = CX + 8 + (col + 0.5) * ((CW - 16) / cols) + 2.2 * Math.sin(st.t * 2 + phx[i]);
      const py = floorY - 6 - (row % Math.max(1, Math.floor(liqH / 9))) * 9 - 2 * Math.cos(st.t * 2 + phy[i]);
      const pyc = Math.max(floorY - liqH + 4, Math.min(py, floorY - 4));
      ctx.fillStyle = '#8fd6e6'; ctx.beginPath(); ctx.arc(px, pyc, 2.4, 0, 7); ctx.fill();
    } else {
      const span = Math.max(10, gasBot - gasTop);
      const gx = CX + 8 + (((lat[i] * 1.7 + 0.13 * Math.sin(st.t * 1.3 + phx[i])) % 1) + 1) % 1 * (CW - 16);
      const gy = gasTop + ((((baseRank[i] * 2.3 + 0.18 * Math.sin(st.t * 1.7 + phy[i])) % 1) + 1) % 1) * span;
      ctx.fillStyle = sup ? 'rgba(210,180,120,0.8)' : 'rgba(190,170,150,0.7)';
      ctx.beginPath(); ctx.arc(gx, gy, sup ? 2.0 : 1.7, 0, 7); ctx.fill();
    }
  }
  // piston (slab + rod) and cylinder walls
  ctx.fillStyle = '#3a3f4b'; ctx.fillRect(CX - 8, pistonY, CW + 16, pistonTh);
  ctx.fillStyle = '#5a6072'; ctx.fillRect(CX + CW / 2 - 10, pistonY - 40, 20, 40);
  ctx.strokeStyle = 'rgba(220,225,235,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(CX - 8, CY); ctx.lineTo(CX - 8, floorY); ctx.lineTo(CX + CW + 8, floorY); ctx.lineTo(CX + CW + 8, CY); ctx.stroke();
  ctx.lineWidth = 1;
  // force arrows: compression (V decreasing) pushes the piston in
  // (down), expansion pulls it out (up).
  const compressing = (V - st._lastV) < 0; st._lastV = V;
  ctx.strokeStyle = '#d8dce6'; ctx.fillStyle = '#d8dce6'; ctx.lineWidth = 2;
  for (const fx of [CX + CW * 0.22, CX + CW * 0.78]) {
    const ya = pistonY - 60, yb = pistonY - 34;
    ctx.beginPath(); ctx.moveTo(fx, ya); ctx.lineTo(fx, yb); ctx.stroke();
    const tip = compressing ? yb : ya, s = compressing ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(fx, tip); ctx.lineTo(fx - 4, tip + s * 7); ctx.lineTo(fx + 4, tip + s * 7); ctx.closePath(); ctx.fill();
  }
  ctx.lineWidth = 1;
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(sup ? 'supercritical fluid' : twoPhase ? 'liquid + vapour' : (xL > 0.5 ? 'compressed liquid' : 'vapour'), CX + CW / 2, floorY + 20);
  ctx.textAlign = 'left';

  // side panel: p-V isotherm, Maxwell line, envelope
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = 'rgba(200,205,215,0.35)'; ctx.strokeRect(PX, PY, PW, PH);
  const bl = [], bg = [], spinL = [], spinR = [];
  for (let TT = 0.62; TT < 1.0; TT += 0.02) { const mm = maxwell(TT), ss = spinodal(TT); if (mm) { bl.push([mm.Vl, mm.pco]); bg.push([mm.Vg, mm.pco]); spinL.push([ss.Vsl, pVdW(ss.Vsl, TT)]); spinR.push([ss.Vsg, pVdW(ss.Vsg, TT)]); } }
  const drawCurve = (arr, color, w = 1) => { if (!arr.length) return; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); arr.forEach(([V0, p0], k) => { const X = vX(V0), Y = pY(p0); k === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }); ctx.stroke(); ctx.lineWidth = 1; };
  drawCurve(bl.slice().sort((a, b) => a[0] - b[0]).concat(bg.slice().sort((a, b) => b[0] - a[0])), 'rgba(120,170,255,0.5)', 1.5);
  drawCurve(spinL.slice().sort((a, b) => a[0] - b[0]), 'rgba(255,140,120,0.4)');
  drawCurve(spinR.slice().sort((a, b) => a[0] - b[0]), 'rgba(255,140,120,0.4)');
  // current isotherm (raw vdW S-curve)
  ctx.strokeStyle = '#e8c84a'; ctx.lineWidth = 2; ctx.beginPath();
  let first = true;
  for (let lv = lnVmin; lv <= lnVmax; lv += (lnVmax - lnVmin) / 400) { const Vv = Math.exp(lv); const pp = pVdW(Vv, T); if (pp < -0.2 || pp > P_PMAX * 1.4) { first = true; continue; } const X = vX(Vv), Y = pY(pp); first ? (ctx.moveTo(X, Y), first = false) : ctx.lineTo(X, Y); }
  ctx.stroke(); ctx.lineWidth = 1;
  // Maxwell coexistence line
  if (m) { ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(vX(m.Vl), pY(m.pco)); ctx.lineTo(vX(m.Vg), pY(m.pco)); ctx.stroke(); ctx.lineWidth = 1; ctx.fillStyle = '#7fd6ff'; for (const Vp of [m.Vl, m.Vg]) { ctx.beginPath(); ctx.arc(vX(Vp), pY(m.pco), 3, 0, 7); ctx.fill(); } }
  // operating point (off-scale high p in the incompressible liquid is
  // flagged with a marker at the top rail rather than a pinned dot)
  ctx.fillStyle = '#ff5d5d';
  if (pObs > P_PMAX) {
    const xx = vX(V);
    ctx.beginPath(); ctx.moveTo(xx, PY + 4); ctx.lineTo(xx - 6, PY + 15); ctx.lineTo(xx + 6, PY + 15); ctx.closePath(); ctx.fill();
    ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.fillText('p off-scale', xx, PY + 27);
  } else {
    ctx.beginPath(); ctx.arc(vX(V), pY(pObs), 5, 0, 7); ctx.fill();
  }
  // axes labels + legend
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('reduced volume  V / Vc  (log)', PX + PW / 2, PY + PH + 26);
  ctx.save(); ctx.translate(PX - 24, PY + PH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('reduced pressure  p / pc', 0, 0); ctx.restore();
  ctx.textAlign = 'left'; ctx.font = fontString(canvas, 'caption', 'mono');
  const lg = [['#e8c84a', 'vdW isotherm'], ['#7fd6ff', 'Maxwell'], ['rgba(120,170,255,0.8)', 'binodal'], ['rgba(255,140,120,0.8)', 'spinodal']];
  lg.forEach(([c, txt], k) => { const ly = PY + PH - 56 + k * 15; ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(PX + 12, ly); ctx.lineTo(PX + 32, ly); ctx.stroke(); ctx.fillStyle = '#c8ccd6'; ctx.fillText(txt, PX + 38, ly + 4); });
  ctx.lineWidth = 1;

  rEls['T_r'].textContent = T.toFixed(3);
  rEls['V_r'].textContent = V.toFixed(3);
  rEls['p_r'].textContent = pObs.toFixed(4);
  rEls['x_liq'].textContent = (sup ? 0 : xL).toFixed(3);
  rEls['phase'].textContent = sup ? 'supercrit' : twoPhase ? 'two-phase' : (xL > 0.5 ? 'liquid' : 'vapour');
  rEls['p_co'].textContent = m ? m.pco.toFixed(4) : 'n/a';
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt = v => v.toFixed(2)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
function buildSelect(label, opts, key) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = String(v); o.textContent = t; sel.appendChild(o); }
  sel.value = String(st[key]);
  sel.addEventListener('change', () => { st[key] = parseFloat(sel.value); render(); });
  const sp = document.createElement('span'); sp.className = 'value';
  row.appendChild(lab); row.appendChild(sel); row.appendChild(sp);
  controlsEl.appendChild(row); return sel;
}

const cT = buildSlider('temperature T/Tc', 0.70, 1.20, 0.005, st.T, 'T', v => v.toFixed(3));
const cV = buildSlider('volume V/Vc', VMIN, VMAX, 0.02, st.V, 'V', v => v.toFixed(2));
const cAuto = buildSelect('motion', [[1, 'auto compress cycle'], [0, 'manual V slider']], 'auto');
// Grabbing the volume slider drops out of the auto cycle so the scrub
// takes effect.
cV.inp.addEventListener('input', () => { if (st.auto) { st.auto = 0; cAuto.value = '0'; render(); } });
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { T: 0.92, V: 2.5, auto: 1, t: 0, _lastV: 2.5 }); seedParticles();
  cT.inp.value = '0.92'; cT.val.textContent = '0.920'; cV.inp.value = '2.5'; cV.val.textContent = '2.50';
  cAuto.value = '1';
  running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

// loop and capture
let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (running) st.t += dr;
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) st.t = CAPTURE_FRAC * PERIOD;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const { Vc, Tc } = criticalPoint();
  const m = maxwell(0.9);
  const eqP = Math.abs(pVdW(m.Vl, 0.9) - pVdW(m.Vg, 0.9));
  if (Math.abs(m.area) > 1e-4 || eqP > 1e-4) return { name: 'Maxwell equal area', pass: false, msg: `area=${m.area.toExponential(2)}` };
  if (Math.abs(pVdW(Vc, Tc) - 1) > 1e-9) return { name: 'critical point', pass: false, msg: 'pc != 1' };
  return { name: 'Maxwell + critical point', pass: true, msg: `area ${Math.abs(m.area).toExponential(1)}, p(Vl)=p(Vg) ${eqP.toExponential(1)}` };
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
