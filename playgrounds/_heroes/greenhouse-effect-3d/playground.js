// Greenhouse Effect hero. Three-panel layout:
//   LEFT: cross-section of Earth + atmosphere + space, with photon
//     paths. SW photons (cyan) stream down from the Sun; LW photons
//     (red) emit from the surface, with a fraction escaping to space
//     and the rest re-emitted back down by the greenhouse layer.
//   TOP-RIGHT: T_surf vs CO2 curve, log-x, with the current point
//     and 1850 / 2025 / 2x CO2 reference points marked.
//   MID-RIGHT: energy budget bar chart (Trenberth-Fasullo style):
//     incoming SW, reflected SW, absorbed SW, surface LW emission,
//     atmospheric back-radiation, top-of-atmosphere LW outflow.
//   BOTTOM-RIGHT: blackbody emission spectrum at T_surf with CO2 and
//     H2O absorption bands shown.
// All four panels update LIVE when CO2, albedo, or solar constant
// sliders move. The previous version had a 3D Earth scene with
// imperceptible slider effects; this layout pins each parameter to a
// visible diagnostic.
//
// Reference: Pierrehumbert, Principles of Planetary Climate, CUP 2010,
// Ch. 4 (single-layer grey atmosphere); Trenberth, Fasullo and Kiehl,
// BAMS 90 (2009) 311 (energy budget diagram).

import {
  S_SOLAR_WM2, SIGMA_SB, emissionTemperature_K, surfaceTemperature_K,
  multilayerSurfaceTemperature_K, tauFromCO2, GHE_PRESETS, makeRng,
} from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const params = new URLSearchParams(location.search);
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const DETERMINISTIC = params.get('deterministic') === '1';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;

// Readouts (DOM).
const rCo2 = document.getElementById('readout-co2');
const rA = document.getElementById('readout-A');
const rTau = document.getElementById('readout-tau');
const rTeff = document.getElementById('readout-Teff');
const rTsurf = document.getElementById('readout-Tsurf');

// Controls.
const selPreset = document.getElementById('select-preset'), vPreset = document.getElementById('value-preset');
const sCo2 = document.getElementById('slider-co2'), vCo2 = document.getElementById('value-co2');
const sA = document.getElementById('slider-A'), vAv = document.getElementById('value-A');
const sRho = document.getElementById('slider-rho'), vRho = document.getElementById('value-rho');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const st = {
  preset: 'current',
  co2_ppm: 420,
  A: 0.30,
  n_layers: 1,
  rho: 80,
  running: !prefersReducedMotion(),
  t: 0,
  photons: [],          // live photons (animated)
};
let last = performance.now();

function applyPreset(name) {
  const p = GHE_PRESETS[name];
  if (!p) return;
  st.preset = name;
  st.co2_ppm = p.co2_ppm;
  st.A = p.A;
  st.n_layers = p.n_layers;
  sCo2.value = String(Math.min(1e6, p.co2_ppm));
  sA.value = String(p.A);
}

// =========================================================================
// LAYOUT.
// =========================================================================
const SCENE = { x: 24, y: 36, w: Math.floor(W * 0.46), h: H - 60 };
const RIGHT_X = SCENE.x + SCENE.w + 24;
const RIGHT_W = W - RIGHT_X - 24;
const PANEL_GAP = 16;
const PANEL_H = (H - 60 - 2 * PANEL_GAP) / 3;
const PANELS = {
  curve:     { x: RIGHT_X, y: SCENE.y, w: RIGHT_W, h: PANEL_H },
  budget:    { x: RIGHT_X, y: SCENE.y + PANEL_H + PANEL_GAP, w: RIGHT_W, h: PANEL_H },
  spectrum:  { x: RIGHT_X, y: SCENE.y + 2 * (PANEL_H + PANEL_GAP), w: RIGHT_W, h: PANEL_H },
};

// =========================================================================
// SCENE: vertical column with space (top), atmosphere band, surface
// (bottom). Photons are sampled positions with v_y and a 'state' field
// (sw_down, lw_up, lw_back, lw_escape, reflected).
// =========================================================================
function spawnSWPhoton(rng) {
  return {
    kind: 'sw',
    x: SCENE.x + 20 + rng() * (SCENE.w - 40),
    y: SCENE.y + 10,
    vy: 110,
    life: 0,
  };
}
function spawnLWPhoton(rng) {
  return {
    kind: 'lw_up',
    x: SCENE.x + 20 + rng() * (SCENE.w - 40),
    y: SCENE.y + SCENE.h - 50,
    vy: -90,
    life: 0,
  };
}

let _rng = makeRng(0xC0FFEE);

// Fractional-spawn accumulators so a sub-unit rate per frame still
// produces a steady stream. Without these, a rate of 0.3 photons/frame
// rounded to int(0.3) = 0 starves the animation and it stops.
let _swAccum = 0, _lwAccum = 0;
function stepPhotons(dt) {
  const tau = tauFromCO2(st.co2_ppm);
  const surfaceY = SCENE.y + SCENE.h - 50;
  const atmTop = SCENE.y + 90;
  const atmBot = SCENE.y + SCENE.h - 130;
  // SW photons. Rate scales with the rho slider; the visual flux is
  // physically tied to (1 - A) but we already paint that via the
  // reflected fraction at spawn time.
  _swAccum += st.rho * dt * 1.2;
  while (_swAccum >= 1) {
    _swAccum -= 1;
    const ph = spawnSWPhoton(_rng);
    if (_rng() < st.A) {
      ph.kind = 'sw_reflect'; ph.vy = -110;
      ph.y = SCENE.y + 10 + _rng() * 30;
    }
    st.photons.push(ph);
  }
  // LW photons. The emission rate at the surface scales as sigma T^4;
  // we floor the LW rate at 0.4 * rho so even cold (snowball) and hot
  // (venus) presets keep a visible photon stream.
  const Tsurf = currentTsurf();
  const lwScale = Math.max(0.4, Math.min(3.0, (Tsurf / 288) ** 4));
  _lwAccum += st.rho * dt * 1.2 * lwScale;
  while (_lwAccum >= 1) {
    _lwAccum -= 1;
    st.photons.push(spawnLWPhoton(_rng));
  }
  // Step.
  for (let i = st.photons.length - 1; i >= 0; i -= 1) {
    const p = st.photons[i];
    p.y += p.vy * dt;
    p.life += dt;
    // Outcome decisions.
    if (p.kind === 'sw') {
      // Hits surface? Get absorbed (disappear). Reflected fraction
      // already handled at spawn.
      if (p.y >= surfaceY) st.photons.splice(i, 1);
      else if (p.y < SCENE.y - 4 || p.life > 20) st.photons.splice(i, 1);
    } else if (p.kind === 'sw_reflect') {
      if (p.y < SCENE.y - 4) st.photons.splice(i, 1);
    } else if (p.kind === 'lw_up') {
      // Decide fate at the atmospheric layer (between atmTop and atmBot).
      if (p.y < atmTop) {
        // Now decide: escape with probability tau, else turn back.
        if (_rng() < tau) p.kind = 'lw_escape';
        else { p.kind = 'lw_back'; p.vy = 80; }
      }
      if (p.y < SCENE.y - 4) st.photons.splice(i, 1);
    } else if (p.kind === 'lw_escape') {
      if (p.y < SCENE.y - 4) st.photons.splice(i, 1);
    } else if (p.kind === 'lw_back') {
      if (p.y >= surfaceY) st.photons.splice(i, 1);
    }
    // Hard cap.
    if (st.photons.length > 600) st.photons.splice(0, st.photons.length - 600);
  }
}

function currentTsurf() {
  if (st.preset === 'venus_runaway') {
    return multilayerSurfaceTemperature_K(S_SOLAR_WM2, st.A, tauFromCO2(st.co2_ppm), st.n_layers);
  }
  return surfaceTemperature_K(S_SOLAR_WM2, st.A, tauFromCO2(st.co2_ppm));
}

// =========================================================================
// SCENE rendering.
// =========================================================================
function drawScene() {
  // Background: space (top), atmosphere band, surface (bottom).
  const x0 = SCENE.x, y0 = SCENE.y;
  ctx.fillStyle = '#02030a';
  ctx.fillRect(x0, y0, SCENE.w, SCENE.h);
  // Stars
  const r = makeRng(0xD15EA5E);
  for (let i = 0; i < 60; i++) {
    const sx = x0 + r() * SCENE.w;
    const sy = y0 + r() * (SCENE.h * 0.35);
    ctx.fillStyle = `rgba(200, 220, 255, ${(0.20 + 0.5 * r()).toFixed(2)})`;
    ctx.fillRect(sx, sy, 1, 1);
  }
  // Atmosphere band (its opacity depends on CO2 -> tau_LW).
  const atmY = SCENE.y + 90;
  const atmH = (SCENE.y + SCENE.h - 130) - atmY;
  const tau = tauFromCO2(st.co2_ppm);
  const opacity = Math.max(0.10, 0.85 * (1 - tau));   // visible band thickness/colour scales with greenhouse trap.
  const grad = ctx.createLinearGradient(0, atmY, 0, atmY + atmH);
  grad.addColorStop(0, `rgba(180, 130, 80, ${opacity * 0.55})`);
  grad.addColorStop(1, `rgba(120, 90, 60, ${opacity * 0.85})`);
  ctx.fillStyle = grad;
  ctx.fillRect(x0, atmY, SCENE.w, atmH);
  // Atmosphere top/bottom guide lines.
  ctx.strokeStyle = 'rgba(220, 220, 255, 0.22)';
  ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0, atmY); ctx.lineTo(x0 + SCENE.w, atmY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, atmY + atmH); ctx.lineTo(x0 + SCENE.w, atmY + atmH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(220, 220, 255, 0.65)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('top of atmosphere', x0 + 8, atmY - 4);
  ctx.fillText(`greenhouse layer  τ_LW = ${tau.toFixed(3)}`, x0 + 8, atmY + atmH / 2 + 4);
  // Surface (Earth crust + sun-warmed reds; colour gets hotter with
  // Tsurf). Three-band gradient: dark blue ice (< 250 K) -> green
  // habitable (~ 288 K) -> orange (~ 320 K) -> red glowing (> 400 K).
  const surfY = SCENE.y + SCENE.h - 50;
  const Tsurf = currentTsurf();
  function surfColor(T) {
    if (T < 250) return [40, 80, 160];
    if (T < 310) {
      const u = (T - 250) / 60;
      return [40 + 100 * u, 80 + 110 * u, 160 - 100 * u];
    }
    if (T < 420) {
      const u = (T - 310) / 110;
      return [140 + 115 * u, 190 - 110 * u, 60 - 60 * u];
    }
    const u = Math.min(1, (T - 420) / 320);
    return [255, 80 + (1 - u) * 30, 30 - u * 30];
  }
  const sc = surfColor(Tsurf);
  ctx.fillStyle = `rgb(${Math.round(sc[0])}, ${Math.round(sc[1])}, ${Math.round(sc[2])})`;
  ctx.fillRect(x0, surfY, SCENE.w, SCENE.y + SCENE.h - surfY);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.font = 'bold 13px ui-monospace, monospace';
  ctx.fillText(`surface  T = ${Tsurf.toFixed(1)} K  (${(Tsurf - 273.15).toFixed(1)} °C)`,
    x0 + 8, surfY + 18);

  // Big surface thermometer on the right of the scene. The mercury
  // height tracks T_surf directly, providing a strong visual cue when
  // the user moves CO2 or albedo sliders.
  const thermX = SCENE.x + SCENE.w - 28, thermY = atmY + atmH + 4, thermH = surfY - thermY - 6;
  ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
  ctx.fillRect(thermX - 10, thermY, 18, thermH);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.45)';
  ctx.strokeRect(thermX - 10.5, thermY + 0.5, 18, thermH);
  const thermFrac = Math.min(1, Math.max(0, (Tsurf - 200) / (750 - 200)));
  const fillH = thermFrac * (thermH - 4);
  ctx.fillStyle = `rgb(${Math.round(sc[0])}, ${Math.round(sc[1])}, ${Math.round(sc[2])})`;
  ctx.fillRect(thermX - 8, thermY + thermH - fillH - 2, 14, fillH);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  for (const T of [200, 300, 400, 500, 600, 700]) {
    const u = (T - 200) / 550;
    const y = thermY + thermH - u * (thermH - 4);
    if (u >= 0 && u <= 1) {
      ctx.fillRect(thermX + 8, y, 4, 1);
      ctx.fillText(`${T}`, thermX + 14, y + 3);
    }
  }
  // Sun marker.
  const sunR = 18;
  const sunX = x0 + SCENE.w - 50;
  const sunY = y0 + 22;
  const sunG = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2);
  sunG.addColorStop(0, 'rgba(255, 240, 200, 1)');
  sunG.addColorStop(0.5, 'rgba(255, 200, 110, 0.6)');
  sunG.addColorStop(1, 'rgba(255, 150, 60, 0)');
  ctx.fillStyle = sunG;
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR * 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255, 245, 220, 1)';
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255, 220, 140, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`Sun S = ${S_SOLAR_WM2.toFixed(0)} W/m²`, x0 + 8, y0 + 14);

  // Photons. Each rendered as a glowing disc with a fading motion
  // trail in the direction of travel. Makes the streams visually pop
  // and gives a sense of motion in static screenshots.
  for (const p of st.photons) {
    let col, glowCol;
    if (p.kind === 'sw') { col = 'rgba(120, 220, 255, 1)'; glowCol = 'rgba(120, 220, 255, 0.35)'; }
    else if (p.kind === 'sw_reflect') { col = 'rgba(180, 220, 255, 0.95)'; glowCol = 'rgba(180, 220, 255, 0.30)'; }
    else if (p.kind === 'lw_up') { col = 'rgba(255, 130, 110, 1)'; glowCol = 'rgba(255, 130, 110, 0.35)'; }
    else if (p.kind === 'lw_escape') { col = 'rgba(255, 200, 120, 1)'; glowCol = 'rgba(255, 200, 120, 0.40)'; }
    else if (p.kind === 'lw_back') { col = 'rgba(255, 110, 90, 1)'; glowCol = 'rgba(255, 110, 90, 0.35)'; }
    // Trail.
    const trailLen = 14;
    const trailDy = -p.vy * 0.04;
    const gr = ctx.createLinearGradient(p.x, p.y, p.x, p.y + trailDy * trailLen);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = gr; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + trailDy * trailLen); ctx.stroke();
    // Glow.
    const gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6);
    gl.addColorStop(0, glowCol); gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
    // Core dot.
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2); ctx.fill();
  }

  // Flux arrows were drawn on top of the photon column and made the
  // scene unreadable. The energy-budget bar chart on the right panel
  // already conveys the magnitudes; the in-scene arrows added visual
  // clutter without new information.

  // Legend strip ABOVE the surface band (in the dark lower-atmosphere
  // region) so it doesn't sit on top of a glowing surface colour.
  const lyy = surfY - 8;
  let lxx = x0 + 6;
  function legend(col, txt) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(lxx, lyy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220, 230, 255, 0.95)';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(txt, lxx + 7, lyy + 3);
    lxx += ctx.measureText(txt).width + 26;
  }
  legend('rgba(120, 220, 255, 0.95)', 'SW in');
  legend('rgba(180, 220, 255, 0.75)', 'SW reflected');
  legend('rgba(255, 130, 110, 0.95)', 'LW up');
  legend('rgba(255, 180, 120, 0.95)', 'LW escape');
  legend('rgba(255, 110, 90, 0.95)', 'LW back-rad');
}

// =========================================================================
// PANEL: T_surf vs CO2 curve.
// =========================================================================
function drawCurvePanel() {
  const p = PANELS.curve;
  ctx.fillStyle = 'rgba(15, 22, 36, 0.85)';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('surface temperature  T_surf  vs  CO₂', p.x + 10, p.y + 16);
  // x = log10(co2_ppm) in [log10(50), log10(1e6)]; y = T_surf in [200, 400] K.
  const ax = p.x + 40, ay = p.y + 30;
  const aw = p.w - 60, ah = p.h - 50;
  const xLo = Math.log10(50), xHi = Math.log10(1e6);
  const yLo = 200, yHi = 400;
  function xOf(c) { return ax + ((Math.log10(c) - xLo) / (xHi - xLo)) * aw; }
  function yOf(T) { return ay + ah - ((T - yLo) / (yHi - yLo)) * ah; }
  // Grid + ticks.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  for (let dec = 2; dec <= 6; dec += 1) {
    const xp = xOf(Math.pow(10, dec));
    ctx.beginPath(); ctx.moveTo(xp, ay); ctx.lineTo(xp, ay + ah); ctx.stroke();
  }
  for (let T = 200; T <= 400; T += 50) {
    const yp = yOf(T);
    ctx.beginPath(); ctx.moveTo(ax, yp); ctx.lineTo(ax + aw, yp); ctx.stroke();
  }
  // Curve: T_surf(co2) for current A.
  ctx.strokeStyle = '#5bc0eb'; ctx.lineWidth = 2;
  ctx.beginPath();
  let first = true;
  for (let i = 0; i <= 200; i += 1) {
    const c = Math.pow(10, xLo + (i / 200) * (xHi - xLo));
    const T = surfaceTemperature_K(S_SOLAR_WM2, st.A, tauFromCO2(c));
    if (T < yLo || T > yHi) continue;
    const xp = xOf(c), yp = yOf(T);
    if (first) { ctx.moveTo(xp, yp); first = false; } else ctx.lineTo(xp, yp);
  }
  ctx.stroke();
  // Reference points (1850, 2025, 2xCO2).
  function refPt(c, label, color) {
    const T = surfaceTemperature_K(S_SOLAR_WM2, st.A, tauFromCO2(c));
    if (T < yLo || T > yHi) return;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(xOf(c), yOf(T), 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(label, xOf(c) + 5, yOf(T) - 4);
  }
  refPt(280, '1850 (280)', 'rgba(126, 212, 193, 0.95)');
  refPt(420, '2025 (420)', 'rgba(126, 212, 193, 0.95)');
  refPt(560, '2× (560)',  'rgba(126, 212, 193, 0.95)');
  // Current point.
  const curT = surfaceTemperature_K(S_SOLAR_WM2, st.A, tauFromCO2(st.co2_ppm));
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(xOf(st.co2_ppm), yOf(curT), 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(xOf(st.co2_ppm), yOf(curT), 6, 0, Math.PI * 2); ctx.stroke();
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  for (let dec = 2; dec <= 6; dec += 1) ctx.fillText(`10^${dec}`, xOf(Math.pow(10, dec)) - 8, ay + ah + 12);
  for (let T = 200; T <= 400; T += 50) ctx.fillText(`${T}`, ax - 30, yOf(T) + 3);
  ctx.fillText('CO₂ (ppm)', ax + aw / 2 - 26, ay + ah + 24);
  ctx.save();
  ctx.translate(p.x + 14, ay + ah / 2 + 14);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('T (K)', 0, 0);
  ctx.restore();
}

// =========================================================================
// PANEL: energy budget bar chart.
// =========================================================================
function drawBudgetPanel() {
  const p = PANELS.budget;
  ctx.fillStyle = 'rgba(15, 22, 36, 0.85)';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('energy budget  (W / m²)', p.x + 10, p.y + 16);
  const tau = tauFromCO2(st.co2_ppm);
  const Sin = S_SOLAR_WM2 / 4;                                  // global mean SW.
  const SWreflected = Sin * st.A;
  const SWabsorbed = Sin * (1 - st.A);
  const Tsurf = currentTsurf();
  const surfaceLW = SIGMA_SB * Math.pow(Tsurf, 4);
  // Single-layer grey atmosphere: atmosphere emits eps * sigma * Ta^4
  // both up and down; for the simple model the back-radiation equals
  // (1 - tau) * surfaceLW, the part that didn't escape.
  const LWtoSpace = surfaceLW * tau + (1 - tau) * SWabsorbed;
  const backRad = (1 - tau) * surfaceLW;
  // Bars.
  const bars = [
    { label: 'SW in',        value: Sin,         color: 'rgba(120, 220, 255, 0.85)' },
    { label: 'SW reflected', value: SWreflected, color: 'rgba(180, 220, 255, 0.75)' },
    { label: 'SW absorbed',  value: SWabsorbed,  color: 'rgba(91, 192, 235, 0.85)' },
    { label: 'surface LW',   value: surfaceLW,   color: 'rgba(255, 130, 110, 0.90)' },
    { label: 'back-rad',     value: backRad,     color: 'rgba(255, 110, 90, 0.90)' },
    { label: 'LW to space',  value: LWtoSpace,   color: 'rgba(255, 180, 120, 0.90)' },
  ];
  const maxV = Math.max(...bars.map(b => b.value)) * 1.05;
  const bx = p.x + 40, by = p.y + 28;
  const bw = (p.w - 60) / bars.length;
  const bh = p.h - 60;
  for (let i = 0; i < bars.length; i += 1) {
    const b = bars[i];
    const h = (b.value / maxV) * bh;
    ctx.fillStyle = b.color;
    ctx.fillRect(bx + i * bw + 4, by + bh - h, bw - 8, h);
    ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${b.value.toFixed(0)}`, bx + i * bw + bw / 2, by + bh - h - 4);
    ctx.fillText(b.label, bx + i * bw + bw / 2, by + bh + 14);
  }
  ctx.textAlign = 'left';
  // y axis label.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`max ${maxV.toFixed(0)}`, p.x + 6, by + 8);
}

// =========================================================================
// PANEL: blackbody spectrum at T_surf with CO2/H2O bands.
// =========================================================================
function drawSpectrumPanel() {
  const p = PANELS.spectrum;
  ctx.fillStyle = 'rgba(15, 22, 36, 0.85)';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(220, 230, 255, 0.32)';
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = 'rgba(220, 230, 255, 0.92)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('surface emission spectrum + CO₂ / H₂O bands', p.x + 10, p.y + 16);
  const ax = p.x + 40, ay = p.y + 30;
  const aw = p.w - 60, ah = p.h - 50;
  // Wavelength range: 4 to 30 micron.
  const lamLo = 4e-6, lamHi = 30e-6;
  const Tsurf = currentTsurf();
  // Planck B_lambda(T) in arbitrary units; we normalize to its peak.
  function planck(lam, T) {
    const h = 6.62607015e-34, c = 2.99792458e8, k = 1.380649e-23;
    return (2 * h * c * c / Math.pow(lam, 5)) / (Math.exp(h * c / (lam * k * T)) - 1);
  }
  let bmax = 0;
  for (let i = 0; i < 200; i += 1) {
    const lam = lamLo + (i / 199) * (lamHi - lamLo);
    bmax = Math.max(bmax, planck(lam, Tsurf));
  }
  function xOf(lam) { return ax + ((lam - lamLo) / (lamHi - lamLo)) * aw; }
  function yOf(b) { return ay + ah - (b / bmax) * ah; }
  // Absorption-band shading. CO2 main band centred at 15 micron; H2O
  // rotational tails > 20 micron, vibrational band centred at ~ 6.3 micron.
  // The CO2 band STRENGTH scales with log2(co2_ppm) -- visualize this by
  // making the band's vertical fill proportional to (1 - exp(-tau_band)).
  const co2Center = 15e-6, co2Width = 2.5e-6;
  const co2Strength = Math.min(0.95, 0.30 + 0.50 * Math.log2(st.co2_ppm / 280) / 3);
  const co2Color = `rgba(255, 130, 110, ${co2Strength.toFixed(2)})`;
  ctx.fillStyle = co2Color;
  ctx.fillRect(xOf(co2Center - co2Width), ay, xOf(co2Center + co2Width) - xOf(co2Center - co2Width), ah);
  ctx.fillStyle = 'rgba(120, 220, 255, 0.20)';
  ctx.fillRect(xOf(20e-6), ay, xOf(lamHi) - xOf(20e-6), ah);    // H2O rotational tails.
  ctx.fillRect(xOf(5.5e-6), ay, xOf(7.0e-6) - xOf(5.5e-6), ah);  // H2O vibrational.
  // Labels.
  ctx.fillStyle = 'rgba(255, 200, 200, 0.95)';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('CO₂ 15 µm', xOf(co2Center) - 22, ay + 12);
  ctx.fillStyle = 'rgba(160, 220, 255, 0.95)';
  ctx.fillText('H₂O rot.', xOf(23e-6), ay + 12);
  ctx.fillText('H₂O 6 µm', xOf(5.6e-6), ay + 24);
  // Planck curve.
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 200; i += 1) {
    const lam = lamLo + (i / 200) * (lamHi - lamLo);
    const b = planck(lam, Tsurf);
    if (i === 0) ctx.moveTo(xOf(lam), yOf(b)); else ctx.lineTo(xOf(lam), yOf(b));
  }
  ctx.stroke();
  // Axis labels.
  ctx.fillStyle = 'rgba(200, 210, 230, 0.85)';
  ctx.font = '11px ui-monospace, monospace';
  for (const lamUm of [5, 10, 15, 20, 25, 30]) {
    const lam = lamUm * 1e-6;
    if (lam > lamHi) continue;
    ctx.fillText(`${lamUm}`, xOf(lam) - 4, ay + ah + 12);
  }
  ctx.fillText('wavelength (µm)', ax + aw / 2 - 36, ay + ah + 24);
}

// =========================================================================
// MAIN.
// =========================================================================
function render() {
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, W, H);
  drawScene();
  drawCurvePanel();
  drawBudgetPanel();
  drawSpectrumPanel();
  // Top banner readouts.
  const tau = tauFromCO2(st.co2_ppm);
  const Teff = emissionTemperature_K(S_SOLAR_WM2, st.A);
  const Tsurf = currentTsurf();
  rCo2.textContent = st.co2_ppm.toFixed(0);
  rA.textContent = st.A.toFixed(2);
  rTau.textContent = tau.toFixed(3);
  rTeff.textContent = Teff.toFixed(1);
  rTsurf.textContent = Tsurf.toFixed(1);
}

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    if (st.running) stepPhotons(dt);
    render();
  } catch (e) {
    // Don't let one bad frame kill the rAF loop forever; log and keep
    // scheduling. Previous versions were vulnerable to a single
    // exception in render() stopping the animation outright.
    console.error('greenhouse tick failed', e);
  }
  requestAnimationFrame(tick);
}

// Short labels for the preset readout so long names like
// "venus_runaway" don't overflow the 10ch value column and visually
// collide with the dropdown's selected text.
const PRESET_SHORT = {
  preindustrial: '1850',
  current: '2025',
  doubled_co2: '2× CO2',
  snowball: 'Snowball',
  venus_runaway: 'Venus',
};
function readSliders() {
  if (selPreset.value !== st.preset) applyPreset(selPreset.value);
  else {
    st.co2_ppm = parseFloat(sCo2.value);
    st.A = parseFloat(sA.value);
  }
  st.rho = parseFloat(sRho.value);
  vPreset.textContent = PRESET_SHORT[st.preset] ?? st.preset.slice(0, 8);
  vCo2.textContent = String(Math.round(st.co2_ppm));
  vAv.textContent = st.A.toFixed(2);
  vRho.textContent = String(st.rho);
}

[selPreset, sCo2, sA, sRho].forEach(el => el.addEventListener('input', readSliders));
selPreset.addEventListener('change', readSliders);

// Click anywhere in the scene to spawn a burst of 30 SW photons there.
// Lets the user "fire" a packet of sunlight and watch the surface heat
// up; turns the playground from a passive animation into a tangible
// laboratory.
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const cx = (e.clientX - r.left) * (W / r.width);
  const cy = (e.clientY - r.top) * (H / r.height);
  if (cx < SCENE.x || cx > SCENE.x + SCENE.w || cy < SCENE.y || cy > SCENE.y + SCENE.h) return;
  for (let i = 0; i < 30; i += 1) {
    const ph = spawnSWPhoton(_rng);
    ph.x = cx + (_rng() - 0.5) * 30;
    ph.y = cy + (_rng() - 0.5) * 10;
    st.photons.push(ph);
  }
});
btnReset.addEventListener('click', () => { st.t = 0; st.photons.length = 0; applyPreset('current'); readSliders(); });
btnPause.addEventListener('click', () => {
  st.running = !st.running;
  btnPause.textContent = st.running ? 'Pause' : 'Resume';
  btnPause.setAttribute('aria-pressed', String(!st.running));
});

const SHARE_KEYS = {
  co2_ppm: { get: () => st.co2_ppm, set: v => { st.co2_ppm = parseFloat(v); sCo2.value = v; }, parse: parseFloat },
  albedo: { get: () => st.A, set: v => { st.A = parseFloat(v); sA.value = v; }, parse: parseFloat },
  preset: { get: () => st.preset, set: v => { st.preset = v; selPreset.value = v; }, parse: x => x },
};
parseUrlState(SHARE_KEYS);
mountShareButton(document.getElementById('share-mount'), () => ({
  co2_ppm: st.co2_ppm.toFixed(0), albedo: st.A.toFixed(2), preset: st.preset,
}), { label: 'Copy URL' });

applyPreset(st.preset);
readSliders();

if (CAPTURE_NAME) {
  const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
  const presets = ['snowball', 'preindustrial', 'current', 'doubled_co2', 'venus_runaway'];
  const idx = Math.min(presets.length - 1, Math.floor(f * presets.length));
  applyPreset(presets[idx]);
  readSliders();
  // Spawn a few photons for the still frame.
  for (let i = 0; i < 60; i += 1) stepPhotons(0.08);
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
  requestAnimationFrame(tick);
  window.__simulationReady = true;
}
