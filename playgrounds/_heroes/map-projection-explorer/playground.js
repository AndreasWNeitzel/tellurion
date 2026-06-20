// Map Projection Explorer. Canvas2D. Drapes the Blue Marble Earth
// texture, the graticule, and Tissot indicatrices over a chosen map
// projection; the globe is recentred by dragging the canvas. Portrait
// canvas at 760x950 (4:5), responsive to viewport. The diagnostic
// distortion metrics (area scale, angular distortion vs latitude) are reported
// in the rail live readouts. The projection mathematics, the spherical rotation,
// and the Tissot construction all live in sim.js; this file is rendering and
// interaction only.

import {
  PROJECTIONS, PROJECTION_KEYS, rotate, unrotate, tissot,
} from './sim.js';
import { fontString } from '../../../shared/js/canvas-type.js';
import { stack } from '../../../shared/js/render/vertical-layout.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const DETERMINISTIC = params.get('deterministic') === '1';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
let W = canvas.width, H = canvas.height;
const controlsEl = document.getElementById('controls');
const controlsDrawerEl = document.getElementById('controls-drawer-content');
const controlsToggleEl = document.getElementById('controls-toggle');
const controlsDrawer = document.getElementById('controls-drawer');

let REG = null;  // layout regions from stack()
function layout() {
  REG = stack(canvas, [
    { name: 'scene', weight: 1 }
  ]);
}

const DEG = Math.PI / 180;
const R0 = 0.07;                       // sphere radius of a Tissot test circle

const st = {
  projection: 'winkelTripel',
  lon0: 0, lat0: 0,                    // globe centre, radians
  showGraticule: true,
  showEarth: true,
  showTissot: true,
};

// URL state restoration
function parseUrlState() {
  const p = new URLSearchParams(location.search);
  if (p.has('projection')) st.projection = p.get('projection');
  if (p.has('lon0')) st.lon0 = parseFloat(p.get('lon0'));
  if (p.has('lat0')) st.lat0 = parseFloat(p.get('lat0'));
  if (p.has('graticule')) st.showGraticule = p.get('graticule') !== '0';
  if (p.has('earth')) st.showEarth = p.get('earth') !== '0';
  if (p.has('tissot')) st.showTissot = p.get('tissot') !== '0';
}

function updateUrl() {
  const u = new URLSearchParams({
    projection: st.projection,
    lon0: st.lon0.toFixed(4),
    lat0: st.lat0.toFixed(4),
    graticule: st.showGraticule ? '1' : '0',
    earth: st.showEarth ? '1' : '0',
    tissot: st.showTissot ? '1' : '0',
  });
  history.replaceState(null, '', `?${u.toString()}`);
}

// ---- Earth texture ------------------------------------------------------
// The Blue Marble equirectangular image is sampled to colour each cell
// of the projected mesh. It is decoded once into an offscreen canvas so
// getImageData gives a fast per-cell pixel lookup.
const earthImg = new Image();
let texData = null, texW = 0, texH = 0;
function buildTexData() {
  texW = earthImg.naturalWidth || 2048;
  texH = earthImg.naturalHeight || 1024;
  const off = document.createElement('canvas');
  off.width = texW; off.height = texH;
  const octx = off.getContext('2d', { willReadFrequently: true });
  octx.drawImage(earthImg, 0, 0, texW, texH);
  texData = octx.getImageData(0, 0, texW, texH).data;
}

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
function computeFit(key, sceneReg) {
  const cacheKey = key;
  if (fitCache[cacheKey]) return fitCache[cacheKey];
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
  const s = Math.min(sceneReg.w / (maxx - minx), sceneReg.h / (maxy - miny)) * 0.86;
  const fit = { s, cx: (minx + maxx) / 2, cy: (miny + maxy) / 2 };
  fitCache[cacheKey] = fit;
  return fit;
}
function toScreen(proj, fit, sceneReg) {
  return {
    x: sceneReg.x + sceneReg.w / 2 + (proj.x - fit.cx) * fit.s,
    y: sceneReg.y + sceneReg.h / 2 - (proj.y - fit.cy) * fit.s,
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

// ---- polyline drawing ---------------------------------------------------

// Draw a geographic polyline, lifting the pen where the projection is
// undefined and where the path jumps the antimeridian seam.
function strokeGeo(pts, fit, sceneReg) {
  ctx.beginPath();
  let pen = false, prev = null;
  for (const [lo, la] of pts) {
    const pr = projectGeo(lo, la);
    if (!pr) { pen = false; prev = null; continue; }
    const sc = toScreen(pr, fit, sceneReg);
    if (!pen) { ctx.moveTo(sc.x, sc.y); pen = true; }
    else if (prev && Math.abs(sc.x - prev.x) > sceneReg.w * 0.5) { ctx.moveTo(sc.x, sc.y); }
    else { ctx.lineTo(sc.x, sc.y); }
    prev = sc;
  }
  ctx.stroke();
}

// ---- render -------------------------------------------------------------

function render() {
  W = canvas.width;
  H = canvas.height;
  layout();
  const sceneReg = REG.scene;

  ctx.fillStyle = '#0a0c12';
  ctx.fillRect(0, 0, W, H);

  // Draw scene in the full scene region
  ctx.save();
  ctx.beginPath();
  ctx.rect(sceneReg.x, sceneReg.y, sceneReg.w, sceneReg.h);
  ctx.clip();

  const fit = computeFit(st.projection, sceneReg);

  if (st.showEarth) {
    renderEarth(fit, dragging, sceneReg);
    if (earthKey) ctx.drawImage(earthCanvas, sceneReg.x, sceneReg.y, sceneReg.w, sceneReg.h);
  }

  if (st.showGraticule) {
    for (const { pts, edge } of GRATICULE) {
      ctx.strokeStyle = edge ? 'rgba(225,235,255,0.7)' : 'rgba(210,225,255,0.32)';
      ctx.lineWidth = edge ? Math.max(1.2, 1.4 * fit.s / 80) : Math.max(1.0, 1 * fit.s / 80);
      strokeGeo(pts, fit, sceneReg);
    }
  }

  if (st.showTissot) drawTissot(fit, sceneReg);

  drawCaption(sceneReg);
  ctx.restore();

  refreshRail();
}

// Offscreen buffer holding the draped Earth. Rebuilt only when the
// projection or the globe centre changes.
const earthCanvas = document.createElement('canvas');
const earthCtx = earthCanvas.getContext('2d', { willReadFrequently: true });
let earthKey = '';

// Render the Earth by inverse-projecting every output pixel and
// sampling the full-resolution Blue Marble image. During a drag the
// buffer is built at half resolution and scaled up; a settled view is
// rendered at full resolution for a crisp map. Pixels that inverse-
// project outside the map are left transparent.
function renderEarth(fit, lowRes, sceneReg) {
  const inv = PROJECTIONS[st.projection].inv;
  if (!texData || !inv) { earthKey = ''; return; }
  // Aitoff and Winkel tripel have no closed-form inverse, so their
  // per-pixel render runs a Newton solve and is far costlier; drop
  // them to a third resolution during a drag so the globe still
  // turns smoothly. The settled view is always full resolution.
  const slow = st.projection === 'aitoff' || st.projection === 'winkelTripel';
  const scale = lowRes ? (slow ? 3 : 2) : 1;
  const ew = Math.ceil(sceneReg.w / scale), eh = Math.ceil(sceneReg.h / scale);
  const key = `${st.projection}|${st.lon0.toFixed(4)}|${st.lat0.toFixed(4)}|${scale}`;
  if (key === earthKey && earthCanvas.width === ew) return;
  earthKey = key;
  earthCanvas.width = ew;
  earthCanvas.height = eh;
  const img = earthCtx.createImageData(ew, eh);
  const d = img.data;
  for (let j = 0; j < eh; j += 1) {
    const Y = -((j * scale) - sceneReg.h / 2) / fit.s + fit.cy;
    for (let i = 0; i < ew; i += 1) {
      const X = ((i * scale) - sceneReg.w / 2) / fit.s + fit.cx;
      const ll = inv(X, Y);
      const o = (j * ew + i) * 4;
      if (!ll) { d[o + 3] = 0; continue; }
      const [lon, lat] = unrotate(ll[0], ll[1], st.lon0, st.lat0);
      let u = (lon / Math.PI + 1) / 2;
      u -= Math.floor(u);
      const v = Math.min(0.999, Math.max(0, 0.5 - lat / Math.PI));
      const ti = (((v * texH) | 0) * texW + ((u * texW) | 0)) * 4;
      d[o] = texData[ti];
      d[o + 1] = texData[ti + 1];
      d[o + 2] = texData[ti + 2];
      d[o + 3] = 255;
    }
  }
  earthCtx.putImageData(img, 0, 0);
}

// Tissot indicatrices on a 30-degree grid. Each ellipse is the image
// of a small circle of sphere-radius R0; an equal-area projection
// keeps every ellipse the same area, a conformal one keeps every
// ellipse a circle.
function drawTissot(fit, sceneReg) {
  const fn = PROJECTIONS[st.projection].fn;
  for (let loD = -150; loD <= 180; loD += 30) {
    for (let laD = -60; laD <= 60; laD += 30) {
      const [l, p] = rotate(loD * DEG, laD * DEG, st.lon0, st.lat0);
      const pr = fn(l, p);
      if (!pr) continue;
      const t = tissot(fn, l, p);
      if (!t) continue;
      const sc = toScreen(pr, fit, sceneReg);
      const rx = Math.min(60, t.a * fit.s * R0);
      const ry = Math.min(60, t.b * fit.s * R0);
      ctx.beginPath();
      ctx.ellipse(sc.x, sc.y, rx, ry, -t.angle, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(233,170,90,0.28)';
      ctx.strokeStyle = 'rgba(233,170,90,0.85)';
      ctx.lineWidth = Math.max(1.0, fit.s / 80);
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawCaption(sceneReg) {
  const meta = PROJECTIONS[st.projection];
  ctx.fillStyle = 'rgba(210,220,245,0.9)';
  const captionFont = fontString(canvas, 'caption', 'sans');
  ctx.font = captionFont.replace(/(\d+)px/, (m, p) => `${Math.max(12, parseInt(p))}px`);
  ctx.textAlign = 'left';
  ctx.fillText(`${meta.name}  (${meta.family}, ${meta.property})`, sceneReg.x + 8, sceneReg.y + 18);
  ctx.fillStyle = 'rgba(170,185,215,0.7)';
  const tickFont = fontString(canvas, 'tick', 'mono');
  ctx.font = tickFont.replace(/(\d+)px/, (m, p) => `${Math.max(12, parseInt(p))}px`);
  ctx.fillText('drag to recentre the globe', sceneReg.x + 8, sceneReg.y + sceneReg.h - 8);
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
    const fn = PROJECTIONS[st.projection].fn;
    // Sample a few latitudes for area scale diagnostics
    const eq = tissot(fn, 0, 0);
    const at30 = tissot(fn, 0, 30 * DEG);
    const at60 = tissot(fn, 0, 60 * DEG);
    const eqArea = eq ? eq.area : 1;
    return {
      fields: [
        { key: 'projection', label: 'projection', value: meta.name },
        { key: 'property', label: 'property', value: meta.property },
        { key: 'centre-lon', label: 'centre lon', value: (st.lon0 / DEG), format: 'float' },
        { key: 'centre-lat', label: 'centre lat', value: (st.lat0 / DEG), format: 'float' },
        { key: 'area-eq', label: 'area scale at eq', value: eq ? (eq.area / eqArea).toFixed(3) : 'N/A', format: 'string' },
        { key: 'area-30', label: 'area scale 30deg', value: at30 ? (at30.area / eqArea).toFixed(3) : 'N/A', format: 'string' },
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
  function buildControlSet(parentEl) {
    parentEl.innerHTML = '';
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
    sel.addEventListener('change', () => { st.projection = sel.value; updateUrl(); render(); });
    selRow.append(selLabel, sel, document.createElement('span'));
    parentEl.appendChild(selRow);

    function toggle(id, label, key, parent) {
      const row = document.createElement('div');
      row.className = 'row';
      const lab = document.createElement('span');
      lab.textContent = label;
      const inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.id = id;
      inp.checked = st[key];
      inp.setAttribute('aria-label', label);
      inp.addEventListener('change', () => { st[key] = inp.checked; updateUrl(); render(); });
      row.append(lab, inp, document.createElement('span'));
      parent.appendChild(row);
    }
    toggle('toggle-earth', 'Earth texture', 'showEarth', parentEl);
    toggle('toggle-graticule', 'graticule', 'showGraticule', parentEl);
    toggle('toggle-tissot', 'Tissot indicatrices', 'showTissot', parentEl);

    const btnRow = document.createElement('div');
    btnRow.className = 'row buttons';
    const reset = document.createElement('button');
    reset.id = 'btn-reset';
    reset.type = 'button';
    reset.textContent = 'Recentre';
    reset.addEventListener('click', () => { st.lon0 = 0; st.lat0 = 0; updateUrl(); render(); });
    btnRow.appendChild(reset);
    parentEl.appendChild(btnRow);
  }

  buildControlSet(controlsEl);
  buildControlSet(controlsDrawerEl);
}

// ---- interaction: drag to recentre --------------------------------------

let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
});
window.addEventListener('pointerup', () => {
  if (dragging) { dragging = false; updateUrl(); render(); }   // settled: full-res pass
});
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

// ---- mobile controls drawer ------------------------------------------------

controlsToggleEl.addEventListener('click', () => {
  controlsDrawer.classList.toggle('open');
});

// ---- render loop --------------------------------------------------------

function loop() {
  render();
  requestAnimationFrame(loop);
}

// ---- boot ---------------------------------------------------------------

function finishBoot() {
  render();
  if (CAPTURE_NAME) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
  } else {
    requestAnimationFrame(loop);
  }
}

function boot() {
  parseUrlState();
  buildControls();
  if (CAPTURE_NAME) {
    // Deterministic capture: a fixed projection sequence and centre.
    const keys = ['winkelTripel', 'mercator', 'mollweide', 'orthographic', 'hammer'];
    st.projection = keys[Math.min(keys.length - 1, Math.floor(CAPTURE_FRAC * keys.length))];
    document.getElementById('select-projection').value = st.projection;
    st.lon0 = 0.2; st.lat0 = 0.15;
  }
  // Wait for the Earth texture so the first frame (and the capture)
  // shows the map, not bare ocean.
  if (earthImg.complete && earthImg.naturalWidth) {
    buildTexData();
    finishBoot();
  } else {
    earthImg.addEventListener('load', () => { buildTexData(); finishBoot(); }, { once: true });
    earthImg.addEventListener('error', finishBoot, { once: true });
  }
}

earthImg.src = '../../../assets/maps/earth_bluemarble_2048.jpg';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
