// Thin-lens FODO synchrotron. Panel A: the ring with alternating
// F / D quadrupoles and a circulating bunch, plus the periodic beta
// function across one cell. Panel B: the transverse phase space, with
// the tracked particle landing turn after turn on its invariant
// Courant-Snyder ellipse (constant emittance) or spiralling out in a
// stop band. Panel C: the stability diagram trace(M)/2 versus focal
// length and the tune with its integer / half-integer resonance lines,
// plus the dipole rigidity readout. Gate-tested sim.js; deterministic.
// Courant and Snyder 1958; Wiedemann, Particle Accelerator Physics.
import {
  fodoCell, oneTurn, trace, isStable, tune, twiss, csInvariant,
  driftM, thinLens, resonanceAmp, nearestResonance,
  rigidity, bendRadius,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rQ = document.getElementById('readout-q');
const rE = document.getElementById('readout-e');
const rStab = document.getElementById('readout-stab');
const rRho = document.getElementById('readout-rho');
const slF = document.getElementById('slider-f'), vF = document.getElementById('value-f');
const slN = document.getElementById('slider-nc'), vN = document.getElementById('value-nc');
const slB = document.getElementById('slider-b'), vB = document.getElementById('value-b');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const L = 10;                       // FODO cell length (m)
const PMOM = 450;                   // beam momentum (GeV/c), SPS-like
const QCH = 1;                      // proton charge (units of e)
const X0 = 3e-3, XP0 = 0;           // launch: 3 mm offset, no angle

const DEF_F = 40, DEF_N = 8, DEF_B = 12;   // f=4.0 m -> Q~1.72, off low-order resonances
const st = {
  fRaw: DEF_F, nc: DEF_N, bRaw: DEF_B, running: !prefersReducedMotion(),
  x: X0, xp: XP0, turn: 0, trail: [],
};
const focal = () => st.fRaw / 10;
const dipB = () => st.bRaw / 10;
const dipRho = () => bendRadius(PMOM, dipB(), QCH);   // bend radius from the dipole field

function reseed() { st.x = X0; st.xp = XP0; st.turn = 0; st.trail = []; }

// Periodic beta function sampled across one FODO cell (Twiss transport
// through sliced drifts and thin quads).
function betaProfile(f) {
  const tw = twiss(fodoCell(L, f, dipRho()));
  if (!tw) return null;
  let b = tw.beta, a = tw.alpha, g = tw.gamma;
  const s = [0], bs = [b];
  const apply = (m) => {
    const b1 = m[0] * m[0] * b - 2 * m[0] * m[1] * a + m[1] * m[1] * g;
    const a1 = -m[0] * m[2] * b + (m[0] * m[3] + m[1] * m[2]) * a - m[1] * m[3] * g;
    const g1 = m[2] * m[2] * b - 2 * m[2] * m[3] * a + m[3] * m[3] * g;
    b = b1; a = a1; g = g1;
  };
  const nSlice = 30;
  apply(thinLens(2 * f));                              // half F at s=0
  for (let half = 0; half < 2; half += 1) {
    if (half === 1) apply(thinLens(-f));               // D at mid-cell
    for (let i = 0; i < nSlice; i += 1) {
      apply(driftM((L / 2) / nSlice));
      s.push(s[s.length - 1] + (L / 2) / nSlice);
      bs.push(b);
    }
  }
  return { s, bs, betaMax: Math.max(...bs), betaMin: Math.min(...bs) };
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawRing(x, y, w, h, stable, Q) {
  panel(x, y, w, h, `ring: ${st.nc} FODO cells, alternating-gradient focusing`);
  const cx = x + h / 2 + 10, cy = y + h / 2 + 6, R = h / 2 - 36;
  ctx.strokeStyle = stable ? 'rgba(120,180,255,0.5)' : 'rgba(255,110,110,0.7)';
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
  for (let k = 0; k < st.nc; k += 1) {
    const ang = 2 * Math.PI * k / st.nc, dx = Math.cos(ang), dy = Math.sin(ang);
    ctx.strokeStyle = '#7fd6a0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx + dx * (R - 8), cy + dy * (R - 8)); ctx.lineTo(cx + dx * (R + 8), cy + dy * (R + 8)); ctx.stroke();
    const am = 2 * Math.PI * (k + 0.5) / st.nc, mx = Math.cos(am), my = Math.sin(am);
    ctx.strokeStyle = '#ff9d6f';
    ctx.beginPath(); ctx.moveTo(cx + mx * (R - 7), cy + my * (R - 7)); ctx.lineTo(cx + mx * (R + 7), cy + my * (R + 7)); ctx.stroke();
  }
  const ph = (st.turn % 90) / 90, ba = 2 * Math.PI * ph;
  ctx.fillStyle = stable ? '#ffd166' : '#ff6b6b';
  ctx.beginPath(); ctx.arc(cx + Math.cos(ba) * R, cy + Math.sin(ba) * R, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'right';
  ctx.fillStyle = '#7fd6a0'; ctx.fillText('F quad', cx - 16, y + h - 18);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ff9d6f'; ctx.fillText('D quad', cx + 16, y + h - 18);
  if (!stable) {
    ctx.fillStyle = '#ff8f8f'; ctx.font = fontString(canvas, 'caption', 'mono');
    ctx.fillText('STOP BAND', cx - 30, cy + 4);
  }
  const gx = x + h + 30, gy = y + 30, gw = w - h - 46, gh = h - 58;
  const prof = betaProfile(focal());
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(gx, gy, gw, gh);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('β(s) over one FODO cell', gx + 6, gy + 13);
  ctx.fillStyle = stable ? '#9be8b0' : '#ff8f8f'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`Q = ${Number.isNaN(Q) ? 'unstable' : Q.toFixed(4)}`, gx + gw - 102, gy + 14);
  if (prof) {
    const bmax = prof.betaMax * 1.1;
    ctx.strokeStyle = '#6fb4ff'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < prof.s.length; i += 1) {
      const xx = gx + gw * prof.s[i] / L, yy = gy + gh * (1 - prof.bs[i] / bmax);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(160,200,255,0.9)';
    ctx.fillText(`beta_max ${prof.betaMax.toFixed(1)} m / beta_min ${prof.betaMin.toFixed(1)} m`, gx + 6, gy + gh - 8);
  } else {
    ctx.fillStyle = '#ff8f8f'; ctx.fillText('no periodic solution (cell unstable)', gx + 6, gy + gh / 2);
  }
  ctx.fillStyle = 'rgba(200,210,235,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('F', gx - 2, gy + gh + 15); ctx.fillText('D', gx + gw / 2 - 4, gy + gh + 15); ctx.fillText('F', gx + gw - 8, gy + gh + 15);
}

function drawPhase(x, y, w, h) {
  panel(x, y, w, h, 'phase space (x, x-prime): invariant emittance ellipse');
  const tw = twiss(oneTurn(L, focal(), st.nc, dipRho()));
  const cx = x + w / 2, cy = y + h / 2 + 8;
  const eps0 = tw ? csInvariant(X0, XP0, tw) : 1e-6;
  const xMax = tw ? Math.sqrt(eps0 * tw.beta) * 1.5 : 6e-3;
  const xpMax = tw ? Math.sqrt(eps0 * tw.gamma) * 1.5 : 2e-3;
  const sx = (w / 2 - 28) / xMax, sxp = (h / 2 - 30) / xpMax;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.moveTo(x + 12, cy); ctx.lineTo(x + w - 8, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, y + 22); ctx.lineTo(cx, y + h - 10); ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('x (mm)', x + w - 52, cy - 6); ctx.fillText("x' (mrad)", cx + 6, y + 32);
  if (tw) {
    ctx.strokeStyle = 'rgba(127,214,160,0.85)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 180; i += 1) {
      const p = 2 * Math.PI * i / 180, s = Math.sqrt(eps0);
      const X = s * Math.sqrt(tw.beta) * Math.cos(p);
      const XP = -s / Math.sqrt(tw.beta) * (Math.sin(p) + tw.alpha * Math.cos(p));
      const px = cx + X * sx, py = cy - XP * sxp;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd166';
  for (const pt of st.trail) {
    const px = cx + pt[0] * sx, py = cy - pt[1] * sxp;
    if (px > x && px < x + w && py > y && py < y + h) { ctx.beginPath(); ctx.arc(px, py, 2.3, 0, 2 * Math.PI); ctx.fill(); }
  }
  ctx.fillStyle = '#6fb4ff';
  ctx.beginPath(); ctx.arc(cx + st.x * sx, cy - st.xp * sxp, 3.6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(230,236,250,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`turn ${st.turn}`, x + 12, y + h - 26);
  ctx.fillStyle = tw ? '#9be8b0' : '#ff8f8f';
  ctx.fillText(tw
    ? `epsilon = ${(eps0 * 1e6).toFixed(3)} mm.mrad  (conserved every turn)`
    : 'unstable: no ellipse, amplitude grows without bound', x + 12, y + h - 10);
}

function drawTune(x, y, w, h) {
  panel(x, y, w, h, 'stability: trace(M_cell)/2 and the tune Q(f)');
  const px = x + 36, py = y + 26, pw = w - 50, ph = 80;
  const fMin = 1.8, fMax = 14;       // spans the f = L/4 = 2.5 m stop-band edge
  const X = (f) => px + pw * (f - fMin) / (fMax - fMin);
  const Ytr = (v) => py + ph * (1 - (v + 2) / 4);
  ctx.fillStyle = 'rgba(127,214,160,0.10)'; ctx.fillRect(px, Ytr(1), pw, Ytr(-1) - Ytr(1));
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  for (const v of [-1, 1]) {
    ctx.strokeStyle = 'rgba(127,214,160,0.45)'; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(px, Ytr(v)); ctx.lineTo(px + pw, Ytr(v)); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('trace/2', px + 4, py + 12);
  ctx.fillText('+1', px - 20, Ytr(1) + 3); ctx.fillText('-1', px - 18, Ytr(-1) + 3);
  ctx.fillText('stable |.|<1', px + pw - 78, Ytr(0) - 4);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const f = fMin + (fMax - fMin) * i / 240, t = Math.max(-2, Math.min(2, trace(fodoCell(L, f, dipRho())) / 2));
    if (i === 0) ctx.moveTo(X(f), Ytr(t)); else ctx.lineTo(X(f), Ytr(t));
  }
  ctx.stroke();
  // stop band f < L/4 = 2.5 m, where |trace/2| > 1 and the cell is unstable
  const xEdge = X(L / 4);
  ctx.fillStyle = 'rgba(255,90,90,0.12)'; ctx.fillRect(px, py, xEdge - px, ph);
  ctx.strokeStyle = 'rgba(255,110,110,0.6)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xEdge, py); ctx.lineTo(xEdge, py + ph); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,140,140,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('stop band', px + 4, py + ph - 6);
  const qy = py + ph + 26, qh = 80;
  let qmax = 0.5;
  for (let i = 0; i <= 240; i += 1) { const q = tune(L, fMin + (fMax - fMin) * i / 240, st.nc, dipRho()); if (Number.isFinite(q)) qmax = Math.max(qmax, q); }
  qmax = Math.ceil((qmax + 0.25) * 2) / 2;
  const Yq = (q) => qy + qh * (1 - q / qmax);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, qy, pw, qh);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.fillText('tune Q', px + 4, qy + 12);
  for (let r = 0.5; r <= qmax + 1e-9; r += 0.5) {
    const isInt = Math.abs(r - Math.round(r)) < 1e-9;
    ctx.strokeStyle = isInt ? 'rgba(255,110,110,0.5)' : 'rgba(255,180,120,0.32)';
    ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(px, Yq(r)); ctx.lineTo(px + pw, Yq(r)); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.strokeStyle = '#6fb4ff'; ctx.lineWidth = 2; ctx.beginPath();
  let started = false;
  for (let i = 0; i <= 240; i += 1) {
    const f = fMin + (fMax - fMin) * i / 240, q = tune(L, f, st.nc, dipRho());
    if (!Number.isFinite(q)) { started = false; continue; }
    if (!started) { ctx.moveTo(X(f), Yq(q)); started = true; } else ctx.lineTo(X(f), Yq(q));
  }
  ctx.stroke();
  const f0 = focal(), Q0 = tune(L, f0, st.nc, dipRho());
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(X(f0), py); ctx.lineTo(X(f0), qy + qh); ctx.stroke(); ctx.setLineDash([]);
  if (Number.isFinite(Q0)) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(f0), Yq(Q0), 4, 0, 2 * Math.PI); ctx.fill(); }
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  for (const f of [2, 4, 8, 12]) ctx.fillText(`${f}`, X(f) - 4, qy + qh + 13);
  ctx.fillText('focal length f (m)', px + pw / 2 - 44, qy + qh + 25);
  const rho = bendRadius(PMOM, dipB(), QCH), nr = Number.isFinite(Q0) ? nearestResonance(Q0) : null;
  ctx.fillStyle = 'rgba(230,236,250,0.82)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`B.rho = ${rigidity(PMOM, QCH).toFixed(0)} T.m   rho = ${rho.toFixed(0)} m`, px, qy + qh + 41);
  if (nr) {
    ctx.fillStyle = nr.distance < 0.04 ? '#ff8f8f' : 'rgba(155,232,176,0.85)';
    ctx.fillText(`amp x${resonanceAmp(Q0) > 99 ? '99+' : resonanceAmp(Q0).toFixed(1)}`, px + pw - 58, qy + qh + 41);
  }
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const f = focal(), M = fodoCell(L, f, dipRho()), stable = isStable(M), Q = tune(L, f, st.nc, dipRho());
  drawRing(20, 20, W - 40, 248, stable, Q);
  const topY = 282, ph = H - topY - 14, half = (W - 52) / 2;
  drawPhase(20, topY, half, ph);
  drawTune(20 + half + 12, topY, half, ph);
  const tw = twiss(oneTurn(L, f, st.nc, dipRho()));
  rQ.textContent = Number.isNaN(Q) ? 'unstable' : Q.toFixed(4);
  rE.textContent = tw ? `${(csInvariant(st.x, st.xp, tw) * 1e6).toFixed(3)} mm.mrad` : 'undefined';
  rStab.textContent = stable ? 'stable' : 'STOP BAND';
  rRho.textContent = `${rigidity(PMOM, QCH).toFixed(0)} T.m`;
}

function advanceTurn() {
  const M = oneTurn(L, focal(), st.nc, dipRho());
  const nx = M[0] * st.x + M[1] * st.xp;
  const nxp = M[2] * st.x + M[3] * st.xp;
  st.x = nx; st.xp = nxp; st.turn += 1;
  st.trail.push([nx, nxp]);
  if (st.trail.length > 240) st.trail.shift();
}

let acc = 0;
function tick() {
  if (st.running) { acc += 1; if (acc % 5 === 0) advanceTurn(); }
  draw();
  requestAnimationFrame(tick);
}

function sync() { vF.textContent = focal().toFixed(1); vN.textContent = String(st.nc); vB.textContent = dipB().toFixed(2); }
slF.addEventListener('input', () => { st.fRaw = parseInt(slF.value, 10); reseed(); sync(); draw(); });
slN.addEventListener('input', () => { st.nc = parseInt(slN.value, 10); reseed(); sync(); draw(); });
slB.addEventListener('input', () => { st.bRaw = parseInt(slB.value, 10); sync(); draw(); });
bR.addEventListener('click', () => {
  st.fRaw = DEF_F; st.nc = DEF_N; st.bRaw = DEF_B; st.running = true; reseed();
  slF.value = String(DEF_F); slN.value = String(DEF_N); slB.value = String(DEF_B);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { f: String(st.fRaw), nc: String(st.nc), B: String(st.bRaw) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.f) { st.fRaw = parseInt(s.f, 10); slF.value = s.f; }
  if (s.nc) { st.nc = parseInt(s.nc, 10); slN.value = s.nc; }
  if (s.B) { st.bRaw = parseInt(s.B, 10); slB.value = s.B; }
}

function boot() {
  restoreState(); reseed();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync();
  if (CAPTURE_NAME) {
    const fr = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    const turns = Math.round(fr * 180);
    for (let i = 0; i < turns; i += 1) advanceTurn();
    draw();
  } else { draw(); }
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const f = focal(), rho = dipRho();
  const Q = tune(L, f, st.nc, rho);
  return {
    fields: [
      { key: 'focal-length', label: 'quadrupole focal length f (m)', value: f, format: 'float' },
      { key: 'tune', label: 'betatron tune Q (per ring)', value: Number.isFinite(Q) ? Q : 'unstable', format: Number.isFinite(Q) ? 'float' : 'text' },
      { key: 'cells', label: 'number of FODO cells', value: st.nc, format: 'int' },
      { key: 'dipole-field', label: 'dipole bend field B (T)', value: dipB(), format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const inv = [];
  const cell = fodoCell(L, focal(), dipRho());          // one-cell transfer map (symplectic)
  const M = oneTurn(L, focal(), st.nc, dipRho());        // full-ring map
  // Symplecticity: det(M) must equal 1 for a symplectic map
  const d = M[0] * M[3] - M[1] * M[2];
  inv.push({
    key: 'symplecticity',
    label: 'det(M) = 1 (symplectic)',
    value: d.toFixed(6),
    status: Math.abs(d - 1.0) < 1e-9 ? 'pass' : 'drift'
  });
  // Stability criterion: |trace(M_cell)/2| <= 1
  const tr = trace(cell);
  const stable = isStable(cell);
  inv.push({
    key: 'stability',
    label: 'stable if |trace(M)/2| <= 1',
    value: (tr / 2).toFixed(4),
    status: stable ? 'pass' : 'drift'
  });
  return inv;
};
