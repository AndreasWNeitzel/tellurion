// Cosmic distance ladder as one logarithmic ruler of the universe.
// The horizontal axis is log10(distance) from 1 pc to 10 Gpc with
// labelled unit ticks. Each rung is its real working RANGE, drawn so
// neighbours overlap: that overlap is the calibration handoff (each
// method is anchored on the one below it). Real objects sit at their
// true distances. Drag the target cursor: it names the method that
// reaches that distance and the cumulative fractional error of the
// chain needed to get there (errors add in quadrature down the
// ladder). Reference: Weinberg, Cosmology (2008), Sec. 1.6; Freedman
// and Madore, ARA&A 48, 673 (2010).
import { dParallax, MVCepheid, dHubble, ladder, H0 } from './sim.js';
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
const W = canvas.width, H = canvas.height;
const DEF = { parallax: 100, cepheidP: 30, snApparent: 16, z: 0.05 };
const state = { ...DEF, targetLog: 6.0, phase: 0, dragging: false };
let running = !prefersReducedMotion();

const AX = { x0: 70, x1: W - 40, lo: 0, hi: 10 };          // log10(d / pc)
const RY = 250;                                            // ruler y
const xOf = (logpc) => AX.x0 + (Math.max(AX.lo, Math.min(AX.hi, logpc)) - AX.lo) / (AX.hi - AX.lo) * (AX.x1 - AX.x0);
const xOfPc = (pc) => xOf(Math.log10(Math.max(1, pc)));
const logFromX = (px) => AX.lo + (px - AX.x0) / (AX.x1 - AX.x0) * (AX.hi - AX.lo);
function fmtPc(pc) {
  if (pc < 1e3) return `${pc.toFixed(1)} pc`;
  if (pc < 1e6) return `${(pc / 1e3).toFixed(2)} kpc`;
  if (pc < 1e9) return `${(pc / 1e6).toFixed(2)} Mpc`;
  return `${(pc / 1e9).toFixed(2)} Gpc`;
}
// Text with a dark halo so labels stay legible over the coloured bars.
function lbl(s, x, y) {
  ctx.save();
  ctx.shadowColor = 'rgba(6,9,16,0.95)'; ctx.shadowBlur = 4;
  ctx.fillText(s, x, y); ctx.fillText(s, x, y);
  ctx.restore();
}
// Rung working ranges (log10 pc) and the colour; ranges deliberately
// overlap their neighbour, which is where the calibration is passed up.
const RUNGS = [
  { name: 'Trigonometric parallax', lo: 0.0, hi: 3.5, yc: RY + 58, color: '#f5c842', err: 0.02 },
  { name: 'Cepheid period-luminosity', lo: 3.0, hi: 7.5, yc: RY + 96, color: '#4f9cf9', err: 0.05 },
  { name: 'Type Ia supernova', lo: 6.5, hi: 9.5, yc: RY + 134, color: '#f59e6e', err: 0.07 },
  { name: 'Hubble flow  v = H0 d', lo: 7.5, hi: 10.0, yc: RY + 172, color: '#b48bff', err: 0.10 },
];
// Real signposts at true distances (pc).
const OBJ = [
  { d: 1.30, n: 'Proxima Cen' }, { d: 47, n: 'Hyades' }, { d: 8000, n: 'Galactic centre' },
  { d: 5.0e4, n: 'LMC' }, { d: 7.7e5, n: 'M31' }, { d: 1.65e7, n: 'Virgo cluster' },
  { d: 1.0e8, n: 'Coma cluster' }, { d: 2.0e9, n: 'distant SN Ia' }, { d: 9.0e9, n: 'faint galaxies' },
];

// Fractional error to reach a distance: the chain of rungs from
// parallax up to the one covering log d, combined in quadrature
// (each rung is calibrated on the previous, so the errors compound).
function cumErr(logpc) {
  let s = 0;
  for (const r of RUNGS) {
    if (r.lo > logpc + 1e-9) break;
    const reach = Math.min(logpc, r.hi);
    const edge = 1 + 1.4 * Math.max(0, (reach - (r.lo + r.hi) / 2)) / ((r.hi - r.lo) / 2);
    s += (r.err * edge) ** 2;
  }
  return Math.sqrt(s);
}
function activeRungs(logpc) { return RUNGS.filter((r) => logpc >= r.lo - 1e-9 && logpc <= r.hi + 1e-9); }

function render() {
  if (!CAPTURE_NAME && running) {
    state.phase += 0.02;
    if (!state.dragging) state.targetLog = 5.2 + 4.4 * (0.5 + 0.5 * Math.sin(state.phase * 0.5));
  }
  ctx.fillStyle = '#080b14'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'heading');
  ctx.fillText('Cosmic distance ladder: one logarithmic ruler of the universe', 18, 28);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption');
  ctx.fillText('Each method has a working range; neighbours overlap, and that overlap is where the calibration is handed up.', 18, 48);

  // signpost objects above the ruler
  for (const o of OBJ) {
    const x = xOfPc(o.d);
    const tw = running ? 0.6 + 0.4 * Math.sin(state.phase + o.d) : 1;
    ctx.fillStyle = `rgba(226,232,240,${0.5 + 0.4 * tw})`;
    ctx.beginPath(); ctx.arc(x, RY - 70, 2.6, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(100,116,139,0.4)'; ctx.beginPath(); ctx.moveTo(x, RY - 66); ctx.lineTo(x, RY - 6); ctx.stroke();
    ctx.save(); ctx.translate(x, RY - 76); ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono'); lbl(o.n, 0, 0); ctx.restore();
  }
  // the ruler + labelled unit ticks
  ctx.strokeStyle = 'rgba(226,232,240,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(AX.x0, RY); ctx.lineTo(AX.x1, RY); ctx.stroke(); ctx.lineWidth = 1;
  const TICKS = [[0, '1 pc'], [1, '10 pc'], [2, '100 pc'], [3, '1 kpc'], [4, '10 kpc'], [5, '100 kpc'], [6, '1 Mpc'], [7, '10 Mpc'], [8, '100 Mpc'], [9, '1 Gpc'], [10, '10 Gpc']];
  ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono');
  for (const [L, lab] of TICKS) {
    const x = xOf(L);
    ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.beginPath(); ctx.moveTo(x, RY - 6); ctx.lineTo(x, RY + 6); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.fillText(lab, x, RY + 20);
  }
  ctx.textAlign = 'left';

  // rung range bars with overlap shading
  for (let i = 0; i < RUNGS.length; i += 1) {
    const r = RUNGS[i];
    const xa = xOf(r.lo), xb = xOf(r.hi);
    ctx.fillStyle = r.color + '33';
    ctx.fillRect(xa, r.yc - 8, xb - xa, 16);
    ctx.strokeStyle = r.color; ctx.lineWidth = 1.4; ctx.strokeRect(xa, r.yc - 8, xb - xa, 16); ctx.lineWidth = 1;
    if (i > 0) {                                           // overlap with the rung below
      const p = RUNGS[i - 1];
      const oa = xOf(Math.max(r.lo, p.lo)), ob = xOf(Math.min(r.hi, p.hi));
      if (ob > oa) {
        ctx.fillStyle = 'rgba(245,200,66,0.14)';
        ctx.fillRect(oa, p.yc + 8, ob - oa, (r.yc - 8) - (p.yc + 8));
        ctx.fillStyle = '#e8c878'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
        lbl('calibration handed up', (oa + ob) / 2, (p.yc + r.yc) / 2 + 3); ctx.textAlign = 'left';
      }
    }
    ctx.fillStyle = '#e2e8f0'; ctx.font = fontString(canvas, 'caption');
    lbl(`${r.name}`, xa + 4, r.yc - 13);
    ctx.fillStyle = '#94a3b8'; ctx.font = fontString(canvas, 'caption', 'mono');
    lbl(`${fmtPc(Math.pow(10, r.lo))} - ${fmtPc(Math.pow(10, r.hi))}`, xa + 4, r.yc + 22);
    // the slider-driven anchor for this rung (where its physics is set)
    const anchorPc = ladder(state)[i];
    const ax = xOfPc(anchorPc);
    if (ax >= xa - 2 && ax <= xb + 2) {
      ctx.fillStyle = r.color; ctx.beginPath(); ctx.arc(ax, r.yc, 4.5, 0, 6.2832); ctx.fill();
    }
  }

  // draggable target cursor + cumulative error
  const cx = xOf(state.targetLog);
  const errF = cumErr(state.targetLog);
  const dLogErr = Math.log10(1 + errF);                    // half-width in dex
  const ex0 = xOf(state.targetLog - dLogErr), ex1 = xOf(state.targetLog + dLogErr);
  const cyTop = RY - 86, cyBot = RY + 186;
  ctx.fillStyle = 'rgba(245,200,66,0.15)'; ctx.fillRect(ex0, cyTop, ex1 - ex0, cyBot - cyTop);
  ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cyTop); ctx.lineTo(cx, cyBot); ctx.stroke();
  ctx.fillStyle = '#f5c842'; ctx.beginPath(); ctx.arc(cx, RY, 6, 0, 6.2832); ctx.fill(); ctx.lineWidth = 1;
  const dpc = Math.pow(10, state.targetLog);
  const act = activeRungs(state.targetLog);
  const lx = Math.max(AX.x0 + 78, Math.min(AX.x1 - 82, cx));   // keep label clear of edges and the readout panel
  ctx.fillStyle = '#f5c842'; ctx.font = fontString(canvas, 'body', 'mono', 600); ctx.textAlign = 'center';
  lbl(`${fmtPc(dpc)}   +/- ${(errF * 100).toFixed(0)}%`, lx, RY - 94);
  ctx.textAlign = 'left';

  // diagnostic strip: cumulative fractional error vs distance
  const dy = H - 96, dh = 78;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(AX.x0, dy, AX.x1 - AX.x0, dh);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(AX.x0 + 0.5, dy + 0.5, AX.x1 - AX.x0 - 1, dh - 1);
  ctx.fillStyle = '#64748b'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('cumulative distance error climbing the ladder (diagnostic)', AX.x0 + 8, dy + 14);
  ctx.strokeStyle = '#4f9cf9'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let k = 0; k <= 200; k += 1) {
    const lg = AX.lo + (AX.hi - AX.lo) * k / 200;
    const e = Math.min(0.5, cumErr(lg));
    const xx = xOf(lg), yy = dy + dh - 8 - (e / 0.5) * (dh - 22);
    if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke(); ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(245,200,66,0.6)'; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(cx, dy); ctx.lineTo(cx, dy + dh); ctx.stroke(); ctx.setLineDash([]);

  readoutEl.innerHTML =
    `<span class="label">target</span><span class="value">${fmtPc(dpc)}</span>` +
    `<span class="label">method</span><span class="value">${act.length ? act[act.length - 1].name.split(' ')[0] : '-'}</span>` +
    `<span class="label">cum. error</span><span class="value">${(errF * 100).toFixed(1)}%</span>` +
    `<span class="label">H&#8320;</span><span class="value">${H0} km/s/Mpc</span>`;
}

function evLog(e) {
  const r = canvas.getBoundingClientRect();
  return logFromX((e.clientX - r.left) / r.width * W);
}
canvas.addEventListener('pointerdown', (e) => { state.dragging = true; state.targetLog = Math.max(AX.lo, Math.min(AX.hi, evLog(e))); render(); });
canvas.addEventListener('pointermove', (e) => { if (state.dragging) { state.targetLog = Math.max(AX.lo, Math.min(AX.hi, evLog(e))); render(); } });
window.addEventListener('pointerup', () => { state.dragging = false; });

function slider(id, label, min, max, step, key, fmt) {
  const r = document.createElement('div'); r.className = 'row';
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = id; lab.textContent = label;
  const inp = document.createElement('input'); inp.id = id; inp.type = 'range';
  inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(state[key]);
  inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(state[key]);
  inp.addEventListener('input', () => { const v = parseFloat(inp.value); state[key] = v; val.textContent = fmt(v); render(); });
  r.appendChild(lab); r.appendChild(inp); r.appendChild(val);
  controlsEl.appendChild(r);
}
function buildControls() {
  controlsEl.innerHTML = '';
  slider('p', 'parallax (mas)', 1, 800, 1, 'parallax', (v) => v.toFixed(0));
  slider('cep', 'Cepheid P (d)', 1, 100, 1, 'cepheidP', (v) => v.toFixed(0));
  slider('ap', 'SN apparent V', 6, 28, 0.1, 'snApparent', (v) => v.toFixed(1));
  slider('z', 'redshift z', 0.002, 0.4, 0.002, 'z', (v) => v.toFixed(3));
  const row = document.createElement('div'); row.className = 'row buttons';
  const reset = document.createElement('button'); reset.type = 'button'; reset.id = 'btn-reset'; reset.textContent = 'Reset';
  reset.addEventListener('click', () => { Object.assign(state, DEF); state.targetLog = 6.0; buildControls(); render(); });
  const pause = document.createElement('button'); pause.type = 'button'; pause.id = 'btn-pause'; pause.textContent = 'Pause';
  pause.setAttribute('aria-pressed', 'false');
  pause.addEventListener('click', () => { running = !running; pause.textContent = running ? 'Pause' : 'Play'; pause.setAttribute('aria-pressed', String(!running)); });
  row.appendChild(reset); row.appendChild(pause); controlsEl.appendChild(row);
}
buildControls();
let raf;
function tick() { render(); if (!CAPTURE_NAME) raf = requestAnimationFrame(tick); }
if (DETERMINISTIC) {
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    state.targetLog = 1.0 + f * 8.5;                        // sweep across the ladder
    state.dragging = true;
  }
  render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  if (Math.abs(dParallax(1) - 1000) > 1e-6) return { name: 'parallax', pass: false, msg: 'd(1 mas) != 1000 pc' };
  if (Math.abs(dHubble(0.1) / 1e6 - 428.3) > 1) return { name: 'Hubble', pass: false, msg: 'd(z=0.1) wrong' };
  if (Math.abs(MVCepheid(10) + 4.13) > 0.01) return { name: 'Leavitt', pass: false, msg: 'M_V(10 d) wrong' };
  return { name: 'parallax + Cepheid + Hubble', pass: true, msg: `d(1 mas)=1000 pc; M_V(10 d)=-4.13; d(z=0.1)=${(dHubble(0.1) / 1e6).toFixed(0)} Mpc` };
};


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const dists = ladder(state);
  const targetLog = state.targetLog;
  return {
    fields: [
      { key: 'target-distance', label: 'Target distance (pc)', value: Math.pow(10, targetLog).toExponential(2) },
      { key: 'parallax', label: 'Parallax (mas)', value: state.parallax, format: 'float' },
      { key: 'cepheid-period', label: 'Cepheid period (d)', value: state.cepheidP, format: 'float' },
      { key: 'sn-apparent-mag', label: 'SN Ia m_app', value: state.snApparent, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const dists = ladder(state);
  const err = cumErr(state.targetLog);
  const activeRung = activeRungs(state.targetLog)[0];
  return [
    {
      key: 'distance-chain',
      label: 'Cumulative error',
      value: (err * 100).toFixed(1) + '%',
      status: activeRung ? 'pass' : 'pending'
    }
  ];
};
