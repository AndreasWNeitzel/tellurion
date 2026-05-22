import { fontString } from '../../../shared/js/canvas-type.js';
// playground.js
// Method of images, a zoo of the canonical constructions: a charge
// near a grounded plane, a grounded sphere, a 90 deg conducting wedge,
// and between two grounded planes. The real charge is draggable; its
// image set is recomputed from its position, and the field lines of
// the images are drawn too (on the conductor side, where the image is
// the mathematical fiction that enforces V = 0). sim.js (plane
// potential/field/inducedSigma used by the invariant suite) is
// unchanged.

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readQ = document.getElementById('readout-q');
const selCfg = document.getElementById('select-cfg');
const sq = document.getElementById('slider-q'), vq = document.getElementById('value-q');
const tImg = document.getElementById('toggle-img'), tF = document.getElementById('toggle-field'), tE = document.getElementById('toggle-equi');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');

const W = canvas.width, H = canvas.height;
const SPHERE_R = 1.6, SLAB_H = 4.0;
// default real-charge position per configuration
const DEFAULTS = { plane: [0, 2.2], sphere: [3.4, 0], wedge: [2.0, 2.4], slab: [0, 1.4] };
const st = { cfg: 'plane', q: 1, rx: 0, ry: 2.2, showImg: true, showField: true, showEqui: true };
const VIEW = 6;                                   // world half-extent
const SC = Math.min(W, H) / (2 * VIEW);
const CXp = W / 2, CYp = H / 2;
const toPx = (x, y) => ({ px: CXp + x * SC, py: CYp - y * SC });
const toWorld = (px, py) => ({ x: (px - CXp) / SC, y: -(py - CYp) / SC });

// Keep the real charge in the physical region for the configuration.
function clampReal(cfg, x, y) {
  if (cfg === 'plane') return [Math.max(-VIEW + 0.3, Math.min(VIEW - 0.3, x)), Math.max(0.35, Math.min(VIEW - 0.3, y))];
  if (cfg === 'sphere') {
    let r = Math.hypot(x, y); if (r < 1e-6) { x = SPHERE_R + 0.6; y = 0; r = x; }
    if (r < SPHERE_R + 0.3) { const s = (SPHERE_R + 0.3) / r; x *= s; y *= s; }
    return [Math.max(-VIEW + 0.3, Math.min(VIEW - 0.3, x)), Math.max(-VIEW + 0.3, Math.min(VIEW - 0.3, y))];
  }
  if (cfg === 'wedge') return [Math.max(0.3, Math.min(VIEW - 0.3, x)), Math.max(0.3, Math.min(VIEW - 0.3, y))];
  // slab: between y = 0 and y = SLAB_H
  return [Math.max(-VIEW + 0.3, Math.min(VIEW - 0.3, x)), Math.max(0.3, Math.min(SLAB_H - 0.3, y))];
}

// Real charge + image set, recomputed from the dragged position.
function build(cfg, q, rx, ry) {
  if (cfg === 'sphere') {
    const R = SPHERE_R, d = Math.hypot(rx, ry) || 1e-6;
    const qp = -q * R / d, k = (R * R) / (d * d);
    const xp = k * rx, yp = k * ry;
    return {
      charges: [{ x: rx, y: ry, q }, { x: xp, y: yp, q: qp }],
      real: { x: rx, y: ry }, images: [{ x: xp, y: yp, q: qp }],
      inside: (x, y) => Math.hypot(x, y) < R,
      drawCond: () => {
        const c = toPx(0, 0);
        ctx.fillStyle = 'rgba(150,156,168,0.35)';
        ctx.beginPath(); ctx.arc(c.px, c.py, R * SC, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#9aa6b8'; ctx.lineWidth = 2; ctx.stroke();
      },
      induced: `q' = -qR/d = ${qp.toFixed(3)}`,
    };
  }
  if (cfg === 'wedge') {
    return {
      charges: [
        { x: rx, y: ry, q }, { x: rx, y: -ry, q: -q },
        { x: -rx, y: ry, q: -q }, { x: -rx, y: -ry, q },
      ],
      real: { x: rx, y: ry },
      images: [{ x: rx, y: -ry, q: -q }, { x: -rx, y: ry, q: -q }, { x: -rx, y: -ry, q }],
      inside: (x, y) => x < 0 || y < 0,
      drawCond: () => {
        ctx.fillStyle = 'rgba(150,156,168,0.30)';
        const o = toPx(0, 0);
        ctx.fillRect(0, o.py, W, H - o.py);
        ctx.fillRect(0, 0, o.px, H);
        ctx.strokeStyle = '#9aa6b8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(o.px, 0); ctx.lineTo(o.px, o.py); ctx.lineTo(W, o.py); ctx.stroke();
      },
      induced: '3 images, alternating sign',
    };
  }
  if (cfg === 'slab') {
    const Hsep = SLAB_H, ch = [], img = [];
    ch.push({ x: rx, y: ry, q });
    for (let n = -3; n <= 3; n += 1) {
      if (n !== 0) { const yy = 2 * n * Hsep + ry; ch.push({ x: rx, y: yy, q }); img.push({ x: rx, y: yy, q }); }
      const yi = 2 * n * Hsep - ry;
      ch.push({ x: rx, y: yi, q: -q }); img.push({ x: rx, y: yi, q: -q });
    }
    return {
      charges: ch, real: { x: rx, y: ry }, images: img,
      inside: (x, y) => y < 0 || y > Hsep,
      drawCond: () => {
        const a0 = toPx(0, 0), a1 = toPx(0, Hsep);
        ctx.fillStyle = 'rgba(150,156,168,0.30)';
        ctx.fillRect(0, a0.py, W, H - a0.py);
        ctx.fillRect(0, 0, W, a1.py);
        ctx.strokeStyle = '#9aa6b8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, a0.py); ctx.lineTo(W, a0.py);
        ctx.moveTo(0, a1.py); ctx.lineTo(W, a1.py); ctx.stroke();
      },
      induced: 'infinite image series (truncated +/-3)',
    };
  }
  // plane (default): grounded plane at y = 0, image mirrored in y
  return {
    charges: [{ x: rx, y: ry, q }, { x: rx, y: -ry, q: -q }],
    real: { x: rx, y: ry }, images: [{ x: rx, y: -ry, q: -q }],
    inside: (x, y) => y < 0,
    drawCond: () => {
      const o = toPx(0, 0);
      ctx.fillStyle = 'rgba(150,156,168,0.30)'; ctx.fillRect(0, o.py, W, H - o.py);
      ctx.strokeStyle = '#9aa6b8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, o.py); ctx.lineTo(W, o.py); ctx.stroke();
    },
    induced: 'total induced = -q',
    plane: ry,
  };
}

function fieldAt(model, x, y) {
  let ex = 0, ey = 0;
  for (const c of model.charges) {
    const dx = x - c.x, dy = y - c.y;
    const r = Math.hypot(dx, dy) + 1e-6, r3 = r * r * r;
    ex += c.q * dx / r3; ey += c.q * dy / r3;
  }
  return { ex, ey };
}

// Trace 2N streamlines seeded around a charge. `physical` lines stop
// at the conductor; image lines are allowed onto the conductor side
// (that is the whole point of the fiction) and drawn dimmer.
function streamFrom(model, cx, cy, qval, color, lw, stopAtCond) {
  // Gauss's law: the number of field lines is proportional to the
  // enclosed charge, so a 2q charge gets twice the lines as q.
  const N = Math.max(6, Math.min(40, Math.round(11 * Math.abs(qval))));
  const sgn = qval >= 0 ? 1 : -1;
  for (let k = 0; k < N; k += 1) {
    const a0 = (k + 0.5) / N * 2 * Math.PI;
    let x = cx + 0.12 * Math.cos(a0), y = cy + 0.12 * Math.sin(a0);
    const pts = [toPx(x, y)];
    for (let s = 0; s < 460; s += 1) {
      const f = fieldAt(model, x, y);
      const m = Math.hypot(f.ex, f.ey); if (m < 1e-6) break;
      x += 0.05 * sgn * f.ex / m; y += 0.05 * sgn * f.ey / m;
      pts.push(toPx(x, y));
      if (Math.abs(x) > VIEW + 1 || Math.abs(y) > VIEW + 1) break;
      if (stopAtCond && model.inside(x, y)) break;
      let hit = false;
      for (const c of model.charges) if (c.q * qval < 0 && Math.hypot(x - c.x, y - c.y) < 0.12) hit = true;
      if (hit) break;
    }
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(pts[0].px, pts[0].py);
    for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].px, pts[i].py);
    ctx.stroke();
    // Arrowheads point along the true field E (out of +, into -), not
    // along the integration direction, so the sign of q visibly
    // reverses every arrow when the charge flips sign.
    ctx.fillStyle = color;
    for (let i = 16; i < pts.length - 1; i += 24) {
      const w = toWorld(pts[i].px, pts[i].py);
      const fe = fieldAt(model, w.x, w.y);
      const an = Math.atan2(-fe.ey, fe.ex);
      const a = pts[i];
      ctx.beginPath();
      ctx.moveTo(a.px + 5 * Math.cos(an), a.py + 5 * Math.sin(an));
      ctx.lineTo(a.px - 5 * Math.cos(an - 0.45), a.py - 5 * Math.sin(an - 0.45));
      ctx.lineTo(a.px - 5 * Math.cos(an + 0.45), a.py - 5 * Math.sin(an + 0.45));
      ctx.closePath(); ctx.fill();
    }
  }
}

function streamlines(model) {
  // image field lines first (dim cyan), on the conductor side
  if (st.showImg) for (const im of model.images) {
    streamFrom(model, im.x, im.y, im.q, 'rgba(91,192,235,0.32)', 0.9, false);
  }
  // the real charge's physical lines (gold), terminating on the V=0 wall
  streamFrom(model, model.real.x, model.real.y, st.q, 'rgba(255,209,102,0.6)', 1.2, true);
}

function drawCharge(c, real) {
  const p = toPx(c.x, c.y);
  ctx.fillStyle = c.q >= 0 ? '#ef476f' : '#5bc0eb';
  ctx.globalAlpha = real ? 1 : 0.4;
  ctx.beginPath(); ctx.arc(p.px, p.py, real ? 9 : 7, 0, 2 * Math.PI); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = real ? '#fff' : 'rgba(255,255,255,0.5)';
  ctx.lineWidth = real ? 2 : 1; ctx.setLineDash(real ? [] : [3, 3]);
  ctx.beginPath(); ctx.arc(p.px, p.py, real ? 9 : 7, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(c.q >= 0 ? `+${Math.abs(c.q).toFixed(1)}` : `-${Math.abs(c.q).toFixed(1)}`, p.px, p.py - (real ? 14 : 11));
}

let dragging = false;
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const model = build(st.cfg, st.q, st.rx, st.ry);
  model.drawCond();
  if (st.showField) streamlines(model);
  for (const im of model.images) if (st.showImg) drawCharge(im, false);
  drawCharge({ x: model.real.x, y: model.real.y, q: st.q }, true);
  // grab handle hint
  const rp = toPx(model.real.x, model.real.y);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.arc(rp.px, rp.py, 16, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText(`config = ${st.cfg}   q = ${st.q.toFixed(1)}   images = ${model.images.length}   (drag the bright charge)`, 14, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`conductor is V = 0; gold lines end normal to it, cyan lines are the images' field. ${model.induced}`, 14, 40);
  const indVal = st.cfg === 'plane' ? -st.q
    : st.cfg === 'sphere' ? -st.q * SPHERE_R / (Math.hypot(st.rx, st.ry) || 1) : NaN;
  readQ.textContent = Number.isFinite(indVal) ? indVal.toFixed(2) : model.images.length + ' images';
}

// drag the real charge
function evWorld(e) {
  const r = canvas.getBoundingClientRect();
  return toWorld((e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height);
}
canvas.addEventListener('mousedown', (e) => { dragging = true; const w = evWorld(e); [st.rx, st.ry] = clampReal(st.cfg, w.x, w.y); render(); });
canvas.addEventListener('mousemove', (e) => { if (!dragging) return; const w = evWorld(e); [st.rx, st.ry] = clampReal(st.cfg, w.x, w.y); render(); });
window.addEventListener('mouseup', () => { dragging = false; });
canvas.addEventListener('mouseleave', () => { dragging = false; });

function setCfg(cfg) {
  st.cfg = cfg;
  [st.rx, st.ry] = clampReal(cfg, DEFAULTS[cfg][0], DEFAULTS[cfg][1]);
  render();
}
selCfg.addEventListener('change', () => setCfg(selCfg.value));
sq.addEventListener('input', () => { st.q = parseFloat(sq.value); vq.textContent = st.q.toFixed(1); render(); });
tImg.addEventListener('change', () => { st.showImg = tImg.checked; render(); });
tF.addEventListener('change', () => { st.showField = tF.checked; render(); });
tE.addEventListener('change', () => { st.showEqui = tE.checked; render(); });
btnR.addEventListener('click', () => { st.q = 1; sq.value = '1'; vq.textContent = '1.0'; selCfg.value = 'plane'; setCfg('plane'); });
btnP.addEventListener('click', () => { btnP.textContent = btnP.textContent === 'Pause' ? 'Play' : 'Pause'; });

function bootSync() {
  vq.textContent = st.q.toFixed(1);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const order = ['plane', 'sphere', 'wedge', 'slab', 'plane'];
    setCfg(order[Math.min(order.length - 1, Math.round(f * (order.length - 1)))]);
    selCfg.value = st.cfg;
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  setCfg('plane');
}

bootSync();


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'configuration', label: 'Configuration', value: st.cfg, format: undefined },
      { key: 'charge-magnitude', label: 'Charge q', value: st.q, format: 'float' },
      { key: 'real-x', label: 'Real charge x', value: st.rx, format: 'float' },
      { key: 'real-y', label: 'Real charge y', value: st.ry, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const clamped = clampReal(st.cfg, st.rx, st.ry);
  const in_bounds = Math.abs(st.rx - clamped[0]) < 1e-6 && Math.abs(st.ry - clamped[1]) < 1e-6;
  const status = in_bounds ? 'pass' : 'drift';
  return [
    {
      key: 'charge-in-domain',
      label: 'Charge in physical domain',
      value: in_bounds ? 'pass' : 'out-of-bounds',
      status: status
    }
  ];
};
