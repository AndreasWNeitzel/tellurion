// Aperture synthesis on the UV plane. Earth-rotation synthesis: each
// antenna pair sweeps an ellipse in the UV plane as the Earth turns,
// the sampled visibility is inverse-transformed into the dirty image
// (true sky convolved with the dirty beam). Reworked for performance
// (UV accumulated incrementally; the dirty image is the dirty beam
// placed at the source positions, recomputed a few times a second on
// a modest grid, not an O(N_uv * N_pix^2) sum every frame) and for a
// correct, auto-scaled UV plot. Drag any telescope to a new latitude
// and watch its baselines, the UV arcs and the resolution change.
// sim.js holds the testable physics. Reference: Thompson, Moran and
// Swenson, Interferometry and Synthesis in Radio Astronomy, Ch. 4.
import { stationXYZ, baselineLambda, uv, maxBaseline, resolutionMas, dirtyImage } from './sim.js';
import { cividis, fieldToImageData } from '../../../shared/js/render/colormaps.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const W = canvas.width, H = canvas.height;

const telescopes = [
  { name: 'ALMA', lat: -23.0, lon: -67.8 },
  { name: 'VLA', lat: 34.1, lon: -107.6 },
  { name: 'Effelsberg', lat: 50.5, lon: 6.9 },
  { name: 'Metsahovi', lat: 60.2, lon: 24.4 },
  { name: 'JCMT', lat: 19.8, lon: -155.5 },
];
const LAMBDA_MM = 3.0;
const DEC = 30 * Math.PI / 180;
const MAS = Math.PI / 180 / 3600 / 1000;          // milliarcsec -> rad
// Sky model and FOV are scaled to the synthesised resolution (set in
// refreshDirty from the current array), so the beam is properly
// sampled instead of undersampled into pure noise. Offsets are in
// units of the resolution element.
const SRC_REL = [
  { lr: 0, mr: 0, amp: 1.0 },
  { lr: 4.2, mr: 2.1, amp: 0.5 },
  { lr: -3.0, mr: 3.6, amp: 0.28 },
];
let sources = SRC_REL.map((s) => ({ l: 0, m: 0, amp: s.amp }));
let FOV_RAD = 1;
const NT = 360, IMG_N = 72, UV_CAP = 520;

const st = { time: 0, running: !DETERMINISTIC, drag: -1 };
let xyz = telescopes.map((t) => stationXYZ(t.lat, t.lon));
let baselines = [];
function rebuildBaselines() {
  xyz = telescopes.map((t) => stationXYZ(t.lat, t.lon));
  baselines = [];
  for (let i = 0; i < xyz.length; i += 1) for (let j = i + 1; j < xyz.length; j += 1) {
    baselines.push({ ...baselineLambda(xyz[i], xyz[j], LAMBDA_MM), pair: i * 10 + j });
  }
}
rebuildBaselines();

// UV samples accumulated up to st.time, with the Hermitian conjugate
// so the dirty beam is real. Rebuilt only when time/geometry change.
let uvHist = [];
function accumulate() {
  uvHist = [];
  const step = Math.max(1, Math.floor(st.time / 240));   // keep it bounded
  for (let s = 0; s <= st.time; s += step) {
    const Hh = (s / NT) * 2 * Math.PI - Math.PI;
    for (const b of baselines) {
      const p = uv(b.bx, b.by, b.bz, Hh, DEC);
      uvHist.push({ u: p.u, v: p.v, pair: b.pair });
      uvHist.push({ u: -p.u, v: -p.v, pair: b.pair });
    }
  }
}
function uvForImage() {
  if (uvHist.length <= UV_CAP) return uvHist;
  const out = [], stride = uvHist.length / UV_CAP;
  for (let k = 0; k < UV_CAP; k += 1) out.push(uvHist[Math.floor(k * stride)]);
  return out;
}

let dirty = null, dirtyAt = -1;
const off = document.createElement('canvas'); off.width = IMG_N; off.height = IMG_N;
const offCtx = off.getContext('2d');
let idata = null;
function refreshDirty() {
  if (uvHist.length < 6) { dirty = null; return; }
  // match the sky model and FOV to the current synthesised resolution
  const resRad = resolutionMas(xyz, LAMBDA_MM) * MAS;
  FOV_RAD = 13 * resRad;
  sources = SRC_REL.map((s) => ({ l: s.lr * resRad, m: s.mr * resRad, amp: s.amp }));
  const img = dirtyImage(uvForImage(), sources, IMG_N, FOV_RAD);
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < img.length; i += 1) { if (img[i] < mn) mn = img[i]; if (img[i] > mx) mx = img[i]; }
  idata = fieldToImageData(img, IMG_N, IMG_N, mn, mx, cividis, idata);
  offCtx.putImageData(idata, 0, 0);
  dirty = true; dirtyAt = st.time;
}

function panel(x, y, w, h, title) {
  ctx.strokeStyle = 'rgba(220,226,240,0.28)'; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#cdd3e2'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(title, x + 8, y + 16);
}

// world map: lon -> x, lat -> y. Panels start below the DOM readout
// overlay (absolute, top-left) so they never collide with it.
const MAP = { x: 22, y: 104, w: 392, h: 200 };
function mapXY(lat, lon) {
  return [MAP.x + ((lon + 180) / 360) * MAP.w, MAP.y + ((90 - lat) / 180) * MAP.h];
}
function render() {
  ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H);

  // world map + telescopes (draggable in latitude)
  panel(MAP.x, MAP.y, MAP.w, MAP.h, 'Telescopes (drag to move latitude)');
  ctx.strokeStyle = 'rgba(120,150,200,0.10)';
  for (let g = 1; g < 8; g += 1) {
    ctx.beginPath(); ctx.moveTo(MAP.x + g * MAP.w / 8, MAP.y); ctx.lineTo(MAP.x + g * MAP.w / 8, MAP.y + MAP.h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(MAP.x, MAP.y + g * MAP.h / 8); ctx.lineTo(MAP.x + MAP.w, MAP.y + g * MAP.h / 8); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(120,150,200,0.22)';
  ctx.beginPath(); ctx.moveTo(MAP.x, MAP.y + MAP.h / 2); ctx.lineTo(MAP.x + MAP.w, MAP.y + MAP.h / 2); ctx.stroke();
  // active baselines between stations
  ctx.strokeStyle = 'rgba(91,192,235,0.22)'; ctx.lineWidth = 1;
  for (let i = 0; i < telescopes.length; i += 1) for (let j = i + 1; j < telescopes.length; j += 1) {
    const a = mapXY(telescopes[i].lat, telescopes[i].lon), b = mapXY(telescopes[j].lat, telescopes[j].lon);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  for (let i = 0; i < telescopes.length; i += 1) {
    const t = telescopes[i], [x, y] = mapXY(t.lat, t.lon);
    ctx.fillStyle = st.drag === i ? '#fff' : '#ffd57f';
    ctx.beginPath(); ctx.arc(x, y, st.drag === i ? 6 : 4.5, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#aeb6c6'; ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(t.name, x + 7, y + 3);
  }

  // UV plane (auto-scaled to the longest baseline)
  const UVp = { x: MAP.x + MAP.w + 22, y: MAP.y, w: W - (MAP.x + MAP.w + 22) - 22, h: MAP.h };
  panel(UVp.x, UVp.y, UVp.w, UVp.h, 'UV coverage (M lambda)');
  const uvMax = maxBaseline(xyz, LAMBDA_MM) * 1.08;
  const cx = UVp.x + UVp.w / 2, cy = UVp.y + UVp.h / 2;
  const sUV = Math.min(UVp.w, UVp.h) / 2 / uvMax;
  ctx.strokeStyle = 'rgba(120,150,200,0.14)';
  for (const fr of [0.5, 1]) { ctx.beginPath(); ctx.arc(cx, cy, fr * Math.min(UVp.w, UVp.h) / 2, 0, 6.2832); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(UVp.x, cy); ctx.lineTo(UVp.x + UVp.w, cy); ctx.moveTo(cx, UVp.y); ctx.lineTo(cx, UVp.y + UVp.h); ctx.stroke();
  for (const sm of uvHist) {
    const x = cx + sm.u * sUV, y = cy - sm.v * sUV;
    if (x < UVp.x || x > UVp.x + UVp.w || y < UVp.y || y > UVp.y + UVp.h) continue;
    ctx.fillStyle = `hsla(${(sm.pair * 47) % 360},75%,62%,0.55)`;
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.fillStyle = '#8893a6'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'right';
  ctx.fillText(`${(uvMax / 1e6).toFixed(0)} Mλ`, UVp.x + UVp.w - 6, cy - 4);

  // bottom: sky model + dirty image
  const botY = MAP.y + MAP.h + 22, botH = H - botY - 22;
  panel(MAP.x, botY, MAP.w, botH, 'Sky model (truth)');
  panel(UVp.x, botY, UVp.w, botH, 'Dirty image (reconstruction)');
  const skC = [MAP.x + MAP.w / 2, botY + botH / 2 + 6];
  for (const s of sources) {
    const x = skC[0] + s.l / FOV_RAD * (MAP.w / 2 - 16);
    const y = skC[1] - s.m / FOV_RAD * (botH / 2 - 22);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 6 + s.amp * 9);
    g.addColorStop(0, '#ffe9b0'); g.addColorStop(1, 'rgba(255,213,127,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 6 + s.amp * 9, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#ffd57f'; ctx.beginPath(); ctx.arc(x, y, 2 + s.amp * 2.5, 0, 6.2832); ctx.fill();
  }
  if (dirty) {
    const sz = Math.min(UVp.w - 16, botH - 30);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, IMG_N, IMG_N, UVp.x + (UVp.w - sz) / 2, botY + 24, sz, sz);
  } else {
    ctx.fillStyle = '#5a6477'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText('accumulating UV coverage...', UVp.x + UVp.w / 2, botY + botH / 2);
    ctx.textAlign = 'left';
  }

  const res = resolutionMas(xyz, LAMBDA_MM);
  if (readoutEl) {
    readoutEl.innerHTML = `<span class="label">hour angle</span><span class="value">${(st.time / NT * 24 - 12).toFixed(1)} h</span>`
      + `<span class="label">baselines</span><span class="value">${baselines.length}</span>`
      + `<span class="label">uv samples</span><span class="value">${uvHist.length}</span>`
      + `<span class="label">resolution</span><span class="value">${res.toFixed(3)} mas</span>`;
  }
}

function frame() {
  if (st.running && !CAPTURE_NAME) {
    st.time = (st.time + 2) % NT;
    accumulate();
    if (st.time - dirtyAt >= 18 || dirtyAt < 0 || st.time < dirtyAt) refreshDirty();
  }
  render();
  if (!CAPTURE_NAME) requestAnimationFrame(frame);
}

// drag a telescope: vertical = latitude
function pick(mx, my) {
  for (let i = 0; i < telescopes.length; i += 1) {
    const [x, y] = mapXY(telescopes[i].lat, telescopes[i].lon);
    if (Math.hypot(mx - x, my - y) < 12) return i;
  }
  return -1;
}
function evt(e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
}
canvas.addEventListener('pointerdown', (e) => {
  const [mx, my] = evt(e); const i = pick(mx, my);
  if (i >= 0) { st.drag = i; canvas.classList.add('dragging'); canvas.setPointerCapture(e.pointerId); }
});
canvas.addEventListener('pointermove', (e) => {
  if (st.drag < 0) return;
  const [, my] = evt(e);
  const lat = Math.max(-75, Math.min(75, 90 - ((my - MAP.y) / MAP.h) * 180));
  telescopes[st.drag].lat = lat;
  rebuildBaselines(); accumulate(); refreshDirty();
});
function endDrag() { st.drag = -1; canvas.classList.remove('dragging'); }
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

function buildControls() {
  const host = document.getElementById('controls'); if (!host) return;
  host.innerHTML = '';
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = 'hour angle';
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = '0'; inp.max = String(NT); inp.value = String(st.time);
  inp.setAttribute('aria-label', 'hour angle / accumulated time');
  const val = document.createElement('span'); val.className = 'value';
  const sync = () => { val.textContent = `${(st.time / NT * 24 - 12).toFixed(1)} h`; };
  inp.addEventListener('input', () => { st.running = false; st.time = parseInt(inp.value, 10); sync(); accumulate(); refreshDirty(); render(); });
  sync(); row.append(lab, inp, val);
  const brow = document.createElement('div'); brow.className = 'row buttons';
  const bp = document.createElement('button'); bp.type = 'button'; bp.textContent = st.running ? 'Pause' : 'Play';
  bp.addEventListener('click', () => { st.running = !st.running; bp.textContent = st.running ? 'Pause' : 'Play'; if (st.running && !CAPTURE_NAME) requestAnimationFrame(frame); });
  const br = document.createElement('button'); br.type = 'button'; br.textContent = 'Reset';
  br.addEventListener('click', () => { telescopes.forEach((t, i) => { t.lat = [-23, 34.1, 50.5, 60.2, 19.8][i]; }); st.time = 0; rebuildBaselines(); accumulate(); refreshDirty(); render(); });
  brow.append(bp, br);
  host.append(row, brow);
}

function bootSync() {
  buildControls();
  if (CAPTURE_NAME && DETERMINISTIC) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.time = Math.round(8 + f * (NT - 8));
  } else { st.time = 60; }
  accumulate(); refreshDirty(); render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(frame); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(frame); }
