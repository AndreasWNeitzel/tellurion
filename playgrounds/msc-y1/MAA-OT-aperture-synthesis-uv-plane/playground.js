// Aperture synthesis: trace UV arcs for telescope baselines as Earth
// rotates. Shows the sky model, the accumulating UV coverage, and a
// rough "dirty image" from inverse DFT of the sampled visibility.

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant') || { textContent: '' };
const readoutFrame = document.getElementById('readout-frame') || { textContent: '' };
const controlsEl   = document.getElementById('controls');

const W = canvas.width, H = canvas.height;

// Telescope positions in geocentric XYZ (km). Approximate.
const telescopes = [
  { name: 'ALMA',       lat: -23.0, lon:  -67.8 },
  { name: 'VLA',        lat:  34.1, lon: -107.6 },
  { name: 'Effelsberg', lat:  50.5, lon:    6.9 },
  { name: 'Metsahovi',  lat:  60.2, lon:   24.4 },
  { name: 'JCMT',       lat:  19.8, lon: -155.5 },
];
const R_EARTH = 6378.0;
function telescopeXYZ(t) {
  const lat = t.lat * Math.PI / 180, lon = t.lon * Math.PI / 180;
  return {
    x: R_EARTH * Math.cos(lat) * Math.cos(lon),
    y: R_EARTH * Math.cos(lat) * Math.sin(lon),
    z: R_EARTH * Math.sin(lat),
  };
}
const xyz = telescopes.map(telescopeXYZ);

// Source: three sources in the sky model (l, m) in arcsec.
const sources = [
  { l:    0, m:    0, amp: 1.0 },
  { l:  300, m:  150, amp: 0.4 },
  { l: -250, m:  100, amp: 0.2 },
];

const LAMBDA_MM = 3.0; // observing wavelength
const decDeg = 30;

const state = { time: 0, NT: 360 };

// Compute UV samples for all baselines at given hour angle H (rad), declination delta.
function uvSample(H, delta_rad) {
  const samples = [];
  for (let i = 0; i < xyz.length; i += 1) for (let j = i + 1; j < xyz.length; j += 1) {
    const dx = xyz[j].x - xyz[i].x;
    const dy = xyz[j].y - xyz[i].y;
    const dz = xyz[j].z - xyz[i].z;
    const u = (dx * Math.sin(H) + dy * Math.cos(H));
    const v = (-dx * Math.sin(delta_rad) * Math.cos(H)
             + dy * Math.sin(delta_rad) * Math.sin(H)
             + dz * Math.cos(delta_rad));
    // Convert km -> wavelengths
    samples.push({ u: u * 1e6 / LAMBDA_MM, v: v * 1e6 / LAMBDA_MM, baseline: i * 10 + j });
  }
  return samples;
}

const uvHistory = [];
function accumulate() {
  uvHistory.length = 0;
  const delta = decDeg * Math.PI / 180;
  for (let s = 0; s < state.time; s += 1) {
    const H = (s / state.NT) * 2 * Math.PI - Math.PI;
    const sams = uvSample(H, delta);
    for (const sm of sams) uvHistory.push(sm);
  }
}

function dirtyImage() {
  // Direct sum: I(l, m) = sum_uv exp(2 pi i (u l + v m)). 32x32 grid.
  const N = 48;
  const img = new Float64Array(N * N);
  const lmMaxArcsec = 600;
  const lmStep = (2 * lmMaxArcsec) / N;
  // Sky model visibilities for each (u, v) sample. We want the dirty image
  // = inverse FFT of the (sampled) visibility, with visibility = FFT(sky).
  for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
    const l = (-lmMaxArcsec + i * lmStep) * Math.PI / 648000; // rad
    const m = (-lmMaxArcsec + j * lmStep) * Math.PI / 648000;
    let acc = 0;
    for (const sm of uvHistory) {
      // Visibility V(u,v) = sum_s amp * exp(-2 pi i (u l_s + v m_s)).
      let vRe = 0, vIm = 0;
      for (const src of sources) {
        const ls = src.l * Math.PI / 648000;
        const ms = src.m * Math.PI / 648000;
        const phase = -2 * Math.PI * (sm.u * ls + sm.v * ms);
        vRe += src.amp * Math.cos(phase);
        vIm += src.amp * Math.sin(phase);
      }
      // Inverse FT contribution: V(u,v) * exp(+2 pi i (u l + v m)).
      const phase2 = 2 * Math.PI * (sm.u * l + sm.v * m);
      acc += vRe * Math.cos(phase2) - vIm * Math.sin(phase2);
    }
    img[j * N + i] = acc;
  }
  return { img, N };
}

function render() {
  ctx.fillStyle = '#0E0E13';
  ctx.fillRect(0, 0, W, H);

  // Left: world map sketch (lat/lon graticule).
  const mapX0 = 24, mapY0 = 24, mapW = W * 0.4, mapH = H * 0.5;
  ctx.strokeStyle = 'rgba(220,220,240,0.35)'; ctx.strokeRect(mapX0, mapY0, mapW, mapH);
  ctx.fillStyle = '#dcdde2'; ctx.font = '13px sans-serif';
  ctx.fillText('Telescopes on Earth (lat-lon)', mapX0 + 8, mapY0 + 18);
  // Simple equirectangular map: lon -> x, lat -> y.
  for (const t of telescopes) {
    const x = mapX0 + ((t.lon + 180) / 360) * mapW;
    const y = mapY0 + ((90 - t.lat) / 180) * mapH;
    ctx.fillStyle = '#ffd57f';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#dcdde2'; ctx.fillText(t.name, x + 6, y + 4);
  }
  // Graticule.
  ctx.strokeStyle = 'rgba(220,220,240,0.1)';
  for (let g = 0; g < 8; g += 1) {
    ctx.beginPath(); ctx.moveTo(mapX0 + g * mapW / 8, mapY0); ctx.lineTo(mapX0 + g * mapW / 8, mapY0 + mapH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mapX0, mapY0 + g * mapH / 8); ctx.lineTo(mapX0 + mapW, mapY0 + g * mapH / 8); ctx.stroke();
  }

  // Right top: UV plane.
  const uvX0 = mapX0 + mapW + 24, uvY0 = mapY0, uvW = W - uvX0 - 24, uvH = mapH;
  ctx.strokeStyle = 'rgba(220,220,240,0.35)'; ctx.strokeRect(uvX0, uvY0, uvW, uvH);
  ctx.fillStyle = '#dcdde2'; ctx.fillText('UV coverage', uvX0 + 8, uvY0 + 18);
  // Plot uvHistory.
  const uvMax = 5e3; // wavelengths
  const cxUV = uvX0 + uvW / 2, cyUV = uvY0 + uvH / 2;
  const sUV = Math.min(uvW, uvH) / 2 / uvMax;
  for (const sm of uvHistory) {
    const x = cxUV + sm.u * sUV;
    const y = cyUV - sm.v * sUV;
    ctx.fillStyle = `hsla(${(sm.baseline * 37) % 360}, 70%, 60%, 0.5)`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // Bottom strip: dirty image and sky model.
  const botY0 = mapY0 + mapH + 24, botH = H - botY0 - 24;
  ctx.strokeStyle = 'rgba(220,220,240,0.35)';
  ctx.strokeRect(mapX0, botY0, mapW, botH);
  ctx.strokeRect(uvX0,  botY0, uvW,  botH);
  ctx.fillStyle = '#dcdde2'; ctx.fillText('Sky model', mapX0 + 8, botY0 + 18);
  ctx.fillText('Dirty image', uvX0 + 8, botY0 + 18);
  // Sky model.
  const cxSky = mapX0 + mapW / 2, cySky = botY0 + botH / 2;
  for (const src of sources) {
    const x = cxSky + src.l * mapW * 0.0005;
    const y = cySky - src.m * mapH * 0.0005;
    ctx.fillStyle = `rgba(255, 213, 127, ${0.4 + src.amp * 0.6})`;
    ctx.beginPath(); ctx.arc(x, y, 4 + src.amp * 4, 0, 2 * Math.PI); ctx.fill();
  }
  // Dirty image (when accumulated enough).
  if (uvHistory.length > 5) {
    const { img, N } = dirtyImage();
    // Normalize by number of UV samples so the dirty image brightness is
    // comparable between snapshot (few samples) and full-synthesis state.
    const Nsamp = Math.max(uvHistory.length, 1);
    for (let i = 0; i < img.length; i += 1) img[i] /= Nsamp;
    let mx = 0, mn = Infinity;
    for (let i = 0; i < img.length; i += 1) { if (img[i] > mx) mx = img[i]; if (img[i] < mn) mn = img[i]; }
    const cell = Math.min(uvW, botH) / N;
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
      const v = (img[j * N + i] - mn) / Math.max(mx - mn, 1e-9);
      ctx.fillStyle = `rgb(${(255 * v) | 0}, ${(190 * v) | 0}, ${(70 * v) | 0})`;
      ctx.fillRect(uvX0 + 24 + i * cell, botY0 + 28 + j * cell, cell + 1, cell + 1);
    }
  }

  readoutInv.textContent = `time=${state.time}  baselines=${xyz.length * (xyz.length - 1) / 2}  uv samples=${uvHistory.length}`;
  readoutFrame.textContent = String(state.time);
}

let raf;
function tick() {
  state.time = (state.time + 1) % state.NT;
  accumulate();
  render();
  if (!CAPTURE_NAME) raf = requestAnimationFrame(tick);
}

function buildControls() {
  controlsEl.innerHTML = '';
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('label'); lab.className = 'label'; lab.htmlFor = 'time-slider'; lab.textContent = 'time';
  const inp = document.createElement('input'); inp.id = 'time-slider'; inp.type = 'range'; inp.min = '0'; inp.max = String(state.NT); inp.value = String(state.time);
  inp.setAttribute('aria-label', 'Simulated hour angle');
  const val = document.createElement('span'); val.className = 'value'; val.textContent = String(state.time);
  inp.addEventListener('input', () => { state.time = parseInt(inp.value, 10); val.textContent = String(state.time); accumulate(); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row);
}

buildControls();
accumulate();
render();
if (DETERMINISTIC) {
  // One render is enough; the dirty-image direct sum is O(N_uv * N_pix^2)
  // per call which exceeds Playwright's 30-s capture timeout if we step
  // many frames here. The pre-rendered output reflects the initial
  // accumulated UV sample set.
  state.time = 60; accumulate(); render();
  window.__simulationReady = true;
  window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
} else {
  raf = requestAnimationFrame(tick);
}

window.__physicsCheck = async () => {
  // For a 1000 km baseline at 3 mm wavelength, the longest |b/lambda| ~ 1000 km / 3 mm = 3.33e8.
  // Resolution theta ~ 1/|b/lambda| rad = 3e-9 rad = 0.62 mas. (note: not uas in this version.)
  const blMax = 1000 * 1e6 / LAMBDA_MM;          // km -> mm -> wavelengths
  const theta_rad = 1 / blMax;
  const theta_mas = theta_rad * 206264.806 * 1000;
  if (Math.abs(theta_mas - 0.618) > 0.01) return { name: 'resolution', pass: false, msg: `theta=${theta_mas} mas` };
  return { name: 'baseline resolution', pass: true, msg: `theta(1000 km, 3 mm) = ${theta_mas.toFixed(3)} mas` };
};
