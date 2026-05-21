// playground.js
// Accretion-disc T(r) profile and face-on color rendering.

import { DEFAULT_SEED, mulberry32 } from '../../../shared/js/render/rng.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import {
  temperature, temperatureBare, temperatureToRGB, R_IN, R_TMAX, T_MAX,
  discSED,
} from './sim.js';

const urlParams      = new URLSearchParams(location.search);
const SEED           = parseInt(urlParams.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC  = urlParams.get('deterministic') === '1';
const CAPTURE_NAME   = urlParams.get('capture');
const CAPTURE_FRAC   = parseFloat(urlParams.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const sliderView   = document.getElementById('slider-view');
const sliderRmax   = document.getElementById('slider-rmax');
const sliderSpeed  = document.getElementById('slider-speed');
const valueView    = document.getElementById('value-view');
const valueRmax    = document.getElementById('value-rmax');
const valueSpeed   = document.getElementById('value-speed');
const btnReset     = document.getElementById('btn-reset');
const btnPlayPause = document.getElementById('btn-playpause');

const W = canvas.width, H = canvas.height;
const VIEW_NAMES = ['profile', 'disc', 'SED'];

const state = {
  view: 0,
  rmax: 80,
  speed: 0,
  phase: 0,            // accumulated rotation phase for the disc view
  playing: !(DETERMINISTIC || prefersReducedMotion()),
};

// Disc rendering constants. The disc is the Newtonian Shakura-Sunyaev
// thin disc (no GR light-bending); inclination and the schematic
// Doppler beaming give it the iconic asymmetric, brighter-approaching
// look. BETA_IN is the inner-edge Keplerian speed in units of c, kept
// modest so the beaming is dramatic but bounded.
const INCL = 62 * Math.PI / 180;
const COS_I = Math.cos(INCL), SIN_I = Math.sin(INCL);
const BETA_IN = 0.34;
const BW = 320, BH = 252;                 // offscreen buffer (canvas is 760x600)
const off = document.createElement('canvas');
off.width = BW; off.height = BH;
const offCtx = off.getContext('2d', { alpha: false });
const offImg = offCtx.createImageData(BW, BH);
const offData = offImg.data;

// Temperature -> RGB lookup, log-spaced in radius so the per-pixel path
// is table reads instead of two pow() calls each.
const LUT_N = 1024;
const lutR = new Uint8ClampedArray(LUT_N);
const lutG = new Uint8ClampedArray(LUT_N);
const lutB = new Uint8ClampedArray(LUT_N);
function buildLUT() {
  for (let i = 0; i < LUT_N; i += 1) {
    const r = R_IN * Math.exp((i / (LUT_N - 1)) * Math.log(220 / R_IN));
    const [cr, cg, cb] = temperatureToRGB(temperature(r));
    lutR[i] = cr; lutG[i] = cg; lutB[i] = cb;
  }
}
buildLUT();
const LOG_RMAX_LUT = Math.log(220 / R_IN);
function colorAtR(r, out) {
  let t = Math.log(r / R_IN) / LOG_RMAX_LUT;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const idx = (t * (LUT_N - 1)) | 0;
  out[0] = lutR[idx]; out[1] = lutG[idx]; out[2] = lutB[idx];
}

// Deterministic value noise (seeded), used for the turbulent filaments
// that shear with the differential rotation.
const noiseRng = mulberry32(SEED ^ 0x9e3779b9);
const NG = 96;
const noiseGrid = new Float32Array(NG * NG);
for (let i = 0; i < NG * NG; i += 1) noiseGrid[i] = noiseRng();
function smooth(t) { return t * t * (3 - 2 * t); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const x0 = ((xi % NG) + NG) % NG, y0 = ((yi % NG) + NG) % NG;
  const x1 = (x0 + 1) % NG, y1 = (y0 + 1) % NG;
  const a = noiseGrid[y0 * NG + x0], b = noiseGrid[y0 * NG + x1];
  const c = noiseGrid[y1 * NG + x0], d = noiseGrid[y1 * NG + x1];
  const u = smooth(xf), v = smooth(yf);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

// Seeded faint background stars (fixed; rendered once per draw).
const stars = [];
{
  const sr = mulberry32(SEED ^ 0x1234567);
  for (let i = 0; i < 90; i += 1) {
    stars.push({ x: sr() * BW, y: sr() * BH, a: 0.15 + 0.5 * sr() });
  }
}

function cssVar(n, f) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f; }
const tok = {
  accentCool: cssVar('--accent-cool', '#7fb1d8'),
  accentWarm: cssVar('--accent-warm', '#d68a69'),
};

function drawProfile() {
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(`R_in = 1   R_out = ${state.rmax}   R_Tmax = ${R_TMAX.toFixed(3)}`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(`T(r) = T_in (R_in / r)^(3/4) [1 - sqrt(R_in / r)]^(1/4)`, 30, 40);

  const padL = 40, padR = 40, padT = 70, padB = 90;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, drawW, drawH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, drawW - 1, drawH - 1);

  // X scale: r from R_IN to state.rmax (log)
  function xR(r) {
    const a = Math.log(r), b = Math.log(R_IN), c = Math.log(state.rmax);
    return padL + 4 + (drawW - 8) * (a - b) / (c - b);
  }
  const yMax = T_MAX * 1.1;
  function yT(t) { return padT + drawH - 4 - (drawH - 12) * (t / yMax); }

  // Bare power-law overlay
  ctx.strokeStyle = 'rgba(214, 138, 105, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  const NPTS = drawW;
  for (let i = 0; i < NPTS; i += 1) {
    const t = i / (NPTS - 1);
    const r = R_IN * Math.exp(t * Math.log(state.rmax / R_IN));
    const T = temperatureBare(r);
    const px = padL + 4 + (drawW - 8) * t;
    const py = yT(Math.min(yMax, T));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Full profile
  ctx.strokeStyle = tok.accentCool;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < NPTS; i += 1) {
    const t = i / (NPTS - 1);
    const r = R_IN * Math.exp(t * Math.log(state.rmax / R_IN));
    const T = temperature(r);
    const px = padL + 4 + (drawW - 8) * t;
    const py = yT(T);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // Peak marker
  const peakX = xR(R_TMAX);
  ctx.strokeStyle = '#f1d28a';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(peakX, padT); ctx.lineTo(peakX, padT + drawH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels
  ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = tok.accentCool;
  ctx.textAlign = 'left';
  ctx.fillText('T(r) full', padL + 6, padT + 14);
  ctx.fillStyle = tok.accentWarm;
  ctx.fillText('bare r^(-3/4)', padL + 100, padT + 14);
  ctx.fillStyle = '#f1d28a';
  ctx.textAlign = 'center';
  ctx.fillText('peak at r = 49/36', peakX, padT - 4);
  // r ticks (log)
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (const r of [1, 2, 5, 10, 20, 50, 100, 200]) {
    if (r > state.rmax) continue;
    const px = xR(r);
    if (px > padL && px < padL + drawW) ctx.fillText(`${r}`, px, padT + drawH + 14);
  }
  ctx.fillText('r / R_in (log)', padL + drawW / 2, padT + drawH + 30);
}

function drawDisc() {
  // Render the inclined disc into the offscreen buffer pixel by pixel:
  // deproject each screen pixel through the inclination to disc-plane
  // polar coords, look up the Shakura-Sunyaev blackbody colour, then
  // modulate by turbulent filaments that shear with differential
  // Keplerian rotation and by a schematic Doppler-beaming factor.
  const bcx = BW * 0.5, bcy = BH * 0.52;
  // Disc-plane radius that maps to the buffer edge. The screen radius is
  // proportional to sqrt(r) (r grows quadratically outward), so the hot
  // inner annulus is magnified instead of collapsing to a dot.
  const discPx = Math.min(BW, BH) * 0.46;
  const rmax = state.rmax;
  const ph = state.phase;
  const col = [0, 0, 0];
  let p = 0;
  for (let py = 0; py < BH; py += 1) {
    const Y = (py - bcy) / COS_I;        // undo vertical foreshortening
    for (let px = 0; px < BW; px += 1, p += 4) {
      const X = px - bcx;
      const Rd = Math.sqrt(X * X + Y * Y);
      const frac = Rd / discPx;
      if (frac >= 1) { offData[p] = 5; offData[p + 1] = 5; offData[p + 2] = 7; offData[p + 3] = 255; continue; }
      const r = R_IN + frac * frac * (rmax - R_IN);
      if (r <= R_IN + 0.04) {
        offData[p] = 3; offData[p + 1] = 2; offData[p + 2] = 4; offData[p + 3] = 255;
        continue;
      }
      const phi = Math.atan2(Y, X);
      // Differential Keplerian rotation: Omega ~ r^-1.5.
      const omega = Math.pow(R_IN / r, 1.5);
      const psi = phi - omega * ph;
      const lr = Math.log(r);
      // Two-octave sheared turbulence plus sharpened spiral arms; the
      // smooth pedestal is small so the filaments carry the structure.
      let f = 0.62 * vnoise(lr * 3.6 + 12, (psi * 2.4) / (2 * Math.PI) * NG + 7);
      f += 0.38 * vnoise(lr * 7.4 + 40, (psi * 5.6) / (2 * Math.PI) * NG + 19);
      const arm = Math.pow(0.5 + 0.5 * Math.sin(7 * psi + 2.8 * lr), 1.6);
      let bright = 0.22 + 1.05 * f * (0.4 + 0.85 * arm);
      // Schematic special-relativistic Doppler beaming: approaching side
      // (cos phi > 0) is boosted as delta^3, delta = sqrt(1-b^2)/(1-b_los).
      const beta = BETA_IN * Math.sqrt(R_IN / r);
      const blos = beta * Math.cos(phi) * SIN_I;
      const delta = Math.sqrt(1 - beta * beta) / (1 - blos);
      let boost = delta * delta * delta;
      if (boost < 0.22) boost = 0.22; else if (boost > 4.2) boost = 4.2;
      // Bright hot inner rim just outside the shadow.
      const rim = r < 1.9 ? 1 + 1.4 * Math.exp(-((r - R_TMAX) * (r - R_TMAX)) / 0.5) : 1;
      // Soft fade to the outer edge so the disc dissolves into space.
      const ef = 1 - Math.pow(Math.max(0, (r - 0.55 * rmax)) / (0.45 * rmax), 1.7);
      let m = bright * boost * rim * (ef < 0 ? 0 : ef);
      colorAtR(r, col);
      // Approaching side also colour-shifts slightly bluewards.
      const blu = blos > 0 ? 1 + 1.7 * blos : 1;
      let R8 = col[0] * m, G8 = col[1] * m, B8 = col[2] * m * blu;
      if (R8 > 255) R8 = 255; if (G8 > 255) G8 = 255; if (B8 > 255) B8 = 255;
      offData[p] = R8; offData[p + 1] = G8; offData[p + 2] = B8; offData[p + 3] = 255;
    }
  }
  offCtx.putImageData(offImg, 0, 0);

  // Faint stars behind, then the disc buffer scaled up with smoothing
  // so the filaments read as soft gas rather than blocky pixels.
  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  for (const s of stars) {
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#cdd3df';
    ctx.fillRect((s.x / BW) * W, (s.y / BH) * H, 1.4, 1.4);
  }
  ctx.restore();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(off, 0, 0, BW, BH, 0, 0, W, H);
  // Soft bloom: redraw blurred and lighter-composited for the glow.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.22;
  ctx.filter = 'blur(5px)';
  ctx.drawImage(off, 0, 0, BW, BH, 0, 0, W, H);
  ctx.restore();
  ctx.filter = 'none';

  // Temperature colourbar.
  const barX = W - 130, barY = 70, barW = 14, barH = 180;
  for (let i = 0; i < barH; i += 1) {
    const ratio = 1 - i / barH;
    const [cr, cg, cb] = temperatureToRGB(ratio * T_MAX);
    ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
    ctx.fillRect(barX, barY + i, barW, 1);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.strokeRect(barX + 0.5, barY + 0.5, barW, barH);
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'left';
  ctx.fillText('T / T_max', barX - 6, barY - 8);
  ctx.fillText('1.0', barX + barW + 4, barY + 6);
  ctx.fillText('0.5', barX + barW + 4, barY + barH / 2 + 3);
  ctx.fillText('0', barX + barW + 4, barY + barH);

  // Title bar.
  ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.textAlign = 'left';
  ctx.fillText(`Shakura-Sunyaev disc (R_in = 1, R_out = ${state.rmax | 0}, i = 62 deg)`, 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('colour = local blackbody T; brighter side is Doppler-beamed (approaching)', 30, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText(`hot annulus at r = 1.36 R_in;  rotation phase = ${(state.phase % (2 * Math.PI)).toFixed(2)} rad`, 30, H - 18);
}

// Multicolour-blackbody SED view: F_nu vs nu on log-log axes, with
// the characteristic nu^(1/3) middle slope marked.
function drawSED() {
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'left';
  ctx.fillText('disc-integrated SED  F_ν = ∫ 2πr B_ν(T(r)) dr', 30, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('multicolour blackbody: RJ tail → ν^(1/3) plateau → Wien cutoff', 30, 40);

  const padL = 56, padR = 40, padT = 70, padB = 90;
  const drawW = W - padL - padR, drawH = H - padT - padB;
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(padL, padT, drawW, drawH);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(padL + 0.5, padT + 0.5, drawW - 1, drawH - 1);

  const { nu, Fnu } = discSED(80, state.rmax);
  // Log-log axes.
  let fMax = 1e-30;
  for (const f of Fnu) if (f > fMax) fMax = f;
  const lnuLo = Math.log10(nu[0]), lnuHi = Math.log10(nu[nu.length - 1]);
  const lfLo = Math.log10(fMax) - 4, lfHi = Math.log10(fMax) + 0.4;
  const xN = (n) => padL + 6 + (drawW - 12) * (Math.log10(n) - lnuLo) / (lnuHi - lnuLo);
  const yF = (f) => padT + drawH - 6 - (drawH - 14) * (Math.log10(Math.max(1e-30, f)) - lfLo) / (lfHi - lfLo);
  // Grid.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  for (let l = Math.ceil(lnuLo); l <= lnuHi; l += 1) {
    ctx.beginPath(); ctx.moveTo(xN(Math.pow(10, l)), padT); ctx.lineTo(xN(Math.pow(10, l)), padT + drawH); ctx.stroke();
  }
  // nu^(1/3) reference slope.
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.5)';
  ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
  ctx.beginPath();
  const nA = nu[Math.floor(nu.length * 0.25)], nB = nu[Math.floor(nu.length * 0.6)];
  const fRef = fMax * 0.18;
  ctx.moveTo(xN(nA), yF(fRef * Math.pow(nA / nB, 1 / 3)));
  ctx.lineTo(xN(nB), yF(fRef));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.8)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('F_ν ∝ ν^(1/3)', xN(nB) + 4, yF(fRef) - 6);
  // SED curve.
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let k = 0; k < nu.length; k += 1) {
    const x = xN(nu[k]), y = yF(Fnu[k]);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  for (let l = Math.ceil(lnuLo); l <= lnuHi; l += 1) ctx.fillText(`10^${l}`, xN(Math.pow(10, l)), padT + drawH + 14);
  ctx.fillText('frequency ν  (T_in units)', padL + drawW / 2, padT + drawH + 30);
  ctx.save();
  ctx.translate(padL - 38, padT + drawH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('F_ν  (log)', 0, 0);
  ctx.restore();
}

function drawAll() {
  ctx.fillStyle = '#060608';
  ctx.fillRect(0, 0, W, H);
  if (state.view === 0) drawProfile();
  else if (state.view === 1) drawDisc();
  else drawSED();
}

function tickN(n) { state.phase += n; }

sliderView.addEventListener('input', () => { state.view = parseInt(sliderView.value, 10); valueView.textContent = VIEW_NAMES[state.view]; drawAll(); });
sliderRmax.addEventListener('input', () => { state.rmax = parseFloat(sliderRmax.value); valueRmax.textContent = state.rmax.toFixed(0); drawAll(); });
sliderSpeed.addEventListener('input', () => { state.speed = parseInt(sliderSpeed.value, 10); valueSpeed.textContent = String(state.speed); });
btnReset.addEventListener('click', () => { state.rmax = 80; sliderRmax.value = '80'; valueRmax.textContent = '80'; drawAll(); });
btnPlayPause.addEventListener('click', () => {
  state.playing = !state.playing;
  btnPlayPause.textContent = state.playing ? 'Pause' : 'Play';
  btnPlayPause.setAttribute('aria-pressed', String(!state.playing));
});

function bootSync() {
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    // Frame 0 = profile, frames 1..4 = disc with varying r_out
    if (frac < 0.2) {
      state.view = 0;
      state.rmax = 80;
    } else {
      state.view = 1;
      state.rmax = 50 + frac * 90;
      // Deterministic rotation phase so the four disc frames show the
      // filaments sheared to different angles.
      state.phase = frac * 9.0;
    }
    sliderView.value = String(state.view); valueView.textContent = VIEW_NAMES[state.view];
    sliderRmax.value = state.rmax.toFixed(0); valueRmax.textContent = state.rmax.toFixed(0);
    drawAll();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME, seed: SEED } }));
          window.__simulationReady = true;
          window.__simulationReadyDetail = { capture: CAPTURE_NAME, seed: SEED };
        });
      });
    }
    return;
  }
  drawAll();
}

function tick() {
  if (state.playing) {
    // Advance the rotation phase when in disc view and speed > 0. The
    // outer disc turns slowly; inner annuli shear ahead via the
    // r^-1.5 factor applied per pixel in drawDisc.
    if (state.view === 1 && state.speed > 0) state.phase += state.speed * 0.012;
    drawAll();
  }
  requestAnimationFrame(tick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
