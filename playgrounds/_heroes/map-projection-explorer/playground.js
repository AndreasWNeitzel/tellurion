// Map Projection Explorer. Canvas2D. Draws the graticule, coarse
// coastlines, and Tissot indicatrices of a chosen map projection; the
// globe is recentred by dragging the canvas. The projection
// mathematics, the spherical rotation, and the Tissot construction all
// live in sim.js; this file is rendering and interaction only.

import {
  PROJECTIONS, PROJECTION_KEYS, rotate, tissot, COASTLINES,
} from './sim.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const controlsEl = document.getElementById('controls');

const DEG = Math.PI / 180;
const R0 = 0.07;                       // sphere radius of a Tissot test circle

const st = {
  projection: 'winkelTripel',
  lon0: 0, lat0: 0,                    // globe centre, radians
  showGraticule: true,
  showCoastlines: true,
  showTissot: true,
};

// ---- projection + fit ---------------------------------------------------

function projectGeoRad(lonRad, latRad) {
  const [l, p] = rotate(lonRad, latRad, st.lon0, st.lat0);
  return PROJECTIONS[st.projection].fn(l, p);
}
function projectGeo(lonDeg, latDeg) {
  return projectGeoRad(lonDeg * DEG, latDeg * DEG);
}

// Per-projection fit: bounding box of the full graticule at centre
// (0, 0). A spherical rotation is an isometry, so the planar extent of
// the whole sphere does not change as the globe is dragged; the fit is
// therefore computed once per projection and cached.
const fitCache = {};
function computeFit(key) {
  if (fitCache[key]) return fitCache[key];
  const fn = PROJECTIONS[key].fn;
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for (let lo = -180; lo <= 180; lo += 5) {
    for (let la = -90; la <= 90; la += 5) {
      const r = fn(lo * DEG, la * DEG);
      if (!r) continue;
      if (r.x < minx) minx = r.x;
      if (r.x > maxx) maxx = r.x;
      if (r.y < miny) miny = r.y;
      if (r.y > maxy) maxy = r.y;
    }
  }
  const s = Math.min(W / (maxx - minx), H / (maxy - miny)) * 0.86;
  const fit = { s, cx: (minx + maxx) / 2, cy: (miny + maxy) / 2 };
  fitCache[key] = fit;
  return fit;
}
function toScreen(proj, fit) {
  return {
    x: W / 2 + (proj.x - fit.cx) * fit.s,
    y: H / 2 - (proj.y - fit.cy) * fit.s,
  };
}

// ---- geometry -----------------------------------------------------------

function graticule() {
  const lines = [];
  for (let lo = -180; lo <= 180; lo += 30) {
    const m = [];
    for (let la = -90; la <= 90; la += 2) m.push([lo, la]);
    lines.push({ pts: m, edge: lo === -180 || lo === 180 });
  }
  for (let la = -90; la <= 90; la += 30) {
    const p = [];
    for (let lo = -180; lo <= 180; lo += 2) p.push([lo, la]);
    lines.push({ pts: p, edge: la === -90 || la === 90 || la === 0 });
  }
  return lines;
}
const GRATICULE = graticule();

// Subdivide a coarse polygon so every edge is at most ~4 deg, keeping
// long coastline segments smooth once the projection bends them.
function densify(poly) {
  const out = [];
  for (let i = 0; i < poly.length - 1; i += 1) {
    const [lo0, la0] = poly[i];
    const [lo1, la1] = poly[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(lo1 - lo0, la1 - la0) / 4));
    for (let k = 0; k < n; k += 1) {
      out.push([lo0 + (lo1 - lo0) * k / n, la0 + (la1 - la0) * k / n]);
    }
  }
  out.push(poly[poly.length - 1]);
  return out;
}
const COAST = COASTLINES.map(densify);

// ---- polyline drawing ---------------------------------------------------

// Draw a geographic polyline, lifting the pen where the projection is
// undefined and where the path jumps the antimeridian seam.
function strokeGeo(pts, fit) {
  ctx.beginPath();
  let pen = false, prev = null;
  for (const [lo, la] of pts) {
    const pr = projectGeo(lo, la);
    if (!pr) { pen = false; prev = null; continue; }
    const sc = toScreen(pr, fit);
    if (!pen) { ctx.moveTo(sc.x, sc.y); pen = true; }
    else if (prev && Math.abs(sc.x - prev.x) > W * 0.5) { ctx.moveTo(sc.x, sc.y); }
    else { ctx.lineTo(sc.x, sc.y); }
    prev = sc;
  }
  ctx.stroke();
}

// ---- render -------------------------------------------------------------

function render() {
  const fit = computeFit(st.projection);
  ctx.fillStyle = '#0a0c12';
  ctx.fillRect(0, 0, W, H);

  if (st.showGraticule) {
    for (const { pts, edge } of GRATICULE) {
      ctx.strokeStyle = edge ? 'rgba(150,170,210,0.55)' : 'rgba(120,140,180,0.22)';
      ctx.lineWidth = edge ? 1.4 : 1;
      strokeGeo(pts, fit);
    }
  }

  if (st.showCoastlines) {
    ctx.strokeStyle = 'rgba(120,210,170,0.9)';
    ctx.fillStyle = 'rgba(70,140,115,0.22)';
    ctx.lineWidth = 1.3;
    for (const poly of COAST) strokeGeo(poly, fit);
  }

  if (st.showTissot) drawTissot(fit);

  drawDistortionDiagnostic();
  drawCaption();
  refreshRail();
}

// Tissot indicatrices on a 30-degree grid. Each ellipse is the image
// of a small circle of sphere-radius R0; an equal-area projection
// keeps every ellipse the same area, a conformal one keeps every
// ellipse a circle.
function drawTissot(fit) {
  const fn = PROJECTIONS[st.projection].fn;
  for (let loD = -150; loD <= 180; loD += 30) {
    for (let laD = -60; laD <= 60; laD += 30) {
      const [l, p] = rotate(loD * DEG, laD * DEG, st.lon0, st.lat0);
      const pr = fn(l, p);
      if (!pr) continue;
      const t = tissot(fn, l, p);
      if (!t) continue;
      const sc = toScreen(pr, fit);
      const rx = Math.min(60, t.a * fit.s * R0);
      const ry = Math.min(60, t.b * fit.s * R0);
      ctx.beginPath();
      ctx.ellipse(sc.x, sc.y, rx, ry, -t.angle, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(233,170,90,0.28)';
      ctx.strokeStyle = 'rgba(233,170,90,0.85)';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
    }
  }
}

// Rule-13 diagnostic: area scale and angular distortion along the
// central meridian vs latitude. The area curve is flat for an
// equal-area projection; the angular curve is flat at zero for a
// conformal one; Mercator shows the runaway polar area inflation.
function drawDistortionDiagnostic() {
  const fn = PROJECTIONS[st.projection].fn;
  const pw = 232, ph = 150, px = W - pw - 14, py = 14;
  ctx.fillStyle = 'rgba(8,12,22,0.9)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = 'rgba(220,230,255,0.3)';
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = 'rgba(220,230,255,0.92)';
  ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.textAlign = 'left';
  ctx.fillText('distortion vs latitude', px + 8, py + 15);

  const ax = px + 30, ay = py + 24, aw = pw - 42, ah = ph - 46;
  const eqT = tissot(fn, 0, 0);
  const eqArea = eqT ? eqT.area : 1;
  const samples = [];
  let areaMax = 1;
  for (let i = 0; i <= 60; i += 1) {
    const lat = (-85 + 170 * i / 60) * DEG;
    const t = tissot(fn, 0, lat);
    if (!t) { samples.push(null); continue; }
    const aRel = t.area / eqArea;
    if (aRel > areaMax) areaMax = aRel;
    samples.push({ lat, aRel, ang: t.angular });
  }
  areaMax = Math.min(areaMax, 12);
  const xOf = (lat) => ax + (lat / (Math.PI / 2) / 2 + 0.5) * aw;
  // Area scale (clamped, green) and angular distortion (0-60 deg, pink).
  ctx.strokeStyle = '#5fe39b'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  let pen = false;
  for (const s of samples) {
    if (!s) { pen = false; continue; }
    const x = xOf(s.lat);
    const y = ay + ah - (Math.min(s.aRel, areaMax) / areaMax) * ah;
    if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#ef6f9f'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  pen = false;
  for (const s of samples) {
    if (!s) { pen = false; continue; }
    const x = xOf(s.lat);
    const y = ay + ah - (Math.min(s.ang, 60) / 60) * ah;
    if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,210,240,0.7)';
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('area x' + areaMax.toFixed(0), px + 8, ay + 9);
  ctx.fillStyle = '#5fe39b';
  ctx.fillText('area', ax + 4, ay + ah - 4);
  ctx.fillStyle = '#ef6f9f';
  ctx.fillText('angle', ax + 40, ay + ah - 4);
  ctx.fillStyle = 'rgba(200,210,240,0.7)';
  ctx.fillText('S', ax, ay + ah + 11);
  ctx.fillText('eq', ax + aw / 2 - 6, ay + ah + 11);
  ctx.fillText('N', ax + aw - 8, ay + ah + 11);
}

function drawCaption() {
  const meta = PROJECTIONS[st.projection];
  ctx.fillStyle = 'rgba(210,220,245,0.9)';
  ctx.font = fontString(canvas, 'caption', 'sans');
  ctx.textAlign = 'left';
  ctx.fillText(`${meta.name}  (${meta.family}, ${meta.property})`, 14, 22);
  ctx.fillStyle = 'rgba(170,185,215,0.7)';
  ctx.font = fontString(canvas, 'tick', 'mono');
  ctx.fillText('drag to recentre the globe', 14, H - 14);
}

// ---- diagnostics interface (v2 rail) ------------------------------------

function currentDistortion() {
  const fn = PROJECTIONS[st.projection].fn;
  const eq = tissot(fn, 0, 0);
  const at60 = tissot(fn, 0, 60 * DEG);
  const areaRel = (eq && at60) ? at60.area / eq.area : 1;
  const angAt60 = at60 ? at60.angular : 0;
  return { areaRel, angAt60 };
}

function refreshRail() {
  window.playground = window.playground || {};
  window.playground.getState = function getState() {
    const meta = PROJECTIONS[st.projection];
    const d = currentDistortion();
    return {
      fields: [
        { key: 'projection', label: 'projection', value: meta.name },
        { key: 'property', label: 'property', value: meta.property },
        { key: 'centre-lon', label: 'centre lon', value: (st.lon0 / DEG), format: 'float' },
        { key: 'centre-lat', label: 'centre lat', value: (st.lat0 / DEG), format: 'float' },
        { key: 'area-60', label: 'area scale 60deg', value: d.areaRel, format: 'float' },
        { key: 'angle-60', label: 'ang. dist. 60deg', value: d.angAt60, format: 'float' },
      ],
    };
  };
  window.playground.getInvariants = function getInvariants() {
    const meta = PROJECTIONS[st.projection];
    const d = currentDistortion();
    if (meta.property === 'equal-area') {
      const ok = Math.abs(d.areaRel - 1) < 0.05;
      return [{
        key: 'equal-area', label: 'Tissot area scale constant',
        value: d.areaRel.toFixed(3), status: ok ? 'pass' : 'drift',
      }];
    }
    if (meta.property === 'conformal') {
      const ok = d.angAt60 < 2;
      return [{
        key: 'conformal', label: 'angular distortion zero',
        value: `${d.angAt60.toFixed(2)} deg`, status: ok ? 'pass' : 'drift',
      }];
    }
    return [{
      key: 'compromise', label: 'no property held exactly',
      value: `${meta.property}`, status: 'pending',
    }];
  };
}

// ---- controls -----------------------------------------------------------

function buildControls() {
  controlsEl.innerHTML = '';
  const selRow = document.createElement('div');
  selRow.className = 'row';
  const selLabel = document.createElement('span');
  selLabel.textContent = 'projection';
  const sel = document.createElement('select');
  sel.id = 'select-projection';
  sel.setAttribute('aria-label', 'projection');
  for (const key of PROJECTION_KEYS) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = PROJECTIONS[key].name;
    if (key === st.projection) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => { st.projection = sel.value; render(); });
  selRow.append(selLabel, sel, document.createElement('span'));
  controlsEl.appendChild(selRow);

  function toggle(id, label, key) {
    const row = document.createElement('div');
    row.className = 'row';
    const lab = document.createElement('span');
    lab.textContent = label;
    const inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.id = id;
    inp.checked = st[key];
    inp.setAttribute('aria-label', label);
    inp.addEventListener('change', () => { st[key] = inp.checked; render(); });
    row.append(lab, inp, document.createElement('span'));
    controlsEl.appendChild(row);
  }
  toggle('toggle-graticule', 'graticule', 'showGraticule');
  toggle('toggle-coastlines', 'coastlines', 'showCoastlines');
  toggle('toggle-tissot', 'Tissot indicatrices', 'showTissot');

  const btnRow = document.createElement('div');
  btnRow.className = 'row buttons';
  const reset = document.createElement('button');
  reset.id = 'btn-reset';
  reset.type = 'button';
  reset.textContent = 'Recentre';
  reset.addEventListener('click', () => { st.lon0 = 0; st.lat0 = 0; render(); });
  btnRow.appendChild(reset);
  controlsEl.appendChild(btnRow);
}

// ---- interaction: drag to recentre --------------------------------------

let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const k = (Math.PI) / rect.width;          // a full canvas drag ~ 180 deg
  st.lon0 -= (e.clientX - lastX) * k;
  st.lat0 += (e.clientY - lastY) * k;
  st.lat0 = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, st.lat0));
  if (st.lon0 > Math.PI) st.lon0 -= 2 * Math.PI;
  if (st.lon0 < -Math.PI) st.lon0 += 2 * Math.PI;
  lastX = e.clientX; lastY = e.clientY;
  render();
});

// ---- boot ---------------------------------------------------------------

function boot() {
  buildControls();
  if (CAPTURE_NAME) {
    // Deterministic capture: a fixed projection sequence and centre.
    const keys = ['winkelTripel', 'mercator', 'mollweide', 'orthographic', 'hammer'];
    st.projection = keys[Math.min(keys.length - 1, Math.floor(CAPTURE_FRAC * keys.length))];
    document.getElementById('select-projection').value = st.projection;
    st.lon0 = 0.2; st.lat0 = 0.15;
  }
  render();
  if (CAPTURE_NAME) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
