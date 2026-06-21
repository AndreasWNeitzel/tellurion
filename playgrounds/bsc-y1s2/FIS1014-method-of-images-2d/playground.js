import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { wedgeCharges, sphereCharges, fieldAt, potentialAt, imageChargeSum, R_SPHERE } from './sim.js';
// Method of images for several grounded geometries, Canvas2D only. Scene: the
// real charge near the conductor, its field lines striking the surface
// perpendicular, the induced charge shaded along the boundary, and (in reveal
// mode) the image charges that replace the conductor. Diagnostic: the induced
// surface charge along the conductor. Geometries: grounded plane, right-angle
// corner (3 images), 60-degree wedge (5 images), and grounded sphere (1 image
// inside). The static scene is cached offscreen and only the marching
// arrowheads are redrawn each frame, so the animation stays smooth.
//
// Reference: Griffiths, Introduction to Electrodynamics, 4th ed., Sec. 3.2.

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const selGeom = document.getElementById('select-geom');
const selView = document.getElementById('select-view');
const selSign = document.getElementById('select-sign');
const valueGeom = document.getElementById('value-geom');
const valueView = document.getElementById('value-view');
const valueSign = document.getElementById('value-sign');
const btnPlay = document.getElementById('btn-playpause');
const btnReset = document.getElementById('btn-reset');

const R = R_SPHERE;
const NW = { plane: 1, corner: 2, wedge: 3 };
const GEOM_LABEL = { plane: 'grounded plane', corner: 'right-angle corner', wedge: '60° wedge', sphere: 'grounded sphere' };
const DEFAULT_CHG = {
  plane: { x: 0, y: 1.4 }, corner: { x: 1.5, y: 1.15 },
  wedge: { x: 1.7 * Math.cos(Math.PI / 6), y: 1.7 * Math.sin(Math.PI / 6) }, sphere: { x: 1.95, y: 0.7 },
};
const BOX = {
  plane: { x0: -2.6, x1: 2.6, y0: -0.6, y1: 3.2 },
  corner: { x0: -0.6, x1: 3.2, y0: -0.6, y1: 3.2 },
  wedge: { x0: -0.55, x1: 3.5, y0: -0.7, y1: 2.95 },
  sphere: { x0: -2.6, x1: 2.6, y0: -2.4, y1: 2.4 },
};

const st = {
  geom: ['plane', 'corner', 'wedge', 'sphere'].includes(params.get('geom')) ? params.get('geom') : 'plane',
  view: params.get('view') === 'image' ? 'image' : 'conductor',
  q: params.get('sign') === 'neg' ? -1 : 1,
  chg: null,
  phase: 0,
};
st.chg = { ...DEFAULT_CHG[st.geom] };
let running = !DETERMINISTIC;

function beta() { return Math.PI / NW[st.geom]; }
function syncVals() {
  valueGeom.textContent = GEOM_LABEL[st.geom];
  valueView.textContent = st.view === 'image' ? 'image' : 'conductor';
  valueSign.textContent = st.q < 0 ? '−' : '+';
}
selGeom.addEventListener('change', () => { st.geom = selGeom.value; st.chg = { ...DEFAULT_CHG[st.geom] }; syncVals(); rebuild(); });
selView.addEventListener('change', () => { st.view = selView.value; syncVals(); rebuild(); });
selSign.addEventListener('change', () => { st.q = selSign.value === 'neg' ? -1 : 1; syncVals(); rebuild(); });
btnReset.addEventListener('click', () => {
  st.geom = 'plane'; st.view = 'conductor'; st.q = 1; st.chg = { ...DEFAULT_CHG.plane };
  selGeom.value = 'plane'; selView.value = 'conductor'; selSign.value = 'pos';
  running = true; btnPlay.textContent = 'Pause'; btnPlay.setAttribute('aria-pressed', 'false');
  syncVals(); rebuild();
});
btnPlay.addEventListener('click', () => {
  running = !running; btnPlay.textContent = running ? 'Pause' : 'Play'; btnPlay.setAttribute('aria-pressed', String(!running));
});

let view = { w: 760, h: 950, dpr: 1 };
let REG = null, SCN = null;
function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 2.0 },
    { name: 'diagnostic', weight: 1.0 },
  ]);
  computeTransform();
  dirty = true;
}
function computeTransform() {
  const r = REG.scene;
  const titleH = 24, stripH = 26, pad = 8;
  const draw = { x: r.x + pad, y: r.y + titleH, w: r.w - 2 * pad, h: r.h - titleH - stripH };
  const b = BOX[st.geom];
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const scale = Math.min(draw.w / bw, draw.h / bh);
  const offX = draw.x + (draw.w - bw * scale) / 2;
  const offY = draw.y + (draw.h - bh * scale) / 2;
  SCN = { draw, b, scale, offX, offY };
}
const WX = (x) => SCN.offX + (x - SCN.b.x0) * SCN.scale;
const WY = (y) => SCN.offY + (SCN.b.y1 - y) * SCN.scale;
const invX = (sx) => SCN.b.x0 + (sx - SCN.offX) / SCN.scale;
const invY = (sy) => SCN.b.y1 - (sy - SCN.offY) / SCN.scale;

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent: css.getPropertyValue('--accent').trim() || '#ffd166',
    pos: '#ef5466', neg: '#5b8def', line: 'rgba(232,237,247,0.78)',
    metal: '#2b313d', border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.08)',
  };
}

// --- geometry predicates ---------------------------------------------------
function inRegion(x, y) {
  if (st.geom === 'sphere') return Math.hypot(x, y) > R;
  const phi = Math.atan2(y, x);
  return phi >= -1e-9 && phi <= beta() + 1e-9;
}
function outOfView(x, y) {
  const b = SCN.b;
  return x < b.x0 - 0.4 || x > b.x1 + 0.4 || y < b.y0 - 0.4 || y > b.y1 + 0.4;
}
function clampCharge() {
  if (st.geom === 'sphere') {
    let d = Math.hypot(st.chg.x, st.chg.y);
    if (d < 1e-6) { st.chg.x = R + 0.5; return; }
    const dc = Math.max(R + 0.2, Math.min(2.5, d));
    st.chg.x *= dc / d; st.chg.y *= dc / d;
  } else if (st.geom === 'plane') {
    st.chg.x = Math.max(-2.4, Math.min(2.4, st.chg.x));
    st.chg.y = Math.max(0.3, Math.min(3.0, st.chg.y));
  } else {
    let r = Math.hypot(st.chg.x, st.chg.y), phi = Math.atan2(st.chg.y, st.chg.x);
    r = Math.max(0.5, Math.min(3.0, r));
    phi = Math.max(0.12, Math.min(beta() - 0.12, phi));
    st.chg.x = r * Math.cos(phi); st.chg.y = r * Math.sin(phi);
  }
}

// --- model state (world space, recomputed on change) ----------------------
let cs = [], B = [], sigma = [], sigMax = 1e-9, lines = [];
function charges() {
  if (st.geom === 'sphere') return sphereCharges(R, st.chg.x, st.chg.y, st.q);
  const r = Math.hypot(st.chg.x, st.chg.y), phi = Math.atan2(st.chg.y, st.chg.x);
  return wedgeCharges(NW[st.geom], r, phi, st.q);
}
function buildBoundary() {
  const out = [], M = 200;
  if (st.geom === 'sphere') {
    for (let i = 0; i <= M; i += 1) { const t = 2 * Math.PI * i / M; out.push({ x: R * Math.cos(t), y: R * Math.sin(t), nx: Math.cos(t), ny: Math.sin(t) }); }
  } else {
    const bt = beta(), Rmax = (SCN ? Math.hypot(SCN.b.x1 - SCN.b.x0, SCN.b.y1 - SCN.b.y0) : 5);
    const h = Math.floor(M / 2);
    for (let i = 0; i <= h; i += 1) { const r = Rmax * (1 - i / h); out.push({ x: r, y: 0, nx: 0, ny: 1 }); }     // wall phi=0
    for (let i = 0; i <= h; i += 1) { const r = Rmax * i / h; out.push({ x: r * Math.cos(bt), y: r * Math.sin(bt), nx: Math.sin(bt), ny: -Math.cos(bt) }); } // wall phi=beta
  }
  return out;
}
function computeSigma() {
  sigma = []; sigMax = 1e-9; const eps = 0.02;
  for (const p of B) {
    const sx = p.x + eps * p.nx, sy = p.y + eps * p.ny;
    // Skip samples whose offset point falls inside the conductor (happens at
    // boundary points within eps of the wedge apex, where the inward normal
    // crosses to the far wall); they would give a spurious spike.
    let s = 0;
    if (inRegion(sx, sy)) { const f = fieldAt(cs, sx, sy); s = f.ex * p.nx + f.ey * p.ny; }
    sigma.push(s); sigMax = Math.max(sigMax, Math.abs(s));
  }
}
function traceLines() {
  const NL = 22, ds = 0.03, maxSteps = 800;
  const out = [];
  for (let i = 0; i < NL; i += 1) {
    const th = 2 * Math.PI * (i + 0.5) / NL;
    let x = st.chg.x + 0.1 * Math.cos(th), y = st.chg.y + 0.1 * Math.sin(th);
    const pts = [[x, y]];
    for (let s = 0; s < maxSteps; s += 1) {
      const f = fieldAt(cs, x, y); const m = Math.hypot(f.ex, f.ey); if (m < 1e-9) break;
      const nx = x + st.q * f.ex / m * ds, ny = y + st.q * f.ey / m * ds;
      if (st.view === 'conductor') {
        if (!inRegion(nx, ny)) {
          let lo = { x, y }, hi = { x: nx, y: ny };
          for (let bi = 0; bi < 24; bi += 1) { const mx = 0.5 * (lo.x + hi.x), my = 0.5 * (lo.y + hi.y); if (inRegion(mx, my)) { lo = { x: mx, y: my }; } else { hi = { x: mx, y: my }; } }
          pts.push([lo.x, lo.y]); break;
        }
      } else {
        let hit = false;
        for (const c of cs) { if (c.real) continue; if (Math.hypot(nx - c.x, ny - c.y) < 0.08) { pts.push([c.x, c.y]); hit = true; break; } }
        if (hit) break;
      }
      x = nx; y = ny; pts.push([x, y]);
      if (outOfView(x, y)) break;
    }
    out.push(pts);
  }
  return out;
}

// --- drawing (all take a target context g; static layers go to the cache) --
function panel(g, col, r, title) {
  g.fillStyle = col.panel; g.fillRect(r.x, r.y, r.w, r.h);
  g.strokeStyle = col.border; g.lineWidth = 1; g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) { g.font = fontString(canvas, 'caption', 'sans', 600); g.fillStyle = col.muted; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(title, r.x + 10, r.y + 7); }
}
function regionPolygon() {
  // large polygon covering the in-view field region (wedge family).
  const bt = beta(), Rbig = Math.hypot(SCN.b.x1 - SCN.b.x0, SCN.b.y1 - SCN.b.y0) * 2;
  const poly = [[0, 0]];
  for (let i = 0; i <= 18; i += 1) { const a = bt * i / 18; poly.push([Rbig * Math.cos(a), Rbig * Math.sin(a)]); }
  return poly;
}
function drawConductor(g, col) {
  const d = SCN.draw;
  g.save(); clipTo(g, d);
  if (st.geom === 'sphere') {
    g.fillStyle = col.metal; g.beginPath(); g.arc(WX(0), WY(0), R * SCN.scale, 0, 2 * Math.PI); g.fill();
    g.save(); g.beginPath(); g.arc(WX(0), WY(0), R * SCN.scale, 0, 2 * Math.PI); g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1;
    for (let hx = -R; hx <= R; hx += 0.16) { g.beginPath(); g.moveTo(WX(hx), WY(-R)); g.lineTo(WX(hx + 0.5), WY(R)); g.stroke(); }
    g.restore();
  } else {
    // conductor = draw rect minus the region polygon (even-odd).
    g.beginPath();
    g.rect(d.x, d.y, d.w, d.h);
    const poly = regionPolygon();
    poly.forEach((p, i) => { const X = WX(p[0]), Y = WY(p[1]); i ? g.lineTo(X, Y) : g.moveTo(X, Y); });
    g.closePath();
    g.fillStyle = col.metal; g.fill('evenodd');
    g.save(); g.clip('evenodd');
    g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1;
    for (let hx = d.x - d.h; hx < d.x + d.w; hx += 13) { g.beginPath(); g.moveTo(hx, d.y + d.h); g.lineTo(hx + d.h, d.y); g.stroke(); }
    g.restore();
  }
  g.restore();
}
function drawInducedAndBoundary(g, col) {
  // colour the boundary by induced-charge sign/magnitude, then a bright
  // grounded line on top.
  g.save(); clipTo(g, SCN.draw);
  g.lineWidth = 6; g.lineCap = 'round';
  for (let i = 1; i < B.length; i += 1) {
    if (st.geom !== 'sphere' && i === Math.floor(B.length / 2)) continue; // skip the apex jump between walls
    const s = sigma[i], a = Math.min(0.85, Math.abs(s) / sigMax * 0.85);
    g.strokeStyle = s < 0 ? `rgba(91,141,239,${a})` : `rgba(239,84,102,${a})`;
    g.beginPath(); g.moveTo(WX(B[i - 1].x), WY(B[i - 1].y)); g.lineTo(WX(B[i].x), WY(B[i].y)); g.stroke();
  }
  // bright grounded conductor edge.
  g.strokeStyle = st.view === 'conductor' ? 'rgba(220,228,240,0.9)' : 'rgba(150,160,175,0.5)';
  g.lineWidth = st.view === 'conductor' ? 2.4 : 1.4; if (st.view !== 'conductor') g.setLineDash([6, 5]);
  g.beginPath();
  if (st.geom === 'sphere') { g.arc(WX(0), WY(0), R * SCN.scale, 0, 2 * Math.PI); }
  else { B.forEach((p, i) => { const X = WX(p.x), Y = WY(p.y); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); }
  g.stroke(); g.setLineDash([]);
  g.restore();
}
function drawDisc(g, col, x, y, sgn, ghost) {
  const X = WX(x), Y = WY(y);
  g.globalAlpha = ghost ? 0.55 : 1;
  g.beginPath(); g.arc(X, Y, 11, 0, 2 * Math.PI);
  g.fillStyle = sgn > 0 ? col.pos : col.neg; g.fill();
  g.strokeStyle = ghost ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.92)'; g.lineWidth = 2;
  if (ghost) g.setLineDash([4, 3]); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#fff'; g.font = fontString(canvas, 'heading', 'sans', 800); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(sgn > 0 ? '+' : '−', X, Y + 1); g.globalAlpha = 1;
}
function drawScene(g, col, r) {
  const title = st.view === 'conductor'
    ? `Charge near a ${GEOM_LABEL[st.geom]} (V = 0)`
    : `Image charges replace the ${GEOM_LABEL[st.geom]}`;
  panel(g, col, r, title);
  drawConductor(g, col);
  drawInducedAndBoundary(g, col);

  // field lines (static; arrowheads animate on top).
  g.save(); clipTo(g, SCN.draw);
  g.strokeStyle = col.line; g.lineWidth = 1.3;
  for (const pts of lines) { g.beginPath(); pts.forEach((p, i) => { const X = WX(p[0]), Y = WY(p[1]); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke(); }

  // force on the real charge (field from images at the real charge).
  const imgs = cs.filter((c) => !c.real);
  const Fi = fieldAt(imgs, st.chg.x, st.chg.y);
  const Fm = Math.hypot(Fi.ex, Fi.ey) || 1e-9;
  const L = Math.min(0.7, 0.18 + 0.4 * Math.tanh(Fm * 0.5));
  const ux = st.q * Fi.ex / Fm, uy = st.q * Fi.ey / Fm;
  const x0 = WX(st.chg.x), y0 = WY(st.chg.y), x1 = WX(st.chg.x + ux * L), y1 = WY(st.chg.y + uy * L);
  g.strokeStyle = col.accent; g.fillStyle = col.accent; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  const ang = Math.atan2(y1 - y0, x1 - x0);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 8 * Math.cos(ang - 0.4), y1 - 8 * Math.sin(ang - 0.4)); g.lineTo(x1 - 8 * Math.cos(ang + 0.4), y1 - 8 * Math.sin(ang + 0.4)); g.closePath(); g.fill();

  // image charges (reveal mode) and the real charge.
  if (st.view === 'image') for (const c of cs) if (!c.real) drawDisc(g, col, c.x, c.y, Math.sign(c.q), true);
  drawDisc(g, col, st.chg.x, st.chg.y, st.q, false);
  g.restore();

  // readout strip.
  const Vb = maxBoundaryPotential();
  const items = [
    [GEOM_LABEL[st.geom], col.fg],
    [`${cs.length - 1} image${cs.length - 1 > 1 ? 's' : ''}`, col.accent],
    [`pull ${Fm.toFixed(2)}`, col.accent],
    [`V|wall ${Vb.toExponential(0)}`, col.muted],
  ];
  g.font = fontString(canvas, 'caption', 'mono', 700); g.textBaseline = 'middle';
  let need = 0; for (const [t] of items) need += g.measureText(t).width + 18;
  if (need <= r.w) { g.textAlign = 'center'; items.forEach(([t, c], i) => { g.fillStyle = c; g.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); }); }
  else { g.textAlign = 'center'; items.forEach(([t, c], i) => { g.fillStyle = c; g.fillText(t, r.x + r.w * ((i % 2) + 0.5) / 2, r.y + r.h - (i < 2 ? 24 : 9)); }); }
}

function drawDiagnostic(g, col, r) {
  const xlab = st.geom === 'sphere' ? 'angle around the sphere' : 'arc length along the conductor';
  panel(g, col, r, 'Induced surface charge along the conductor');
  const inner = { x: r.x + 50, y: r.y + 26, w: r.w - 50 - 16, h: r.h - 26 - 44 };
  const cy = inner.y + inner.h / 2;
  const xOf = (t) => inner.x + t * inner.w;
  const yOf = (s) => cy - (s / sigMax) * (inner.h / 2) * 0.86;
  g.strokeStyle = col.grid; g.lineWidth = 0.8; g.beginPath(); g.moveTo(inner.x, cy); g.lineTo(inner.x + inner.w, cy); g.stroke();
  g.strokeStyle = col.border; g.lineWidth = 1; g.strokeRect(inner.x, inner.y, inner.w, inner.h);
  // filled curve.
  g.fillStyle = 'rgba(91,141,239,0.22)'; g.beginPath(); g.moveTo(inner.x, cy);
  sigma.forEach((s, i) => g.lineTo(xOf(i / (sigma.length - 1)), yOf(s)));
  g.lineTo(inner.x + inner.w, cy); g.closePath(); g.fill();
  g.lineWidth = 2.2; g.beginPath();
  sigma.forEach((s, i) => { const X = xOf(i / (sigma.length - 1)), Y = yOf(s); i ? g.lineTo(X, Y) : g.moveTo(X, Y); g.strokeStyle = s < 0 ? col.neg : col.pos; });
  g.strokeStyle = col.neg; g.stroke();
  // labels.
  g.fillStyle = col.muted; g.font = fontString(canvas, 'caption', 'mono'); g.textAlign = 'center'; g.textBaseline = 'top';
  g.fillText(xlab, inner.x + inner.w / 2, inner.y + inner.h + 20);
  g.save(); g.translate(inner.x - 34, inner.y + inner.h / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('σ (induced)', 0, 0); g.restore();
  const qi = imageChargeSum(cs);
  g.fillStyle = col.fg; g.font = fontString(canvas, 'legend', 'mono', 700); g.textAlign = 'left'; g.textBaseline = 'top';
  g.fillText(`net induced charge = ${qi.toFixed(2)} q`, inner.x + 6, inner.y + 6);
}

function maxBoundaryPotential() {
  let m = 0;
  for (const p of B) m = Math.max(m, Math.abs(potentialAt(cs, p.x, p.y)));
  return m;
}

function drawAllStatic(g) {
  const col = colors();
  g.fillStyle = col.bg; g.fillRect(0, 0, view.w, view.h);
  drawScene(g, col, REG.scene);
  drawDiagnostic(g, col, REG.diagnostic);
}

function drawArrows(g) {
  g.save(); clipTo(g, SCN.draw);
  g.fillStyle = '#fff'; const spacing = 0.8;
  for (const pts of lines) {
    const len = (pts.length - 1) * 0.03;
    for (let sd = (st.phase % spacing); sd < len - 0.04; sd += spacing) {
      const idx = Math.max(1, Math.min(pts.length - 1, Math.round(sd / 0.03)));
      const x = pts[idx][0], y = pts[idx][1], px = pts[idx - 1][0], py = pts[idx - 1][1];
      const ang = Math.atan2(WY(y) - WY(py), WX(x) - WX(px)); const X = WX(x), Y = WY(y), h = 5;
      g.beginPath(); g.moveTo(X + h * Math.cos(ang), Y + h * Math.sin(ang));
      g.lineTo(X + h * Math.cos(ang + 2.5), Y + h * Math.sin(ang + 2.5));
      g.lineTo(X + h * Math.cos(ang - 2.5), Y + h * Math.sin(ang - 2.5));
      g.closePath(); g.fill();
    }
  }
  g.restore();
}

// --- offscreen cache: static scene built once per change, blitted each frame
let cache = null, cacheCtx = null, dirty = true;
function ensureCache() {
  if (!cache) cache = document.createElement('canvas');
  if (cache.width !== canvas.width || cache.height !== canvas.height) { cache.width = canvas.width; cache.height = canvas.height; cacheCtx = cache.getContext('2d'); }
}
function rebuild() {
  if (!SCN) computeTransform();
  cs = charges(); B = buildBoundary(); computeSigma(); lines = traceLines(); dirty = true;
}
function buildCache() {
  ensureCache();
  cacheCtx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  cacheCtx.clearRect(0, 0, view.w, view.h);
  drawAllStatic(cacheCtx);
  dirty = false;
}
function frame() {
  if (!REG) { relayout(); rebuild(); }
  if (!B.length) rebuild();
  if (dirty) buildCache();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(cache, 0, 0); ctx.restore();
  drawArrows(ctx);
}

// --- drag the real charge --------------------------------------------------
let dragging = false;
function pScreen(ev) { const rect = canvas.getBoundingClientRect(); return { sx: (ev.clientX - rect.left) * (view.w / rect.width), sy: (ev.clientY - rect.top) * (view.h / rect.height) }; }
canvas.addEventListener('pointerdown', (ev) => {
  if (!SCN) return; const { sx, sy } = pScreen(ev);
  if ((WX(st.chg.x) - sx) ** 2 + (WY(st.chg.y) - sy) ** 2 < 26 * 26) { dragging = true; canvas.setPointerCapture(ev.pointerId); ev.preventDefault(); }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!dragging) return; const { sx, sy } = pScreen(ev);
  st.chg.x = invX(sx); st.chg.y = invY(sy); clampCharge(); rebuild();
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (running) st.phase += 0.5 * dt;
  frame();
  requestAnimationFrame(tick);
}

function bootSync() {
  selGeom.value = st.geom; selView.value = st.view; selSign.value = st.q < 0 ? 'neg' : 'pos';
  syncVals(); relayout(); rebuild(); frame();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.addEventListener('resize', () => { relayout(); frame(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); frame(); }).observe(canvas);
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); }
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const imgs = cs.filter((c) => !c.real); const Fi = fieldAt(imgs, st.chg.x, st.chg.y);
  return {
    fields: [
      { key: 'geom', label: 'conductor geometry', value: GEOM_LABEL[st.geom], format: 'text' },
      { key: 'images', label: 'number of image charges', value: cs.length - 1, format: 'int' },
      { key: 'force', label: 'force on real charge', value: Math.hypot(Fi.ex, Fi.ey), format: 'float' },
      { key: 'qind', label: 'net induced charge (units of q)', value: imageChargeSum(cs), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  try {
    const m = maxBoundaryPotential();
    return [{
      key: 'grounded',
      label: 'V = 0 on the conductor (max |V|)',
      value: m.toExponential(2),
      status: m < 1e-3 ? 'pass' : (m < 1e-1 ? 'pending' : 'drift'),
    }];
  } catch (e) { return []; }
};
