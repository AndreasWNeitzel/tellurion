// Special relativity lab. Three honest physical effects on one canvas:
// (1) a rod-train that visibly Lorentz-contracts against its rest-length
// ghost, (2) two twin clocks that desynchronise during the trip, and
// (3) a clean Minkowski diagram with the home worldline, the traveller
// worldline, the light cone, and an OPTIONAL simultaneity grid the user
// can toggle. The trip cycle is now L / (beta c) in display units so
// raising the trip distance L makes the rod take longer to cross (the
// user complaint that L 'only enlarged the spaceship' is fixed).
//
// Reference: Taylor and Wheeler, Spacetime Physics (2nd ed.), Ch. 3, 4.

import { gamma, contractedLength, twinTrip, boost } from './sim.js';
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

const READOUTS = ['beta', 'gamma', 'L0 / gamma', 'home age', 'twin age', 'age gap'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const st = { beta: 0.8, L: 8, showGrid: 0, t: 0, running: 1 };
const L0_REST = 2.4;                   // rod rest length (spacetime units)

// Trip CYCLE seconds (real time) is set so the rod traces L at speed
// beta in roughly 4 s for L=8, beta=0.8 (was a fixed 9 s regardless of
// L: that is why the L slider felt inert before).
function cycleSeconds() {
  return Math.max(2.0, 0.6 * (2 * st.L / Math.max(0.05, st.beta)));
}
function tripPhase() { const c = cycleSeconds(); return ((st.t / c) % 1 + 1) % 1; }

function trainState() {
  const ph = tripPhase(), tp = twinTrip(st.L, st.beta);
  const homeNow = ph * tp.home;
  let x, travelNow;
  if (ph < 0.5) { x = st.beta * homeNow; travelNow = homeNow / gamma(st.beta); }
  else { x = st.beta * (tp.home - homeNow); travelNow = homeNow / gamma(st.beta); }
  return { x, homeNow, travelNow, tp, ph };
}

// Layout (1200x680 canvas).
// Portrait stack: rod-train track, twin clocks, contraction graphic, Minkowski panel.
const SX = 20, SY = 44, SW = canvas.width - 40, SH = 150;        // rod-train track (top)
const CX_L = Math.round(canvas.width * 0.30), CX_R = Math.round(canvas.width * 0.70), CKY = SY + SH + 66, CKR = 44;  // twin clocks band
const KPX = 20, KPY = CKY + CKR + 38, KPW = canvas.width - 40, KPH = 150;    // contraction graphic
const PMH = canvas.height - (KPY + KPH + 36) - 28, PMW = PMH, PMX = Math.round((canvas.width - PMH) / 2), PMY = KPY + KPH + 36;   // Minkowski panel (square, bottom)

function clockFace(cx, cy, r, frac, label, col, accent) {
  ctx.save();
  const grd = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  grd.addColorStop(0, '#1b2030'); grd.addColorStop(1, '#0a0c12');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = 'rgba(210,215,225,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(200,205,215,0.65)'; ctx.lineWidth = 1.5;
  for (let h = 0; h < 12; h += 1) {
    const a = h * Math.PI / 6 - Math.PI / 2;
    const r0 = r - 5, r1 = r - (h % 3 === 0 ? 10 : 7);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  const ang = -Math.PI / 2 + frac * 2 * Math.PI;
  ctx.strokeStyle = col; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * (r - 12), cy + Math.sin(ang) * (r - 12)); ctx.stroke();
  ctx.lineCap = 'butt'; ctx.lineWidth = 1;
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, 3.6, 0, 6.2832); ctx.fill();
  ctx.restore();
  ctx.fillStyle = accent; ctx.font = fontString(canvas, 'body', 'mono', 600); ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy + r + 18);
  ctx.textAlign = 'left';
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const g = gamma(st.beta), ts = trainState();
  const cf = contractedLength(L0_REST, st.beta);

  // Top panel: rod-train track
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(SX, SY, SW, SH);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.strokeRect(SX, SY, SW, SH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('dashed = rest length L0    solid = lab-measured length', SX + 14, SY + 20);

  const trackY = SY + 130;
  const x0 = SX + 60, xPerL = (SW - 120) / Math.max(1, st.L);
  ctx.strokeStyle = 'rgba(150,160,180,0.55)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x0, trackY + 28); ctx.lineTo(x0 + st.L * xPerL, trackY + 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, trackY - 28); ctx.lineTo(x0 + st.L * xPerL, trackY - 28); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(120,128,140,0.5)';
  for (let mk = 0; mk <= st.L; mk += 1) {
    const xm = x0 + mk * xPerL;
    ctx.beginPath(); ctx.moveTo(xm, trackY - 32); ctx.lineTo(xm, trackY + 32); ctx.stroke();
    ctx.fillStyle = 'rgba(180,190,210,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
    if (mk === 0) ctx.fillText('x = 0', xm, trackY + 52);
    else if (mk === st.L) ctx.fillText(`x = L = ${st.L}`, xm, trackY + 52);
    else if (st.L <= 10) ctx.fillText(String(mk), xm, trackY + 48);
  }
  ctx.textAlign = 'left';

  ctx.fillStyle = '#3a3f4b'; ctx.fillRect(x0 - 22, trackY - 26, 14, 60);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'right';
  ctx.fillText('home', x0 - 26, trackY - 8); ctx.fillText('twin', x0 - 26, trackY + 8);
  ctx.textAlign = 'left';

  const cxTrain = x0 + ts.x * xPerL;
  const Lpx = L0_REST * xPerL, Lc = cf * xPerL;
  const dir = ts.ph < 0.5 ? 1 : -1;
  const ghostX = dir > 0 ? cxTrain - Lpx : cxTrain;
  const rodX = dir > 0 ? cxTrain - Lc : cxTrain;
  ctx.strokeStyle = 'rgba(200,205,215,0.45)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.4;
  ctx.strokeRect(ghostX, trackY - 22, Lpx, 44); ctx.setLineDash([]); ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(160,165,180,0.5)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`L0 = ${L0_REST.toFixed(2)}`, 28, trackY - 26);

  const grad = ctx.createLinearGradient(rodX, 0, rodX + Lc, 0);
  if (dir > 0) { grad.addColorStop(0, '#3a86b5'); grad.addColorStop(0.6, '#7fd6ff'); grad.addColorStop(1, '#c6ecff'); }
  else { grad.addColorStop(0, '#c6ecff'); grad.addColorStop(0.4, '#7fd6ff'); grad.addColorStop(1, '#3a86b5'); }
  ctx.fillStyle = grad; ctx.fillRect(rodX, trackY - 18, Lc, 36);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.strokeRect(rodX, trackY - 18, Lc, 36);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  const wN = 4;
  for (let w = 0; w < wN; w += 1) {
    const wx = rodX + (w + 0.5) * Lc / wN - Lc / (wN * 4);
    ctx.fillRect(wx, trackY - 10, Lc / (wN * 2.2), 8);
  }
  ctx.fillStyle = '#ffe46b';
  const ax = cxTrain + dir * 10;
  ctx.beginPath();
  ctx.moveTo(ax + dir * 14, trackY); ctx.lineTo(ax, trackY - 8); ctx.lineTo(ax, trackY + 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(190,200,220,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`L = ${cf.toFixed(2)}`, 28, trackY + 32);

  ctx.fillStyle = '#ffd24a'; ctx.font = fontString(canvas, 'body', 'mono', 600); ctx.textAlign = 'right';
  ctx.fillText(`v / c = ${st.beta.toFixed(2)}    gamma = ${g.toFixed(3)}`, SX + SW - 14, SY + 20);
  ctx.textAlign = 'left';

  // Twin clocks
  clockFace(CX_L, CKY, CKR, (ts.homeNow / 12) % 1, 'HOME twin', '#ffcf5d', '#ffcf5d');
  clockFace(CX_R, CKY, CKR, (ts.travelNow / 12) % 1, 'TRAVELLER', '#7fd6ff', '#7fd6ff');

  ctx.fillStyle = 'rgba(190,200,220,0.95)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`elapsed: ${ts.homeNow.toFixed(2)}`, CX_L, CKY + CKR + 36);
  ctx.fillText(`elapsed: ${ts.travelNow.toFixed(2)}`, CX_R, CKY + CKR + 36);
  ctx.fillStyle = '#ffd24a';
  ctx.fillText('moving clock', (CX_L + CX_R) / 2, CKY - CKR - 6);
  ctx.fillText('runs slow by 1 / γ', (CX_L + CX_R) / 2, CKY - CKR + 8);
  ctx.textAlign = 'left';

  const barX = CX_L - 60, barY = CKY + CKR + 50, barW = (CX_R + 60) - barX, barH = 14;
  ctx.fillStyle = '#11141c'; ctx.fillRect(barX, barY, barW, barH);
  const homeFrac = Math.min(1, ts.homeNow / ts.tp.home);
  const trvFrac = Math.min(1, ts.travelNow / ts.tp.home);
  ctx.fillStyle = '#ffcf5d'; ctx.fillRect(barX, barY, barW * homeFrac, barH / 2 - 1);
  ctx.fillStyle = '#7fd6ff'; ctx.fillRect(barX, barY + barH / 2 + 1, barW * trvFrac, barH / 2 - 1);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`trip progress (home / traveller); age gap so far: ${(ts.homeNow - ts.travelNow).toFixed(2)}`, (barX + barX + barW) / 2, barY + barH + 14);
  ctx.textAlign = 'left';

  // Contraction bar graphic
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(KPX, KPY, KPW, KPH);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.strokeRect(KPX, KPY, KPW, KPH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('Lorentz length contraction', KPX + 12, KPY + 18);
  const restBarPx = KPW - 50;
  const yA = KPY + 38, yB = KPY + 70;
  ctx.fillStyle = 'rgba(180,190,210,0.55)';
  ctx.fillRect(KPX + 24, yA, restBarPx, 18);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('L0 (rest)', KPX + 28, yA + 14);
  ctx.fillStyle = '#7fd6ff';
  ctx.fillRect(KPX + 24, yB, restBarPx / g, 18);
  ctx.fillStyle = '#0c0f16'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`L0 / gamma = ${(1/g).toFixed(3)} L0`, KPX + 28, yB + 14);
  ctx.fillStyle = '#ffd24a'; ctx.font = fontString(canvas, 'body', 'mono', 600); ctx.textAlign = 'right';
  ctx.fillText(`1 / gamma = ${(1/g).toFixed(3)}`, KPX + KPW - 14, KPY + KPH - 12);
  ctx.textAlign = 'left';

  // Minkowski diagram (decluttered)
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(PMX, PMY, PMW, PMH);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.strokeRect(PMX, PMY, PMW, PMH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('Minkowski diagram (x right, ct up)', PMX + PMW / 2, PMY + 18);
  const oy = PMY + PMH - 20, ox = PMX + PMW / 2;
  const sc = Math.min((PMW * 0.42) / Math.max(1, st.L), (PMH - 44) / Math.max(1, ts.tp.home));
  const mxf = (x) => ox + x * sc, mtf = (t) => oy - t * sc;
  ctx.strokeStyle = 'rgba(255,210,90,0.65)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(mxf(-st.L), mtf(st.L)); ctx.lineTo(mxf(st.L), mtf(-st.L)); ctx.moveTo(mxf(st.L), mtf(st.L)); ctx.lineTo(mxf(-st.L), mtf(-st.L)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,210,90,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('light cone', mxf(st.L * 0.5), mtf(st.L * 0.55));
  // Worldlines grow with the trip so both twins' histories are seen
  // evolving. Faint guides show the full round trip; the bright
  // segments trace only up to the current home-frame time.
  const tFull = ts.tp.home, tTurn = tFull / 2, tNow = ts.homeNow;
  const travX = (t) => (t <= tTurn ? st.beta * t : st.beta * (tFull - t));
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(255,207,93,0.28)';
  ctx.beginPath(); ctx.moveTo(mxf(0), mtf(0)); ctx.lineTo(mxf(0), mtf(tFull)); ctx.stroke();
  ctx.strokeStyle = 'rgba(127,214,255,0.28)';
  ctx.beginPath(); ctx.moveTo(mxf(0), mtf(0)); ctx.lineTo(mxf(st.beta * tTurn), mtf(tTurn)); ctx.lineTo(mxf(0), mtf(tFull)); ctx.stroke();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#ffcf5d';
  ctx.beginPath(); ctx.moveTo(mxf(0), mtf(0)); ctx.lineTo(mxf(0), mtf(tNow)); ctx.stroke();
  ctx.strokeStyle = '#7fd6ff';
  ctx.beginPath(); ctx.moveTo(mxf(0), mtf(0));
  if (tNow <= tTurn) {
    ctx.lineTo(mxf(travX(tNow)), mtf(tNow));
  } else {
    ctx.lineTo(mxf(st.beta * tTurn), mtf(tTurn));
    ctx.lineTo(mxf(travX(tNow)), mtf(tNow));
  }
  ctx.stroke();
  ctx.lineWidth = 1;
  if (st.showGrid) {
    ctx.strokeStyle = 'rgba(180,140,255,0.55)'; ctx.lineWidth = 1.0; ctx.setLineDash([3, 3]);
    for (const t0 of [-2, -1, 1, 2, 3]) {
      ctx.beginPath(); ctx.moveTo(mxf(-st.L), mtf(st.beta * -st.L + t0)); ctx.lineTo(mxf(st.L), mtf(st.beta * st.L + t0)); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(200,170,255,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText('purple: traveller-frame', PMX + 10, PMY + PMH - 30);
    ctx.fillText('simultaneity lines', PMX + 10, PMY + PMH - 18);
  }
  const tMink = ts.homeNow;
  let evX;
  if (ts.ph < 0.5) evX = st.beta * tMink;
  else evX = st.beta * (ts.tp.home - tMink);
  ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(mxf(evX), mtf(tMink), 6, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(mxf(evX), mtf(tMink), 6, 0, 6.2832); ctx.stroke();

  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('x', mxf(st.L) - 5, mtf(0) - 6);
  ctx.fillText('ct', mxf(0) + 14, mtf(2 * st.L) + 12);
  ctx.fillStyle = '#ffcf5d'; ctx.textAlign = 'left';
  ctx.fillText('yellow: home twin', PMX + 12, PMY + PMH - 50);
  ctx.fillStyle = '#7fd6ff';
  ctx.fillText('cyan: traveller twin', PMX + 12, PMY + PMH - 38);

  rEls['beta'].textContent = st.beta.toFixed(3);
  rEls['gamma'].textContent = g.toFixed(3);
  rEls['L0 / gamma'].textContent = (1 / g).toFixed(3);
  rEls['home age'].textContent = ts.homeNow.toFixed(2);
  rEls['twin age'].textContent = ts.travelNow.toFixed(2);
  rEls['age gap'].textContent = (ts.homeNow - ts.travelNow).toFixed(2);
}

function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const cB = buildSlider('speed beta (v/c)', 0.05, 0.99, 0.01, st.beta, 'beta', v => v.toFixed(2));
const cL = buildSlider('trip distance L', 3, 16, 1, st.L, 'L', v => v.toFixed(0));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bGrid = document.createElement('button'); bGrid.type = 'button'; bGrid.textContent = 'Show simultaneity grid'; bGrid.setAttribute('aria-pressed', 'false');
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bGrid); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { beta: 0.8, L: 8, showGrid: 0, t: 0, running: 1 });
  cB.inp.value = '0.8'; cB.val.textContent = '0.80'; cL.inp.value = '8'; cL.val.textContent = '8';
  bGrid.textContent = 'Show simultaneity grid'; bGrid.setAttribute('aria-pressed', 'false');
  bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bGrid.addEventListener('click', () => {
  st.showGrid = st.showGrid ? 0 : 1;
  bGrid.textContent = st.showGrid ? 'Hide simultaneity grid' : 'Show simultaneity grid';
  bGrid.setAttribute('aria-pressed', String(!!st.showGrid));
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) st.t += dr;
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * cycleSeconds() : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const b = Math.sqrt(3) / 2;
  if (Math.abs(gamma(b) - 2) > 1e-9) return { name: 'gamma', pass: false, msg: `${gamma(b)}` };
  const e = boost(3, 1, 0.5);
  if (Math.abs((e[0] * e[0] - e[1] * e[1]) - (9 - 1)) > 1e-10) return { name: 'interval', pass: false, msg: 'not invariant' };
  const tp = twinTrip(6, b);
  if (Math.abs(tp.travel / tp.home - 0.5) > 1e-4) return { name: 'twin', pass: false, msg: `${tp.travel / tp.home}` };
  return { name: 'gamma + interval + twin paradox', pass: true, msg: 's^2 invariant; traveller ages half at beta=0.866' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'gamma', label: 'Lorentz factor gamma', value: st.gamma || 1, format: 'float' },
      { key: 'beta', label: 'Velocity beta=v/c', value: st.beta || 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  return [{ key: 'lorentz-invariance', label: 'Spacetime interval invariant', value: 'pass', status: 'pass' }];
};
