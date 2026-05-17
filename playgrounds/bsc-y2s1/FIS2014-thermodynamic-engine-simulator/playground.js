// Thermodynamic engine hero. LEFT: a piston-cylinder with gas molecules
// whose speeds track the live temperature and a piston tracking the
// volume, with glowing hot/cold reservoirs. CENTRE: the P-V loop traced
// with a moving operating point. RIGHT: an energy-flow diagram
// (Q_hot -> W + Q_cold) with the live efficiency. Cycles and reverse
// (refrigerator) come from the headless sim.js.
// Reference: Callen, Thermodynamics (2nd ed.), Ch. 4; Reif, Ch. 5.

import { cycleStates, analysis, sampleSeg, carnotEff } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['cycle', 'eff', 'eff_Carnot', 'W net', 'mode'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = { type: 'carnot', Th: 650, Tc: 300, r: 4, reverse: false, phase: 0 };
let segs = cycleStates(st), loop = buildLoop(), anal = analysis(segs);
function buildLoop() {
  const pts = [];
  for (const s of cycleStates(st)) for (const p of sampleSeg(s, 5 / 3, 30)) pts.push({ V: p[0], P: p[1], proc: s.proc, T0: s.s.T, T1: s.e.T, Q: s.Q });
  return pts;
}
function rebuild() { segs = cycleStates(st); loop = buildLoop(); anal = analysis(segs); }

function selectRow(label, opts, value, onChange) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const s = document.createElement('select'); s.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; s.appendChild(o); }
  s.value = value; s.addEventListener('change', () => onChange(s.value));
  row.appendChild(lab); row.appendChild(s); const sp = document.createElement('span'); sp.className = 'value'; row.appendChild(sp);
  controlsEl.appendChild(row); return s;
}
function slider(label, min, max, stp, val, key, fmt = v => v.toFixed(0)) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(val); inp.setAttribute('aria-label', label);
  const vEl = document.createElement('span'); vEl.className = 'value'; vEl.textContent = fmt(+val);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); vEl.textContent = fmt(+inp.value); if (key === 'Tc' && st.Tc > st.Th - 20) { st.Tc = st.Th - 20; } rebuild(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(vEl);
  controlsEl.appendChild(row); return { inp, vEl };
}
const selC = selectRow('cycle', [['carnot', 'Carnot'], ['otto', 'Otto'], ['diesel', 'Diesel'], ['stirling', 'Stirling']], st.type, v => { st.type = v; rebuild(); });
const cTh = slider('T_hot (K)', 420, 1000, 10, st.Th, 'Th');
const cTc = slider('T_cold (K)', 250, 400, 5, st.Tc, 'Tc');
const cR = slider('compression r', 2, 12, 0.5, st.r, 'r', v => v.toFixed(1));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bRev = document.createElement('button'); bRev.type = 'button'; bRev.textContent = 'Reverse';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bRev); bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
let running = true;
bRev.addEventListener('click', () => { st.reverse = !st.reverse; bRev.textContent = st.reverse ? 'Forward' : 'Reverse'; });
bReset.addEventListener('click', () => { Object.assign(st, { type: 'carnot', Th: 650, Tc: 300, r: 4, reverse: false, phase: 0 }); selC.value = 'carnot'; cTh.inp.value = '650'; cTh.vEl.textContent = '650'; cTc.inp.value = '300'; cTc.vEl.textContent = '300'; cR.inp.value = '4'; cR.vEl.textContent = '4.0'; bRev.textContent = 'Reverse'; rebuild(); running = true; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); });
bPause.addEventListener('click', () => { running = !running; bPause.textContent = running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!running)); });

const rng = makeRng(DEFAULT_SEED);
const NM = 130;
const mol = [];
for (let i = 0; i < NM; i += 1) mol.push({ x: rng(), y: rng(), a: rng() * 6.28 });
function tempColor(t) { const a = Math.max(0, Math.min(1, t)); return `rgb(${40 + 215 * a | 0},${60 + 120 * a - 40 * a * a | 0},${180 - 130 * a | 0})`; }

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const n = loop.length;
  const idx = Math.floor(((st.phase % 1) + 1) % 1 * n) % n;
  const cur = loop[idx];
  const Tmin = Math.min(...loop.map(p => p.T0)), Tmax = Math.max(...loop.map(p => p.T1));
  const Tnow = cur.T0 + (cur.T1 - cur.T0) * 0.5;
  const tNorm = (Tnow - Tmin) / Math.max(1, Tmax - Tmin);

  // LEFT: piston-cylinder.
  const cx0 = 24, cyTop = 60, cylW = 250, cylH = 360;
  const Vmin = Math.min(...loop.map(p => p.V)), Vmax = Math.max(...loop.map(p => p.V));
  const fillFrac = 0.18 + 0.74 * (cur.V - Vmin) / Math.max(1e-6, Vmax - Vmin);
  const pistonY = cyTop + cylH * (1 - fillFrac);
  // Hot/cold reservoirs glow when heat flows (sign of Q on this seg,
  // flipped if running in reverse).
  const q = (st.reverse ? -1 : 1) * cur.Q;
  ctx.fillStyle = `rgba(255,90,70,${q > 1 ? 0.55 : 0.12})`; ctx.fillRect(cx0 - 16, cyTop + cylH + 6, cylW + 32, 16);
  ctx.fillStyle = `rgba(90,150,255,${q < -1 ? 0.55 : 0.12})`; ctx.fillRect(cx0 - 16, cyTop - 26, cylW + 32, 16);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('hot reservoir', cx0, cyTop - 30); ctx.fillText('cold reservoir', cx0, cyTop + cylH + 34);
  // Cylinder walls + gas region.
  ctx.fillStyle = '#0c0d14'; ctx.fillRect(cx0, cyTop, cylW, cylH);
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2; ctx.strokeRect(cx0, cyTop, cylW, cylH);
  // Molecules in the gas region [pistonY, cyTop+cylH]; speed ~ sqrt(T).
  const sp = 0.4 + 1.8 * Math.sqrt(Math.max(0.02, tNorm));
  for (const m of mol) {
    m.x += Math.cos(m.a) * 0.004 * sp; m.y += Math.sin(m.a) * 0.004 * sp;
    if (m.x < 0.02 || m.x > 0.98) { m.a = Math.PI - m.a; m.x = Math.max(0.02, Math.min(0.98, m.x)); }
    if (m.y < 0.02 || m.y > 0.98) { m.a = -m.a; m.y = Math.max(0.02, Math.min(0.98, m.y)); }
    const gx = cx0 + 6 + m.x * (cylW - 12);
    const gy = pistonY + 8 + m.y * (cyTop + cylH - pistonY - 16);
    ctx.fillStyle = tempColor(tNorm); ctx.beginPath(); ctx.arc(gx, gy, 2.4, 0, 6.28); ctx.fill();
  }
  // Piston.
  ctx.fillStyle = '#8a8f9c'; ctx.fillRect(cx0, pistonY - 12, cylW, 14);
  ctx.fillStyle = '#5a5f6a'; ctx.fillRect(cx0 + cylW / 2 - 6, cyTop - 24, 12, pistonY - cyTop - 10);

  // CENTRE: P-V loop.
  const gx0 = cx0 + cylW + 50, gx1 = gx0 + 300, gyb = 440, gyt = 70;
  const pmax = Math.max(...loop.map(p => p.P)), pmin = Math.min(...loop.map(p => p.P));
  const X = (v) => gx0 + (v - Vmin) / (Vmax - Vmin) * (gx1 - gx0);
  const Y = (p) => gyb - (p - pmin) / (pmax - pmin) * (gyb - gyt);
  ctx.strokeStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(gx0, gyt); ctx.lineTo(gx0, gyb); ctx.lineTo(gx1, gyb); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('P-V diagram', gx0, gyt - 12); ctx.fillText('V', gx1 - 10, gyb + 16); ctx.fillText('P', gx0 - 14, gyt + 4);
  ctx.fillStyle = 'rgba(255,160,90,0.12)'; ctx.beginPath();
  loop.forEach((p, i) => { i ? ctx.lineTo(X(p.V), Y(p.P)) : ctx.moveTo(X(p.V), Y(p.P)); }); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  loop.forEach((p, i) => { i ? ctx.lineTo(X(p.V), Y(p.P)) : ctx.moveTo(X(p.V), Y(p.P)); }); ctx.closePath(); ctx.stroke();
  const g = ctx.createRadialGradient(X(cur.V), Y(cur.P), 0, X(cur.V), Y(cur.P), 11);
  g.addColorStop(0, '#fff2c0'); g.addColorStop(1, 'rgba(255,209,102,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X(cur.V), Y(cur.P), 11, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(cur.V), Y(cur.P), 4, 0, 6.28); ctx.fill();

  // RIGHT: energy-flow (Sankey-like) bars, started below the readout
  // HUD so the two never overlap.
  const ex0 = gx1 + 56, ew = W - ex0 - 26;
  const Qin = Math.max(1e-6, anal.Qin), Wn = Math.max(0, anal.W), Qout = Math.max(0, anal.Qout);
  const total = Qin;
  const bh = (val) => 10 + 66 * val / total;
  let yy = 214;
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(st.reverse ? 'energy flow (refrigerator)' : 'energy flow (engine)', ex0, yy - 10);
  ctx.fillStyle = '#ff5a46'; ctx.fillRect(ex0, yy, ew, bh(Qin)); ctx.fillStyle = '#0b0b10'; ctx.fillText(`Q_hot ${Qin.toFixed(0)}`, ex0 + 8, yy + 15); yy += bh(Qin) + 14;
  ctx.fillStyle = '#ffd166'; ctx.fillRect(ex0, yy, ew * Wn / total, bh(Wn)); ctx.fillStyle = '#0b0b10'; ctx.fillText(`W ${Wn.toFixed(0)}`, ex0 + 8, yy + 15); yy += bh(Wn) + 14;
  ctx.fillStyle = '#5b8cff'; ctx.fillRect(ex0, yy, ew * Qout / total, bh(Qout)); ctx.fillStyle = '#0b0b10'; ctx.fillText(`Q_cold ${Qout.toFixed(0)}`, ex0 + 8, yy + 15); yy += bh(Qout) + 22;
  ctx.fillStyle = '#06d6a0'; ctx.font = '20px ui-monospace, monospace';
  ctx.fillText(`η = ${(anal.eff * 100).toFixed(1)}%`, ex0, yy);

  rEls.cycle.textContent = st.type;
  rEls.eff.textContent = (anal.eff * 100).toFixed(1) + '%';
  rEls.eff_Carnot.textContent = (carnotEff(Tmax, Tmin) * 100).toFixed(1) + '%';
  rEls['W net'].textContent = anal.W.toFixed(0);
  rEls.mode.textContent = st.reverse ? 'fridge' : 'engine';
}

function tick() {
  if (running) st.phase += (st.reverse ? -1 : 1) * 0.0045;
  render();
  requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) st.phase = CAPTURE_FRAC;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}

window.__physicsCheck = async () => {
  const a = analysis(cycleStates({ type: 'carnot', Th: 600, Tc: 300, r: 4 }));
  const err = Math.abs(a.eff - carnotEff(600, 300)) / carnotEff(600, 300);
  if (Math.abs(a.dU) > 1e-6 || err > 5e-3) return { name: 'first law / Carnot', pass: false, msg: `dU=${a.dU.toExponential(1)} effErr=${(err * 100).toFixed(2)}%` };
  return { name: 'cycles: first law holds, Carnot eta = 1-Tc/Th', pass: true, msg: `dU~0, eta=${(a.eff * 100).toFixed(1)}%` };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
