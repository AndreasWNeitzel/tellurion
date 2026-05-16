// playground.js
// Method of images, a zoo of the canonical constructions: a charge
// near a grounded plane, a grounded sphere, a 90 deg conducting wedge,
// and between two grounded planes. Each config is just the real charge
// plus its image set; the field is the superposed Coulomb field, drawn
// as streamlines that terminate on the conductor (the V = 0 surface).
// sim.js (plane potential/field/inducedSigma) is unchanged.

// sim.js keeps the plane potential/field/inducedSigma used by the
// invariant suite; the zoo's multi-image field is the same Coulomb
// superposition specialized per configuration.

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
const st = { cfg: 'plane', q: 1, showImg: true, showField: true, showEqui: true };
const VIEW = 6;                                   // world half-extent
const SC = Math.min(W, H) / (2 * VIEW);
const CXp = W / 2, CYp = H / 2;
const toPx = (x, y) => ({ px: CXp + x * SC, py: CYp - y * SC });

// Each config: real charge + image charges + conductor test/draw.
function build(cfg, q) {
  if (cfg === 'sphere') {
    const R = 1.6, d = 3.4;
    const qp = -q * R / d, xp = R * R / d;
    return {
      charges: [{ x: d, y: 0, q }, { x: xp, y: 0, q: qp }],
      real: { x: d, y: 0 }, images: [{ x: xp, y: 0, q: qp }],
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
    const a = 2.0, b = 2.4;
    return {
      charges: [
        { x: a, y: b, q }, { x: a, y: -b, q: -q },
        { x: -a, y: b, q: -q }, { x: -a, y: -b, q },
      ],
      real: { x: a, y: b },
      images: [{ x: a, y: -b, q: -q }, { x: -a, y: b, q: -q }, { x: -a, y: -b, q }],
      inside: (x, y) => x < 0 || y < 0,
      drawCond: () => {
        ctx.fillStyle = 'rgba(150,156,168,0.30)';
        const o = toPx(0, 0);
        ctx.fillRect(0, o.py, W, H - o.py);          // y < 0
        ctx.fillRect(0, 0, o.px, H);                 // x < 0
        ctx.strokeStyle = '#9aa6b8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(o.px, 0); ctx.lineTo(o.px, o.py); ctx.lineTo(W, o.py); ctx.stroke();
      },
      induced: '3 images, alternating sign',
    };
  }
  if (cfg === 'slab') {
    const Hsep = 4.0, h = 1.4, ch = [], img = [];
    ch.push({ x: 0, y: h, q });
    for (let n = -3; n <= 3; n += 1) {
      if (n !== 0) { const yy = 2 * n * Hsep + h; ch.push({ x: 0, y: yy, q }); img.push({ x: 0, y: yy, q }); }
      const yi = 2 * n * Hsep - h;
      ch.push({ x: 0, y: yi, q: -q }); img.push({ x: 0, y: yi, q: -q });
    }
    return {
      charges: ch, real: { x: 0, y: h }, images: img,
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
  // plane (default)
  const b = 2.2;
  return {
    charges: [{ x: 0, y: b, q }, { x: 0, y: -b, q: -q }],
    real: { x: 0, y: b }, images: [{ x: 0, y: -b, q: -q }],
    inside: (x, y) => y < 0,
    drawCond: () => {
      const o = toPx(0, 0);
      ctx.fillStyle = 'rgba(150,156,168,0.30)'; ctx.fillRect(0, o.py, W, H - o.py);
      ctx.strokeStyle = '#9aa6b8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, o.py); ctx.lineTo(W, o.py); ctx.stroke();
    },
    induced: 'total induced = -q',
    plane: b,
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

function streamlines(model) {
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 1.1;
  const N = 30;
  for (let k = 0; k < N; k += 1) {
    const a0 = (k + 0.5) / N * 2 * Math.PI;
    let x = model.real.x + 0.12 * Math.cos(a0);
    let y = model.real.y + 0.12 * Math.sin(a0);
    const sgn = st.q >= 0 ? 1 : -1;
    const p0 = toPx(x, y); ctx.beginPath(); ctx.moveTo(p0.px, p0.py);
    for (let s = 0; s < 480; s += 1) {
      const f = fieldAt(model, x, y);
      const m = Math.hypot(f.ex, f.ey); if (m < 1e-6) break;
      const ds = 0.05 * sgn;
      x += ds * f.ex / m; y += ds * f.ey / m;
      const p = toPx(x, y); ctx.lineTo(p.px, p.py);
      if (model.inside(x, y) || Math.abs(x) > VIEW + 1 || Math.abs(y) > VIEW + 1) break;
      for (const c of model.charges) if (c.q * st.q < 0 && Math.hypot(x - c.x, y - c.y) < 0.12) { s = 999; break; }
    }
    ctx.stroke();
  }
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
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(c.q >= 0 ? `+${Math.abs(c.q).toFixed(1)}` : `-${Math.abs(c.q).toFixed(1)}`, p.px, p.py - (real ? 14 : 11));
}

function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, W, H);
  const model = build(st.cfg, st.q);
  model.drawCond();
  if (st.showField) streamlines(model);
  for (const im of model.images) if (st.showImg) drawCharge(im, false);
  drawCharge({ x: model.real.x, y: model.real.y, q: st.q }, true);

  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`config = ${st.cfg}   q = ${st.q.toFixed(1)}   images = ${model.images.length}`, 14, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`conductor is the V = 0 surface; field lines end normal to it. ${model.induced}`, 14, 40);
  const indVal = st.cfg === 'plane' ? -st.q
    : st.cfg === 'sphere' ? -st.q * 1.6 / 3.4 : NaN;
  readQ.textContent = Number.isFinite(indVal) ? indVal.toFixed(2) : model.images.length + ' images';
}

selCfg.addEventListener('change', () => { st.cfg = selCfg.value; render(); });
sq.addEventListener('input', () => { st.q = parseFloat(sq.value); vq.textContent = st.q.toFixed(1); render(); });
tImg.addEventListener('change', () => { st.showImg = tImg.checked; render(); });
tF.addEventListener('change', () => { st.showField = tF.checked; render(); });
tE.addEventListener('change', () => { st.showEqui = tE.checked; render(); });
btnR.addEventListener('click', () => { st.cfg = 'plane'; st.q = 1; selCfg.value = 'plane'; sq.value = '1'; vq.textContent = '1.0'; render(); });
btnP.addEventListener('click', () => { btnP.textContent = btnP.textContent === 'Pause' ? 'Play' : 'Pause'; });

function bootSync() {
  vq.textContent = st.q.toFixed(1);
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const order = ['plane', 'sphere', 'wedge', 'slab', 'plane'];
    st.cfg = order[Math.min(order.length - 1, Math.round(f * (order.length - 1)))];
    selCfg.value = st.cfg;
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__simulationReady = true;
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
      }));
    }
    return;
  }
  render();
}

bootSync();
