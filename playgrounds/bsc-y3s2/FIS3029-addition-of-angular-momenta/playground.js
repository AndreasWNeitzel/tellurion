// Addition of two angular momenta, shown as the semiclassical vector
// model in 3D (hand-rolled projection, no WebGL per the stack rule).
// j1 and j2 are vectors of length sqrt(j(j+1)); for each allowed total
// J they sit at the fixed angle theta_12 set by the Casimir relation
// and add tip-to-tail to J, which precesses on its cone about the lab
// z-axis while j1 and j2 precess about J. The decomposition algebra
// (j1 (x) j2 = sum J, dimension count) is the diagnostic panel.
// Reference: Sakurai, Modern QM Ch. 3; Griffiths, QM Ch. 4.
import {
  allowedJ, multiplicity, totalMultiplicityFromJ, casimir, cosTheta12,
} from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rS = document.getElementById('readout-s');
const sJ1 = document.getElementById('slider-j1'), vJ1 = document.getElementById('value-j1');
const sJ2 = document.getElementById('slider-j2'), vJ2 = document.getElementById('value-j2');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const st = { j1: 0.5, j2: 0.5, t: 0, jIdx: 0 };
let running = !prefersReducedMotion();

// Per-frame hit-test rectangles for the clickable J rows in the
// decomposition panel. Populated each render().
const clickRegions = [];
// Click-to-select handler is wired up below the canvas reference
// (the canvas const is defined further down). Implemented as a
// deferred bind once the DOM is ready.
function bindClickRegions() {
  const cv = document.getElementById('stage');
  if (!cv) return;
  cv.addEventListener('click', (e) => {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) * (cv.width / r.width);
    const y = (e.clientY - r.top) * (cv.height / r.height);
    for (const reg of clickRegions) {
      if (x >= reg.x && x <= reg.x + reg.w && y >= reg.y && y <= reg.y + reg.h) {
        st.jIdx = reg.i;
        running = false;
        const btnP2 = document.getElementById('btn-pause');
        if (btnP2) { btnP2.textContent = 'Play'; btnP2.setAttribute('aria-pressed', 'true'); }
        break;
      }
    }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindClickRegions, { once: true });
else bindClickRegions();
const jLabel = (v) => (v % 1 === 0 ? `${v}` : `${v * 2}/2`);
sJ1.addEventListener('input', () => { st.j1 = parseFloat(sJ1.value) / 2; vJ1.textContent = jLabel(st.j1); st.jIdx = 0; });
sJ2.addEventListener('input', () => { st.j2 = parseFloat(sJ2.value) / 2; vJ2.textContent = jLabel(st.j2); st.jIdx = 0; });
btnR.addEventListener('click', () => {
  st.j1 = 0.5; st.j2 = 0.5; st.t = 0; st.jIdx = 0;
  sJ1.value = '1'; vJ1.textContent = jLabel(0.5); sJ2.value = '1'; vJ2.textContent = jLabel(0.5);
  running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false');
});
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

const CX = 280, CY = 250;                       // 3D view centre
const YAW0 = 0.6, PITCH = 0.46;

function rot(v, yaw) {                           // yaw about z, fixed pitch
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x = v[0] * cy - v[1] * sy, y = v[0] * sy + v[1] * cy, z = v[2];
  const cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  return { X: x, Y: z * cp - y * sp, d: z * sp + y * cp };
}
function proj(v, yaw, S) { const r = rot(v, yaw); return { px: CX + r.X * S, py: CY - r.Y * S, d: r.d }; }

function arrow(a, b, col, lw, yaw, S) {
  const pa = proj(a, yaw, S), pb = proj(b, yaw, S);
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(pa.px, pa.py); ctx.lineTo(pb.px, pb.py); ctx.stroke();
  const ang = Math.atan2(pb.py - pa.py, pb.px - pa.px), hl = 6 + lw * 1.6;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pb.px, pb.py);
  ctx.lineTo(pb.px - hl * Math.cos(ang - 0.4), pb.py - hl * Math.sin(ang - 0.4));
  ctx.lineTo(pb.px - hl * Math.cos(ang + 0.4), pb.py - hl * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
}
function ring(center, axis, radius, col, yaw, S) {
  // a circle of given radius in the plane normal to unit `axis`
  const a = axis, t = Math.abs(a[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const u0 = [a[1] * t[2] - a[2] * t[1], a[2] * t[0] - a[0] * t[2], a[0] * t[1] - a[1] * t[0]];
  const un = Math.hypot(...u0) || 1, u = [u0[0] / un, u0[1] / un, u0[2] / un];
  const w = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]];
  ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath();
  for (let k = 0; k <= 48; k += 1) {
    const ph = k / 48 * 2 * Math.PI, c = Math.cos(ph), s = Math.sin(ph);
    const p = proj([center[0] + radius * (u[0] * c + w[0] * s),
      center[1] + radius * (u[1] * c + w[1] * s),
      center[2] + radius * (u[2] * c + w[2] * s)], yaw, S);
    if (k === 0) ctx.moveTo(p.px, p.py); else ctx.lineTo(p.px, p.py);
  }
  ctx.stroke(); ctx.setLineDash([]);
}
function tlabel(s, x, y, col) {
  ctx.save(); ctx.fillStyle = col; ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 4;
  ctx.fillText(s, x, y); ctx.fillText(s, x, y); ctx.restore();
}

function render() {
  ctx.fillStyle = '#070810'; ctx.fillRect(0, 0, W, H);
  const j1 = st.j1, j2 = st.j2;
  const Js = allowedJ(j1, j2);
  const idx = Math.min(Js.length - 1, st.jIdx % Js.length);
  const J = Js[idx];
  const L1 = Math.sqrt(casimir(j1)), L2 = Math.sqrt(casimir(j2)), LJ = Math.sqrt(casimir(J));
  const S = 188 / (L1 + L2 + 0.55);
  const yaw = CAPTURE_NAME ? YAW0 + 0.5 * (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) : YAW0 + st.t * 0.004;
  const psi = CAPTURE_NAME ? 0.6 : st.t * 0.03;       // j1,j2 precess about J
  const Psi = CAPTURE_NAME ? 0.4 : st.t * 0.012;      // J precesses about z

  // J on its cone about lab z: cone half-angle beta = arccos(J/LJ)
  const beta = Math.acos(Math.max(-1, Math.min(1, (LJ > 0 ? J / LJ : 0))));
  const Jv = [LJ * Math.sin(beta) * Math.cos(Psi), LJ * Math.sin(beta) * Math.sin(Psi), LJ * Math.cos(beta)];
  const isSinglet = LJ < 1e-6;                  // J = 0: resultant is a point
  let j1v, j2v;
  if (isSinglet) {
    // j1 and j2 are exactly antiparallel along a tilted axis n that
    // itself precesses about z; their sum is zero.
    const g = 0.62, n = [Math.sin(g) * Math.cos(Psi), Math.sin(g) * Math.sin(Psi), Math.cos(g)];
    j1v = [L1 * n[0], L1 * n[1], L1 * n[2]];
    j2v = [-L2 * n[0], -L2 * n[1], -L2 * n[2]];
  } else {
    const Jhat = [Jv[0] / LJ, Jv[1] / LJ, Jv[2] / LJ];
    // j1 at fixed angle a1 from J (law of cosines on the magnitudes), precessing about J
    const cosA1 = Math.max(-1, Math.min(1, (LJ * LJ + L1 * L1 - L2 * L2) / (2 * LJ * L1)));
    const a1 = Math.acos(cosA1), sinA1 = Math.sin(a1);
    const tt = Math.abs(Jhat[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const e1u0 = [Jhat[1] * tt[2] - Jhat[2] * tt[1], Jhat[2] * tt[0] - Jhat[0] * tt[2], Jhat[0] * tt[1] - Jhat[1] * tt[0]];
    const e1n = Math.hypot(...e1u0) || 1, e1 = [e1u0[0] / e1n, e1u0[1] / e1n, e1u0[2] / e1n];
    const e2 = [Jhat[1] * e1[2] - Jhat[2] * e1[1], Jhat[2] * e1[0] - Jhat[0] * e1[2], Jhat[0] * e1[1] - Jhat[1] * e1[0]];
    j1v = [
      L1 * (cosA1 * Jhat[0] + sinA1 * (Math.cos(psi) * e1[0] + Math.sin(psi) * e2[0])),
      L1 * (cosA1 * Jhat[1] + sinA1 * (Math.cos(psi) * e1[1] + Math.sin(psi) * e2[1])),
      L1 * (cosA1 * Jhat[2] + sinA1 * (Math.cos(psi) * e1[2] + Math.sin(psi) * e2[2])),
    ];
    j2v = [Jv[0] - j1v[0], Jv[1] - j1v[1], Jv[2] - j1v[2]];   // closure: j1 + j2 = J
    // J precession cone about z, j1 precession circle about J
    ring([0, 0, Jv[2]], [0, 0, 1], Math.hypot(Jv[0], Jv[1]), 'rgba(255,209,102,0.45)', yaw, S);
    ring([cosA1 * L1 * Jhat[0], cosA1 * L1 * Jhat[1], cosA1 * L1 * Jhat[2]], Jhat, L1 * sinA1, 'rgba(91,192,235,0.5)', yaw, S);
  }

  // lab reference: faint z-axis and equator
  ring([0, 0, 0], [0, 0, 1], (L1 + L2) * 0.55, 'rgba(120,130,150,0.28)', yaw, S);
  const zt = proj([0, 0, (L1 + L2) * 0.62], yaw, S), zb = proj([0, 0, -(L1 + L2) * 0.62], yaw, S);
  ctx.strokeStyle = 'rgba(120,130,150,0.45)'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(zb.px, zb.py); ctx.lineTo(zt.px, zt.py); ctx.stroke(); ctx.setLineDash([]);
  tlabel('z', zt.px - 4, zt.py - 8, 'rgba(160,170,190,0.9)');

  ctx.font = 'bold 13px ui-monospace, monospace';
  const o = proj([0, 0, 0], yaw, S);
  if (isSinglet) {
    arrow([0, 0, 0], j1v, '#5bc0eb', 2.6, yaw, S);
    arrow([0, 0, 0], j2v, '#ef476f', 2.6, yaw, S);              // exactly opposite
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(o.px, o.py, 5, 0, 2 * Math.PI); ctx.fill();
  } else {
    arrow([0, 0, 0], Jv, '#ffd166', 3.4, yaw, S);
    arrow([0, 0, 0], j1v, '#5bc0eb', 2.6, yaw, S);
    arrow(j1v, Jv, '#ef476f', 2.6, yaw, S);                     // j2 placed at j1's tip
    ctx.strokeStyle = 'rgba(239,71,111,0.35)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
    const pj2 = proj(j2v, yaw, S);
    ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(pj2.px, pj2.py); ctx.stroke(); ctx.setLineDash([]);
  }

  const pJ = isSinglet ? { px: o.px + 10, py: o.py + 20 } : proj(Jv, yaw, S);
  const pj1 = proj([j1v[0] * 0.62, j1v[1] * 0.62, j1v[2] * 0.62], yaw, S);
  // j2 label at the midpoint of where the j2 arrow is actually drawn
  const j2mid = isSinglet
    ? [j2v[0] * 0.62, j2v[1] * 0.62, j2v[2] * 0.62]
    : [(j1v[0] + Jv[0]) / 2, (j1v[1] + Jv[1]) / 2, (j1v[2] + Jv[2]) / 2];
  const pj2t = proj(j2mid, yaw, S);
  tlabel(`J = ${jLabel(J)}  |J| = ${Math.sqrt(casimir(J)).toFixed(2)}`, pJ.px + 10, pJ.py - 6, '#ffd166');
  tlabel(`j1 = ${jLabel(j1)}`, pj1.px + 9, pj1.py + 14, '#5bc0eb');
  tlabel(`j2 = ${jLabel(j2)}`, pj2t.px + 9, pj2t.py - 6, '#ef476f');
  const th = Math.acos(cosTheta12(j1, j2, J)) * 180 / Math.PI;
  tlabel(`angle(j1,j2) = ${th.toFixed(1)} deg`, CX - 90, CY + 168, 'rgba(200,206,224,0.9)');
  tlabel('semiclassical vector model: j1 + j2 = J, precessing about z', CX - 168, 36, 'rgba(160,170,190,0.85)');

  // Clebsch-Gordan decomposition panel: each J row is a CLICKABLE
  // rectangle (the user feedback asked for clickable squares). The
  // hit-test rectangles are stored in clickRegions so the click
  // handler below can map screen->jIdx.
  const PX = 540;
  ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(PX - 12, 60, W - PX - 8, 360);
  ctx.strokeStyle = 'rgba(226,232,240,0.12)'; ctx.strokeRect(PX - 11.5, 60.5, W - PX - 9, 359);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('click a J to select  (decomposition)', PX, 78);
  ctx.fillStyle = '#ffd166'; ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(`${jLabel(j1)} (x) ${jLabel(j2)} =`, PX, 104);
  clickRegions.length = 0;
  Js.forEach((Jx, i) => {
    const yy = 130 + i * 26;
    const sel = i === idx;
    const rectY = yy - 16, rectH = 22, rectW = W - PX - 24;
    // Hit-test rectangle for this J row.
    clickRegions.push({ i, x: PX - 6, y: rectY, w: rectW, h: rectH });
    // Selection highlight.
    if (sel) {
      ctx.fillStyle = 'rgba(255, 209, 102, 0.18)';
      ctx.fillRect(PX - 6, rectY, rectW, rectH);
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)'; ctx.lineWidth = 1.2;
      ctx.strokeRect(PX - 6 + 0.5, rectY + 0.5, rectW - 1, rectH - 1);
    } else {
      ctx.strokeStyle = 'rgba(120, 165, 130, 0.30)'; ctx.lineWidth = 1.0;
      ctx.strokeRect(PX - 6 + 0.5, rectY + 0.5, rectW - 1, rectH - 1);
    }
    ctx.fillStyle = sel ? '#ffd166' : '#06d6a0';
    ctx.font = `${sel ? 'bold ' : ''}14px ui-monospace, monospace`;
    ctx.fillText(`${sel ? '>' : ' '} J = ${jLabel(Jx)}   (2J+1 = ${2 * Jx + 1})`, PX, yy);
  });
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  const yb = 130 + Js.length * 26 + 16;
  ctx.fillText(`dim = ${(2 * j1 + 1).toFixed(0)} x ${(2 * j2 + 1).toFixed(0)} = ${multiplicity(j1, j2)}`, PX, yb);
  ctx.fillText(`sum (2J+1)   = ${totalMultiplicityFromJ(j1, j2)}`, PX, yb + 20);
  ctx.fillStyle = '#06d6a0';
  ctx.fillText('dims always match', PX, yb + 40);

  rS.textContent = `${totalMultiplicityFromJ(j1, j2)}`;
}

function tick() {
  if (running) {
    st.t += 1;
    if (st.t % 150 === 0) st.jIdx += 1;        // cycle the shown total J
  }
  render();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}

function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const pairs = [[0.5, 0.5], [1, 0.5], [1, 1], [1.5, 1], [2, 1]];
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    const k = Math.min(pairs.length - 1, Math.round(frac * (pairs.length - 1)));
    st.j1 = pairs[k][0]; st.j2 = pairs[k][1];
    st.jIdx = Math.min(allowedJ(st.j1, st.j2).length - 1, k % 3 + (k > 2 ? 1 : 0));
    sJ1.value = String(2 * st.j1); vJ1.textContent = jLabel(st.j1);
    sJ2.value = String(2 * st.j2); vJ2.textContent = jLabel(st.j2);
  }
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
