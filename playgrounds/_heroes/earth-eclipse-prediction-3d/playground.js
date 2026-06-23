// Earth eclipse-prediction playground. 2D world map (equirectangular)
// with the central path, umbra band, and penumbra extent of the
// currently-selected upcoming solar eclipse. Time scrubber walks the
// umbra along the path; click anywhere on the map to query local
// visibility. Data: Espenak-Meeus Five-Millennium Canon (NASA).

import {
  SOLAR_ECLIPSES, LUNAR_ECLIPSES,
  pathPositionAt, visibilityAtPoint,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

// Map area: leave a 46px margin at the top for the title + region label.
const MAP_X = 0, MAP_Y = 46, MAP_W = W, MAP_H = H - 96;

// Zoom state. zoom=1 shows the whole world; >1 zooms in. (cx, cy) are the
// center of the view in [-180, 180] x [-90, 90] coords.
const view = { zoom: 1.0, cx: 0, cy: 20, dragging: false, lastX: 0, lastY: 0 };

// Earth texture: NASA Blue Marble (public-domain), equirectangular,
// 2048 x 1024.
const earthImg = new Image();
let earthImgReady = false;
earthImg.onload = () => { earthImgReady = true; };
earthImg.src = '../../../assets/maps/earth_bluemarble_2048.jpg';

const rDate = document.getElementById('readout-date');
const rType = document.getElementById('readout-type');
const rGut  = document.getElementById('readout-gut');
const rDur  = document.getElementById('readout-dur');
const rMag  = document.getElementById('readout-mag');
const localCirc = document.getElementById('local-circ');
const selEcl = document.getElementById('select-eclipse');
const sT = document.getElementById('slider-t'), vT = document.getElementById('value-t');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnPause = document.getElementById('btn-pause');

const st = {
  eclipseIdx: 2,                  // default: 2026-08-12 total.
  t_frac: 0.5,
  speed: 1,
  running: false,
  clicked: null,                  // { lat, lon } or null.
};

// Populate the eclipse dropdown.
for (let i = 0; i < SOLAR_ECLIPSES.length; i++) {
  const e = SOLAR_ECLIPSES[i];
  const opt = document.createElement('option');
  opt.value = String(i);
  opt.textContent = e.label;
  selEcl.appendChild(opt);
}
selEcl.value = String(st.eclipseIdx);

// =========================================================================
// PROJECTION HELPERS. Equirectangular projection with zoom and pan.
// Zoom > 1 centers on (view.cx, view.cy) and stretches the visible
// lon/lat range by 1/zoom.
// =========================================================================
function visibleSpan() {
  return { spanLon: 360 / view.zoom, spanLat: 180 / view.zoom };
}
function ll2px(lat, lon) {
  // Wrap longitude difference into (-180, 180] so points on the far side
  // of the map can be off-screen consistently.
  let dlon = lon - view.cx;
  dlon = ((dlon % 360) + 540) % 360 - 180;   // O(1) wrap; never spins
  const { spanLon, spanLat } = visibleSpan();
  const u = 0.5 + dlon / spanLon;
  const v = 0.5 - (lat - view.cy) / spanLat;
  return { x: MAP_X + u * MAP_W, y: MAP_Y + v * MAP_H };
}
function px2ll(x, y) {
  const u = (x - MAP_X) / MAP_W, v = (y - MAP_Y) / MAP_H;
  const { spanLon, spanLat } = visibleSpan();
  let lon = view.cx + (u - 0.5) * spanLon;
  const lat = view.cy - (v - 0.5) * spanLat;
  lon = ((lon % 360) + 540) % 360 - 180;   // O(1) wrap; never spins
  return { lat, lon };
}

// =========================================================================
// MAP BACKGROUND: oceans, continents, graticule, equator/tropics.
// =========================================================================
function drawMap() {
  // Ocean fill as a fallback before the image loads.
  ctx.fillStyle = '#0c1428';
  ctx.fillRect(MAP_X, MAP_Y, MAP_W, MAP_H);

  if (earthImgReady) {
    // The Blue Marble JPEG is an equirectangular projection. Compute the
    // source-rect from the visible (lat, lon) span and let the canvas
    // engine resample to fit the map box. We slightly darken the image
    // via globalAlpha so the umbra/penumbra overlays read on top.
    const { spanLon, spanLat } = visibleSpan();
    const iw = earthImg.width, ih = earthImg.height;
    const sx0 = ((view.cx - spanLon / 2 + 180) / 360) * iw;
    const sy0 = ((90 - (view.cy + spanLat / 2)) / 180) * ih;
    const sw = (spanLon / 360) * iw;
    const sh = (spanLat / 180) * ih;
    ctx.save();
    ctx.beginPath();
    ctx.rect(MAP_X, MAP_Y, MAP_W, MAP_H);
    ctx.clip();
    // Handle longitude wrap by drawing two passes if the source rect
    // spans the antimeridian.
    if (sx0 < 0 || sx0 + sw > iw) {
      const sx_a = ((sx0 % iw) + iw) % iw;
      const w_a = Math.min(iw - sx_a, sw);
      const w_b = sw - w_a;
      const x_split = MAP_X + (w_a / sw) * MAP_W;
      ctx.drawImage(earthImg, sx_a, sy0, w_a, sh, MAP_X, MAP_Y, x_split - MAP_X, MAP_H);
      if (w_b > 0) ctx.drawImage(earthImg, 0, sy0, w_b, sh, x_split, MAP_Y, MAP_W - (x_split - MAP_X), MAP_H);
    } else {
      ctx.drawImage(earthImg, sx0, sy0, sw, sh, MAP_X, MAP_Y, MAP_W, MAP_H);
    }
    ctx.restore();
    // Slight darken so the eclipse paths pop.
    ctx.fillStyle = 'rgba(8, 14, 30, 0.25)';
    ctx.fillRect(MAP_X, MAP_Y, MAP_W, MAP_H);
  }

  // Graticule: longitude every 30 deg, latitude every 30 deg.
  ctx.strokeStyle = 'rgba(160, 180, 220, 0.08)';
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) {
    const p1 = ll2px(90, lon), p2 = ll2px(-90, lon);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const p1 = ll2px(lat, -180), p2 = ll2px(lat, 180);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
  // Equator.
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.20)';
  ctx.lineWidth = 1.2;
  const eq1 = ll2px(0, -180), eq2 = ll2px(0, 180);
  ctx.beginPath(); ctx.moveTo(eq1.x, eq1.y); ctx.lineTo(eq2.x, eq2.y); ctx.stroke();
  // Tropics (Cancer +23.44, Capricorn -23.44) and polar circles.
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.08)';
  for (const lat of [23.44, -23.44, 66.56, -66.56]) {
    const t1 = ll2px(lat, -180), t2 = ll2px(lat, 180);
    ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
  }

  // Axis labels.
  ctx.fillStyle = 'rgba(200, 215, 245, 0.55)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (let lon = -180; lon <= 180; lon += 60) {
    const p = ll2px(0, lon);
    ctx.fillText(`${lon}°`, p.x + 2, MAP_Y + MAP_H - 4);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    if (lat === 0) continue;
    const p = ll2px(lat, -180);
    ctx.fillText(`${lat}°`, p.x + 2, p.y - 2);
  }
}

// =========================================================================
// ECLIPSE OVERLAY: penumbra zone, umbra path, current shadow position.
// Polyline drawing must split segments that cross the antimeridian
// (180/-180 boundary) into two halves so the line wraps cleanly.
// =========================================================================
function drawPathPolyline(path, color, widthPx) {
  ctx.strokeStyle = color;
  ctx.lineWidth = widthPx;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  let prev = null;
  for (const p of path) {
    const cur = { lat: p[1], lon: p[2] };
    if (!prev) {
      const pt = ll2px(cur.lat, cur.lon);
      ctx.moveTo(pt.x, pt.y);
    } else {
      const dlon = cur.lon - prev.lon;
      if (Math.abs(dlon) > 180) {
        // The shorter great-circle hop crosses the antimeridian; split.
        const sign = dlon > 0 ? -1 : 1;
        const fracToEdge = (180 * sign - prev.lon) / (cur.lon - prev.lon - sign * 360);
        const latAtEdge = prev.lat + (cur.lat - prev.lat) * fracToEdge;
        const a = ll2px(latAtEdge, 180 * sign);
        const b = ll2px(latAtEdge, -180 * sign);
        ctx.lineTo(a.x, a.y);
        ctx.moveTo(b.x, b.y);
        const c = ll2px(cur.lat, cur.lon);
        ctx.lineTo(c.x, c.y);
      } else {
        const pt = ll2px(cur.lat, cur.lon);
        ctx.lineTo(pt.x, pt.y);
      }
    }
    prev = cur;
  }
  ctx.stroke();
}

function drawEclipse() {
  const ecl = SOLAR_ECLIPSES[st.eclipseIdx];
  if (!ecl) return;

  // The eclipse is a SHADOW: paint both penumbra and umbra as dark
  // overlays that darken the underlying map. Use a black-with-alpha
  // brush so the satellite imagery is dimmed but still visible.

  // Penumbra zone: ~30 deg angular half-width on Earth's surface. The
  // pixel width scales with zoom so the shadow remains anchored to the
  // physical region as the user drills in.
  if (ecl.path && ecl.path.length >= 2) {
    const pxPerDeg = MAP_W / 360 * view.zoom;
    const penumbraWidthPx = Math.max(8, 27 * pxPerDeg);
    drawPathPolyline(ecl.path, 'rgba(0, 0, 0, 0.30)', penumbraWidthPx);
  }

  // Umbra path: narrow dark band where the eclipse is total or annular.
  if (ecl.path && ecl.path.length >= 2 && ecl.path_width_km > 0) {
    const pxPerDeg = MAP_W / 360 * view.zoom;
    const pathWidthDeg = ecl.path_width_km / 111.32;
    const widthPx = Math.max(3, pathWidthDeg * pxPerDeg);
    // Total = near-opaque shadow. Annular = ring-of-sunlight survives, lighter shadow.
    const fill = ecl.type === 'annular' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.85)';
    drawPathPolyline(ecl.path, fill, widthPx);
    // Boundary: thin red (total) or orange (annular) ring so the user
    // still sees where the shadow's edge falls.
    const edge = ecl.type === 'total' ? 'rgba(220, 80, 80, 0.85)'
      : ecl.type === 'annular' ? 'rgba(255, 170, 70, 0.85)'
      : ecl.type === 'hybrid' ? 'rgba(220, 120, 200, 0.85)'
      : 'rgba(180, 180, 240, 0.55)';
    drawPathPolyline(ecl.path, edge, 1.6);
  }

  // Greatest-eclipse marker.
  const maxP = ll2px(ecl.max_lat, ecl.max_lon);
  ctx.strokeStyle = 'rgba(255, 240, 200, 0.95)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(maxP.x - 6, maxP.y); ctx.lineTo(maxP.x + 6, maxP.y);
  ctx.moveTo(maxP.x, maxP.y - 6); ctx.lineTo(maxP.x, maxP.y + 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 240, 200, 0.95)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`greatest ${ecl.max_ut} UT`, maxP.x + 8, maxP.y - 4);

  // Current umbra position (interpolated along path by t_frac). The
  // umbra is a SHADOW, so render it as a dark disc with a soft dark
  // penumbra halo, edged with the type colour for visibility.
  if (ecl.path && ecl.path.length >= 2) {
    const cur = pathPositionAt(ecl.path, st.t_frac);
    if (cur) {
      const cp = ll2px(cur.lat, cur.lon);
      // Soft dark penumbra halo (semi-opaque black, fades outward).
      const g = ctx.createRadialGradient(cp.x, cp.y, 4, cp.x, cp.y, 36);
      g.addColorStop(0, 'rgba(0, 0, 0, 0.70)');
      g.addColorStop(0.5, 'rgba(0, 0, 0, 0.30)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 36, 0, Math.PI * 2); ctx.fill();
      // Hard inner umbra disc.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 7, 0, Math.PI * 2); ctx.fill();
      // Type-coloured edge so the cursor is still readable.
      const edge = ecl.type === 'total' ? 'rgba(220, 80, 80, 0.95)'
        : ecl.type === 'annular' ? 'rgba(255, 170, 70, 0.95)'
        : 'rgba(220, 230, 255, 0.85)';
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cp.x, cp.y, 7, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

function drawClickedLocation() {
  if (!st.clicked) return;
  const ecl = SOLAR_ECLIPSES[st.eclipseIdx];
  const vis = visibilityAtPoint(ecl, st.clicked.lat, st.clicked.lon);
  const cp = ll2px(st.clicked.lat, st.clicked.lon);
  ctx.strokeStyle = vis.totality ? 'rgba(180, 80, 100, 0.95)' : vis.visible ? 'rgba(255, 200, 110, 0.95)' : 'rgba(180, 200, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cp.x, cp.y, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cp.x, cp.y, 14, 0, Math.PI * 2); ctx.stroke();

  // Compute a physical eclipse magnitude m for the clicked point. The
  // standard definition: m = (R_sun + R_moon - d) / (2 R_sun) where d
  // is the angular separation of disc centres. Equivalent: 0 = tangent
  // (no eclipse), 1 = full diameter coverage. We map the great-circle
  // distance from the central line to d via:
  //   d = pathHalfDeg + dist        (above the umbra band)
  // and clamp into [0, R_sun + R_moon].
  const pathHalfDeg = (ecl.path_width_km || 0) * 0.5 / 111.32;
  const penumbraHalfDeg = 30;                       // approximate; ~ angular radius of penumbra cone projected to Earth.
  const RmoonRel = ecl.type === 'annular' ? 0.93
    : ecl.type === 'total' ? 1.04
    : ecl.type === 'hybrid' ? 1.00 : 1.00;
  // Compute the disc separation d in units of Sun radii.
  let dRel;
  if (vis.totality) {
    dRel = 0;                                         // observer in the umbra, centres aligned.
  } else if (vis.visible) {
    // Linear interpolation from d = |1 - R_moon/R_sun| at the umbra
    // edge (just-leaving-totality) up to d = 1 + R_moon/R_sun at the
    // penumbra edge (no overlap).
    const dInner = Math.abs(1 - RmoonRel);
    const dOuter = 1 + RmoonRel;
    const u = (vis.dist - pathHalfDeg) / Math.max(0.1, (penumbraHalfDeg - pathHalfDeg));
    dRel = dInner + (dOuter - dInner) * Math.min(1, Math.max(0, u));
  } else {
    dRel = 1 + RmoonRel + 0.5;                       // outside penumbra: discs clearly separated.
  }
  // Magnitude from the geometric definition.
  const magObs = Math.max(0, (1 + RmoonRel - dRel) / 2);

  // ====================================================================
  // SUN INSET. A 130 x 130 panel anchored in the map's top-right
  // corner. We draw:
  //   - The Sun disc with a radial gradient and (when nearly total) a
  //     corona halo.
  //   - The Moon as a dark disc, offset from the Sun by dRel * R_sun
  //     pixels along a fixed direction so the bite reads visually.
  //   - When the observer is OUTSIDE the penumbra (dRel > 1 + R_moon),
  //     we skip drawing the Moon entirely — the Sun is fully visible.
  // ====================================================================
  const insetX = MAP_X + MAP_W - 150, insetY = MAP_Y + 12;
  const insetW = 130, insetH = 130;
  ctx.fillStyle = 'rgba(8, 14, 26, 0.92)';
  ctx.fillRect(insetX, insetY, insetW, insetH);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(insetX + 0.5, insetY + 0.5, insetW - 1, insetH - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('observer view', insetX + 8, insetY + 14);
  const sx = insetX + insetW / 2, sy = insetY + 54;
  const Rsun = 32;
  const Rmoon = Rsun * RmoonRel;
  const sunGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, Rsun);
  sunGrad.addColorStop(0, 'rgba(255, 245, 200, 1)');
  sunGrad.addColorStop(0.85, 'rgba(255, 200, 110, 1)');
  sunGrad.addColorStop(1, 'rgba(255, 150, 60, 1)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath(); ctx.arc(sx, sy, Rsun, 0, Math.PI * 2); ctx.fill();
  // Corona ring only at totality (Moon completely covers Sun + corona).
  if (vis.totality && ecl.type === 'total') {
    const coronaR = Rsun * 1.7;
    const corona = ctx.createRadialGradient(sx, sy, Rsun * 1.04, sx, sy, coronaR);
    corona.addColorStop(0, 'rgba(255, 240, 200, 0.55)');
    corona.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = corona;
    ctx.beginPath(); ctx.arc(sx, sy, coronaR, 0, Math.PI * 2); ctx.fill();
  }
  // Moon overlay (skipped when there is no eclipse at this location).
  if (vis.visible || vis.totality) {
    const offsetPx = dRel * Rsun;                    // physical offset of Moon centre.
    const dirX = 0.62, dirY = -0.78;                  // fixed direction for the bite.
    const moonX = sx + offsetPx * dirX;
    const moonY = sy + offsetPx * dirY;
    ctx.fillStyle = 'rgba(8, 12, 22, 1)';
    ctx.beginPath(); ctx.arc(moonX, moonY, Rmoon, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(180, 200, 255, 0.40)';
    ctx.beginPath(); ctx.arc(moonX, moonY, Rmoon, 0, Math.PI * 2); ctx.stroke();
  }
  // Two stacked, left-aligned footer lines. They previously shared one
  // baseline, and at the caption size the magnitude readout overran the
  // eclipse-type label, so the two strings overlapped.
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'left';
  ctx.fillStyle = vis.totality ? '#ff8080' : vis.visible ? '#ffd166' : '#9aa0a6';
  ctx.fillText(
    vis.totality ? (ecl.type === 'annular' ? 'annular' : 'total') : vis.visible ? 'partial' : 'none',
    insetX + 8, insetY + insetH - 25,
  );
  ctx.fillStyle = 'rgba(220, 230, 255, 0.95)';
  ctx.fillText(`mag = ${magObs.toFixed(3)}`, insetX + 8, insetY + insetH - 9);

  // Update the local-circ readout under the canvas.
  if (vis.totality) {
    localCirc.textContent = `at ${st.clicked.lat.toFixed(2)}°, ${st.clicked.lon.toFixed(2)}°: WITHIN PATH OF ${ecl.type.toUpperCase()}; magnitude ${ecl.magnitude.toFixed(3)}; greatest eclipse here is near ${ecl.max_ut} UT.`;
  } else if (vis.visible) {
    localCirc.textContent = `at ${st.clicked.lat.toFixed(2)}°, ${st.clicked.lon.toFixed(2)}°: PARTIAL eclipse visible; estimated magnitude ${magObs.toFixed(2)}.`;
  } else {
    localCirc.textContent = `at ${st.clicked.lat.toFixed(2)}°, ${st.clicked.lon.toFixed(2)}°: NOT visible (outside the penumbra).`;
  }
}

function drawTitleBar() {
  const ecl = SOLAR_ECLIPSES[st.eclipseIdx];
  // Solid dark strip behind the title text so it reads on any background.
  ctx.fillStyle = '#050810';
  ctx.fillRect(0, 0, W, MAP_Y);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.95)';
  ctx.font = fontString(canvas, 'heading', 'sans', 600);
  ctx.fillText(ecl.label, 14, 22);
  ctx.fillStyle = 'rgba(200, 215, 245, 0.78)';
  ctx.font = fontString(canvas, 'caption');
  ctx.fillText(ecl.region, 14, 40);
}

function drawLegend() {
  const x = 14, y = H - 38;
  ctx.fillStyle = 'rgba(20, 28, 44, 0.78)';
  ctx.fillRect(x, y, 540, 30);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.18)';
  ctx.strokeRect(x + 0.5, y + 0.5, 539, 29);
  ctx.font = fontString(canvas, 'caption', 'mono');
  // Total band swatch.
  ctx.fillStyle = 'rgba(180, 80, 100, 0.85)';
  ctx.fillRect(x + 8, y + 8, 18, 14);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.fillText('total', x + 30, y + 19);
  // Annular.
  ctx.fillStyle = 'rgba(255, 170, 70, 0.85)';
  ctx.fillRect(x + 80, y + 8, 18, 14);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.fillText('annular', x + 102, y + 19);
  // Penumbra.
  ctx.fillStyle = 'rgba(255, 200, 110, 0.30)';
  ctx.fillRect(x + 168, y + 8, 18, 14);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.fillText('partial (penumbra)', x + 190, y + 19);
  // Current shadow marker.
  ctx.fillStyle = 'rgba(255, 220, 140, 1)';
  ctx.beginPath(); ctx.arc(x + 326, y + 15, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 220, 140, 1)';
  ctx.beginPath(); ctx.arc(x + 326, y + 15, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.fillText('current umbra (t-slider)', x + 336, y + 19);
}

function updateReadout() {
  const ecl = SOLAR_ECLIPSES[st.eclipseIdx];
  rDate.textContent = ecl.id;
  rType.textContent = ecl.type;
  rGut.textContent = ecl.max_ut;
  rDur.textContent = ecl.duration_s > 0 ? `${ecl.duration_s}s` : 'none';
  rMag.textContent = ecl.magnitude.toFixed(3);
}

function render() {
  ctx.fillStyle = '#050810';
  ctx.fillRect(0, 0, W, H);
  drawMap();
  drawEclipse();
  drawClickedLocation();
  drawTitleBar();
  drawLegend();
  updateReadout();
}

// =========================================================================
// EVENT WIRING.
// =========================================================================
selEcl.addEventListener('change', () => {
  st.eclipseIdx = parseInt(selEcl.value, 10);
  st.clicked = null;
  localCirc.textContent = 'Click anywhere on the map to query local visibility.';
});
sT.addEventListener('input', () => { st.t_frac = parseFloat(sT.value); vT.textContent = st.t_frac.toFixed(2); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); vSpeed.textContent = String(st.speed); });
btnPrev.addEventListener('click', () => {
  st.eclipseIdx = (st.eclipseIdx - 1 + SOLAR_ECLIPSES.length) % SOLAR_ECLIPSES.length;
  selEcl.value = String(st.eclipseIdx);
  st.clicked = null;
});
btnNext.addEventListener('click', () => {
  st.eclipseIdx = (st.eclipseIdx + 1) % SOLAR_ECLIPSES.length;
  selEcl.value = String(st.eclipseIdx);
  st.clicked = null;
});
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

// Click handler: query local visibility (only on bare clicks, not drags).
canvas.addEventListener('click', (e) => {
  if (view._wasDrag) { view._wasDrag = false; return; }
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  if (py < MAP_Y || py > MAP_Y + MAP_H) return;
  st.clicked = px2ll(px, py);
});

// Mouse-wheel zoom: zoom toward the cursor position so the user can
// drill into a region naturally.
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const before = px2ll(px, py);
  const factor = Math.exp(-e.deltaY * 0.001);
  view.zoom = Math.max(1, Math.min(40, view.zoom * factor));
  const after = px2ll(px, py);
  view.cx += before.lon - after.lon;
  view.cy += before.lat - after.lat;
  view.cy = Math.max(-80, Math.min(80, view.cy));
}, { passive: false });

// Drag to pan.
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  if (py < MAP_Y || py > MAP_Y + MAP_H) return;
  view.dragging = true; view.lastX = px; view.lastY = py;
  view._wasDrag = false;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!view.dragging) return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const { spanLon, spanLat } = visibleSpan();
  view.cx -= (px - view.lastX) / MAP_W * spanLon;
  view.cy += (py - view.lastY) / MAP_H * spanLat;
  view.cy = Math.max(-80, Math.min(80, view.cy));
  view.lastX = px; view.lastY = py;
  if (Math.abs(px - view.lastX) + Math.abs(py - view.lastY) > 0) view._wasDrag = true;
});
canvas.addEventListener('pointerup', () => { view.dragging = false; });
canvas.addEventListener('pointercancel', () => { view.dragging = false; });

const SHARE_KEYS = {
  eclipse: { get: () => st.eclipseIdx, set: v => { st.eclipseIdx = parseInt(v, 10); selEcl.value = v; }, parse: x => parseInt(x, 10) },
  t_frac:  { get: () => st.t_frac, set: v => { st.t_frac = parseFloat(v); sT.value = v; }, parse: parseFloat },
};
parseUrlState(SHARE_KEYS);
const shareMount = document.getElementById('share-mount');
if (shareMount) mountShareButton(shareMount, SHARE_KEYS);

// =========================================================================
// MAIN LOOP.
// =========================================================================
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (st.running && st.speed > 0) {
    // Walk t_frac from 0 to 1 over ~ 10s / speed.
    const rate = 0.10 * st.speed;
    st.t_frac += dt * rate;
    if (st.t_frac > 1) st.t_frac = 0;
    sT.value = String(st.t_frac);
    vT.textContent = st.t_frac.toFixed(2);
  }
  render();
  requestAnimationFrame(loop);
}

if (CAPTURE_NAME) {
  st.eclipseIdx = Math.min(SOLAR_ECLIPSES.length - 1, Math.floor((CAPTURE_FRAC || 0) * (SOLAR_ECLIPSES.length - 1)));
  selEcl.value = String(st.eclipseIdx);
  st.t_frac = 0.5;
  render();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME } }));
    }));
  } else {
    window.__simulationReady = true;
  }
} else {
  st.running = !prefersReducedMotion();
  btnPause.textContent = st.running ? 'Pause' : 'Play';
  btnPause.setAttribute('aria-pressed', String(!st.running));
  requestAnimationFrame(loop);
  window.__simulationReady = true;
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'earth-sun-distance-au', label: 'Earth-Sun distance', value: st.earthDistance || 1, format: 'float' },
      { key: 'moon-earth-distance-km', label: 'Moon-Earth distance', value: st.moonDistance || 384400, format: 'float' },
      { key: 'eclipse-fraction', label: 'Eclipse fraction', value: st.eclipseFraction || 0, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  // Check that moon radius / moon distance provides eclipse geometry constraint.
  const moonDist = st.moonDistance || 384400;
  const sunDist = st.earthDistance || 1.496e8;
  const moonRadius = 1737;
  const sunRadius = 6.96e5;
  const moonAngularSize = moonRadius / moonDist;
  const sunAngularSize = sunRadius / sunDist;
  const ratio = moonAngularSize / sunAngularSize;
  const status = (ratio > 0.9 && ratio < 1.1) ? 'pass' : 'drift';
  return [
    {
      key: 'angular-size-ratio',
      label: 'Moon/Sun angular size',
      value: ratio.toFixed(3),
      status: status
    }
  ];
};
