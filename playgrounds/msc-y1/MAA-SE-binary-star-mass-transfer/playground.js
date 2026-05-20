// Close-binary Roche geometry and conservative mass transfer. Panel A:
// the corotating figure-eight through L1 with both Roche lobes, the
// Lagrange points and, on overflow, the L1 stream and accretion disk.
// Panel B: the separation and period under conservative transfer, with
// the shrink-then-widen turning point at q = 1. Panel C: the stability
// map, zeta_L(q) against stiff and soft donors. Gate-tested sim.js;
// deterministic. Eggleton 1983; Frank, King and Raine.
import {
  MSUN, RSUN, DAY, eggletonRL, fracs, lagrangePoints, criticalPotential,
  keplerPeriod, conservativeTransfer, zetaLobe, classify, equipotentialRing,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rQ = document.getElementById('readout-q');
const rFill = document.getElementById('readout-fill');
const rP = document.getElementById('readout-p');
const rState = document.getElementById('readout-state');
const slM1 = document.getElementById('slider-m1'), vM1 = document.getElementById('value-m1');
const slM2 = document.getElementById('slider-m2'), vM2 = document.getElementById('value-m2');
const slF = document.getElementById('slider-fill'), vF = document.getElementById('value-fill');
const slD = document.getElementById('slider-dm'), vD = document.getElementById('value-dm');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const A0 = 6 * RSUN;                                     // base separation
const DEF = { m1: 20, m2: 10, fill: 80, dm: 0 };
const st = { ...DEF, running: !prefersReducedMotion(), ph: 0 };
const M1b = () => st.m1 / 10 * MSUN;
const M2b = () => st.m2 / 10 * MSUN;
const fillFrac = () => st.fill / 100;
const dmKg = () => st.dm / 100 * MSUN;

// post-transfer state (one exact conservative step from the base)
function current() {
  const M1 = M1b(), M2 = M2b();
  const dm = Math.min(dmKg(), 0.95 * M1);
  const t = conservativeTransfer(M1, M2, A0, dm);
  return { M1: t.M1, M2: t.M2, a: t.a, P: t.P, q: t.M1 / t.M2 };
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function drawRoche(x, y, w, h) {
  const s = current();
  panel(x, y, w, h, `corotating Roche frame: q = M1/M2 = ${s.q.toFixed(2)}`);
  const { x1, x2 } = fracs(s.M1, s.M2);
  const phiC = criticalPotential(s.M1, s.M2);
  const lp = lagrangePoints(s.M1, s.M2);
  // world (a=1 units) -> pixels
  const pad = 60, sc = (w - 2 * pad) / 2.6, cx = x + w / 2 - 0.17 * sc, cy = y + h / 2 + 6;
  const PX = (wx) => cx + wx * sc, PY = (wy) => cy - wy * sc;
  // figure-eight: lobe contour around each star at the critical level
  for (const cxw of [x1, x2]) {
    const ring = equipotentialRing(s.M1, s.M2, phiC - 0.012, cxw, 200, 2.2);
    ctx.strokeStyle = 'rgba(255,209,102,0.85)'; ctx.lineWidth = 2; ctx.beginPath();
    let started = false;
    for (let i = 0; i <= ring.xs.length; i += 1) {
      const j = i % ring.xs.length;
      if (!Number.isFinite(ring.xs[j])) { started = false; continue; }
      const px = PX(ring.xs[j]), py = PY(ring.ys[j]);
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // Lagrange points
  ctx.font = '10px monospace';
  for (const [name, p] of Object.entries(lp)) {
    ctx.fillStyle = 'rgba(200,210,235,0.8)';
    ctx.beginPath(); ctx.arc(PX(p[0]), PY(p[1]), 2.5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillText(name, PX(p[0]) + 4, PY(p[1]) - 4);
  }
  // stars: donor radius = fill * R_L,donor; accretor a fixed small disc
  const rLd = eggletonRL(s.q), rLa = eggletonRL(1 / s.q);
  const rd = Math.min(fillFrac(), 1.25) * rLd;
  ctx.fillStyle = '#ff9d6f';
  ctx.beginPath(); ctx.arc(PX(x1), PY(0), Math.max(4, rd * sc), 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#6fb4ff';
  ctx.beginPath(); ctx.arc(PX(x2), PY(0), Math.max(3, 0.16 * rLa * sc), 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,157,111,0.9)'; ctx.fillText('donor M1', PX(x1) - 24, PY(0) + rd * sc + 14);
  ctx.fillStyle = 'rgba(111,180,255,0.9)'; ctx.fillText('accretor M2', PX(x2) - 4, PY(0) - 0.16 * rLa * sc - 8);
  // overflow: stream from L1 to the accretor + accretion disk
  if (fillFrac() >= 1) {
    const L1 = lp.L1[0];
    ctx.strokeStyle = 'rgba(255,240,180,0.8)'; ctx.lineWidth = 2;
    for (let kp = 0; kp < 14; kp += 1) {
      const u0 = ((kp / 14) + st.ph) % 1;
      ctx.beginPath();
      let pen = false;
      for (let u = u0; u < 1; u += 0.04) {
        const ang = -1.6 * (u - u0) - 0.5;
        const px = PX(L1 + (x2 - L1) * u + 0.10 * Math.sin(6 * u));
        const py = PY(0.18 * Math.sin(Math.PI * u) * Math.sign(Math.sin(8 * u + kp)));
        if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
      }
      ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = 'rgba(150,200,255,0.7)'; ctx.lineWidth = 1.5;
    for (let kk = 0; kk < 3; kk += 1) {
      const rr = (0.07 + 0.03 * kk) * sc;
      ctx.beginPath(); ctx.ellipse(PX(x2), PY(0), rr, rr * 0.42, 0, 0, 2 * Math.PI); ctx.stroke();
    }
    ctx.fillStyle = '#ffd166'; ctx.fillText('L1 overflow stream + disk', x + 12, y + h - 10);
  } else {
    ctx.fillStyle = 'rgba(155,232,176,0.8)'; ctx.font = '11px monospace';
    ctx.fillText('detached: donor under-fills its Roche lobe', x + 12, y + h - 10);
  }
}

function drawEvolution(x, y, w, h) {
  panel(x, y, w, h, 'conservative transfer: separation a and period P');
  const M1 = M1b(), M2 = M2b();
  const px = x + 44, py = y + 38, pw = w - 56, ph = h - 70;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  const dmMax = 0.8 * M1, N = 160;
  let aMin = Infinity, aMax = 0;
  const aArr = [], pArr = [];
  for (let i = 0; i <= N; i += 1) {
    const dm = dmMax * i / N, t = conservativeTransfer(M1, M2, A0, dm);
    aArr.push(t.a); pArr.push(t.P); aMin = Math.min(aMin, t.a); aMax = Math.max(aMax, t.a);
  }
  const X = (i) => px + pw * i / N;
  const Ya = (a) => py + ph * (1 - (a - aMin * 0.9) / (aMax * 1.05 - aMin * 0.9));
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= N; i += 1) { const xx = X(i), yy = Ya(aArr[i]); if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
  ctx.stroke();
  // minimum-separation marker (q -> 1 turning point)
  let iMin = 0; for (let i = 1; i <= N; i += 1) if (aArr[i] < aArr[iMin]) iMin = i;
  ctx.strokeStyle = 'rgba(255,120,120,0.55)'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(X(iMin), py); ctx.lineTo(X(iMin), py + ph); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,150,150,0.85)'; ctx.font = '10px monospace';
  ctx.fillText('a min (q->1)', X(iMin) + 4, py + ph - 6);
  // current operating point
  const dmNow = Math.min(dmKg(), 0.8 * M1), iNow = Math.round(N * dmNow / dmMax);
  ctx.fillStyle = '#6fb4ff';
  ctx.beginPath(); ctx.arc(X(iNow), Ya(aArr[Math.min(N, iNow)]), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(230,236,250,0.85)'; ctx.font = '11px monospace';
  ctx.fillText(`a = ${(aArr[Math.min(N, iNow)] / RSUN).toFixed(2)} Rsun,  P = ${(pArr[Math.min(N, iNow)] / DAY).toFixed(3)} d`, px, y + 30);
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = '10px monospace';
  ctx.fillText('a (Rsun)', x + 8, py + 4);
  ctx.fillText('0', px - 4, py + ph + 14); ctx.fillText('transferred dM ->', px + pw / 2 - 36, py + ph + 14);
}

function drawStability(x, y, w, h) {
  panel(x, y, w, h, 'mass-transfer stability: zeta_L(q) vs stiff / soft donors');
  const s = current();
  const px = x + 44, py = y + 26, pw = w - 56, ph = h - 78;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(px, py, pw, ph);
  const qMin = 0.1, qMax = 10;
  const X = (q) => px + pw * (Math.log10(q) - Math.log10(qMin)) / (Math.log10(qMax) - Math.log10(qMin));
  const zMin = -3, zMax = 6;
  const Y = (z) => py + ph * (1 - (z - zMin) / (zMax - zMin));
  // zeta_L(q) curve (conservative): use base masses scaled to total
  const Mt = M1b() + M2b();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const q = qMin * Math.pow(qMax / qMin, i / 200);
    const m1 = Mt * q / (1 + q), m2 = Mt / (1 + q);
    const zl = Math.max(zMin, Math.min(zMax, zetaLobe(m1, m2, A0)));
    const xx = X(q), yy = Y(zl);
    if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  // reference donor mass-radius exponents
  for (const [z, col, lab] of [[0.6, 'rgba(111,180,255,0.7)', 'radiative zeta=0.6'], [-1 / 3, 'rgba(155,232,176,0.7)', 'convective zeta=-1/3']]) {
    ctx.strokeStyle = col; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(px, Y(z)); ctx.lineTo(px + pw, Y(z)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col; ctx.font = '10px monospace'; ctx.fillText(lab, px + pw - 116, Y(z) - 4);
  }
  // current q marker + classification
  const cls = classify(s.M1, s.M2, s.a, fillFrac() * s.a * eggletonRL(s.q), 0.6);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(X(s.q), py); ctx.lineTo(X(s.q), py + ph); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(X(s.q), Y(Math.max(zMin, Math.min(zMax, zetaLobe(s.M1, s.M2, s.a)))), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,210,235,0.6)'; ctx.font = '10px monospace';
  for (const q of [0.1, 0.5, 1, 2, 5, 10]) ctx.fillText(`${q}`, X(q) - 5, py + ph + 13);
  ctx.fillText('q = M1/M2 (log)', px + pw / 2 - 44, py + ph + 25);
  ctx.fillText('zeta_L', x + 8, py + 4);
  const col = cls.state === 'detached' ? '#9be8b0' : cls.state === 'stable transfer' ? '#6fb4ff' : '#ff8f8f';
  ctx.fillStyle = col; ctx.font = '12px monospace';
  ctx.fillText(`state: ${cls.state.toUpperCase()}   R/R_L = ${cls.fill.toFixed(2)}`, px, y + h - 9);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  const half = (W - 52) / 2;
  drawRoche(20, 20, half, H - 34);
  drawEvolution(20 + half + 12, 20, half, (H - 46) / 2);
  drawStability(20 + half + 12, 20 + (H - 46) / 2 + 6, half, (H - 46) / 2);
  const s = current();
  rQ.textContent = s.q.toFixed(2);
  rFill.textContent = fillFrac().toFixed(2);
  rP.textContent = `${(s.P / DAY).toFixed(3)} d`;
  const cls = classify(s.M1, s.M2, s.a, fillFrac() * s.a * eggletonRL(s.q), 0.6);
  rState.textContent = cls.state;
}

function tick() {
  if (st.running) st.ph = (st.ph + 1 / 90) % 1;
  draw();
  requestAnimationFrame(tick);
}

function sync() {
  vM1.textContent = (st.m1 / 10).toFixed(1); vM2.textContent = (st.m2 / 10).toFixed(1);
  vF.textContent = (st.fill / 100).toFixed(2); vD.textContent = (st.dm / 100).toFixed(2);
}
for (const [sl, key] of [[slM1, 'm1'], [slM2, 'm2'], [slF, 'fill'], [slD, 'dm']]) {
  sl.addEventListener('input', () => { st[key] = parseInt(sl.value, 10); sync(); draw(); });
}
bR.addEventListener('click', () => {
  Object.assign(st, DEF); st.running = true;
  slM1.value = String(DEF.m1); slM2.value = String(DEF.m2); slF.value = String(DEF.fill); slD.value = String(DEF.dm);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); sync(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { m1: String(st.m1), m2: String(st.m2), fill: String(st.fill), dm: String(st.dm) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  for (const k of ['m1', 'm2', 'fill', 'dm']) if (s[k]) { st[k] = parseInt(s[k], 10); }
  slM1.value = String(st.m1); slM2.value = String(st.m2); slF.value = String(st.fill); slD.value = String(st.dm);
}

function boot() {
  restoreState();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  sync();
  if (CAPTURE_NAME) {
    const fr = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = fr; draw();
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
