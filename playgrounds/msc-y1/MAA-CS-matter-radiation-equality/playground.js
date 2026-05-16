// Matter-radiation equality made physical: the contents of an expanding
// comoving patch run through the radiation era (hot photon gas, rho_r
// ~ a^-4), past equality a_eq into the matter era (rho_m ~ a^-3, gravity
// switches on and matter clumps), then the Lambda era. The rho(a) plot
// is kept as a synced strip. sim.js (rhoMatter/Radiation/Lambda, aEq,
// zEq, HoverH0) is unchanged.

import {
  rhoMatter, rhoRadiation, rhoLambda, aEq, zEq,
} from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas     = document.getElementById('stage');
const ctx        = canvas.getContext('2d', { alpha: false });
const readoutZeq = document.getElementById('readout-zeq');
const readoutAeq = document.getElementById('readout-aeq');
const sliderOm   = document.getElementById('slider-om');
const sliderOr   = document.getElementById('slider-or');
const valueOm    = document.getElementById('value-om');
const valueOr    = document.getElementById('value-or');

const W = canvas.width, H = canvas.height;
const rng = makeRng(SEED);
let Om = parseFloat(sliderOm.value);
let Or = parseFloat(sliderOr.value);
let logA = -6;                 // current log10(scale factor), animated

sliderOm.addEventListener('input', () => { Om = parseFloat(sliderOm.value); valueOm.textContent = Om.toFixed(3); });
sliderOr.addEventListener('input', () => { Or = parseFloat(sliderOr.value); valueOr.textContent = Or.toExponential(2); });

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg:    css.getPropertyValue('--bg').trim() || '#060608',
    fg:    css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    accent:css.getPropertyValue('--accent').trim() || '#ffd166',
    grid:  '#23252a',
  };
}

// Fixed comoving particle seeds: photons and matter share the box; matter
// has a few attractor centres it drifts toward once gravity dominates.
const PH = Array.from({ length: 150 }, () => ({ x: rng(), y: rng(), p: rng() }));
const MA = Array.from({ length: 150 }, () => ({ x: rng(), y: rng(), c: (rng() * 4) | 0 }));
const CENTRES = Array.from({ length: 4 }, () => ({ x: 0.2 + 0.6 * rng(), y: 0.2 + 0.6 * rng() }));

const SCENE_H = H * 0.60;

function era(a) {
  const aeq = aEq(Om, Or);
  const OL = Math.max(0, 1 - Om - Or);
  const aLam = Math.cbrt(Om / Math.max(OL, 1e-9));   // matter = Lambda
  if (a < aeq) return 'radiation';
  if (a < aLam) return 'matter';
  return 'Lambda';
}

function drawUniverse(c, a) {
  const x0 = 16, y0 = 26, pw = W - 32, ph = SCENE_H - 26;
  const aeq = aEq(Om, Or);
  const ep = era(a);
  // Background tint by dominant component.
  const bg = ep === 'radiation' ? '#120a14' : ep === 'matter' ? '#0a0c12' : '#0c0814';
  ctx.fillStyle = bg; ctx.fillRect(x0, y0, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, pw - 1, ph - 1);

  // Photon temperature: T ~ 1/a. Map to a blue(hot) -> red(cold) colour
  // and to the radiation energy density (drops fastest).
  const T = 1 / a;
  const hot = Math.max(0, Math.min(1, (Math.log10(T) + 1) / 7));   // 0 cold .. 1 hot
  const photonAlpha = Math.max(0.05, Math.min(0.9,
    rhoRadiation(a, Or) / (rhoRadiation(a, Or) + rhoMatter(a, Om)) ));
  const matterFrac = 1 - photonAlpha;

  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();

  // Photons: drift (comoving positions wrap as space expands), colour by
  // temperature, opacity by the radiation share of the energy budget.
  for (const q of PH) {
    const px = x0 + (((q.x + logA * 0.04) % 1 + 1) % 1) * pw;
    const py = y0 + (((q.y + q.p * 0.13) % 1 + 1) % 1) * ph;
    const r = Math.round(120 + 135 * (1 - hot));
    const b = Math.round(120 + 135 * hot);
    ctx.strokeStyle = `rgba(${r},${140 + 40 * hot | 0},${b},${0.10 + 0.7 * photonAlpha})`;
    ctx.lineWidth = 1.4;
    const wl = 3 + 9 * (1 - hot);                 // longer wiggle when redshifted
    ctx.beginPath();
    for (let s = 0; s <= 6; s += 1) {
      const xx = px + s * 2.2, yy = py + Math.sin(s * 1.6 + q.p * 6) * (wl * 0.4);
      if (s === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }

  // Matter: dots that, once matter dominates, drift toward attractor
  // centres (structure formation switches on at equality).
  const clump = Math.max(0, Math.min(1, (Math.log10(a) - Math.log10(aeq)) / 2));
  for (const m of MA) {
    const cen = CENTRES[m.c];
    const mx = m.x + (cen.x - m.x) * clump * 0.85;
    const my = m.y + (cen.y - m.y) * clump * 0.85;
    const px = x0 + mx * pw, py = y0 + my * ph;
    ctx.fillStyle = `rgba(255,224,150,${0.12 + 0.8 * matterFrac})`;
    ctx.beginPath(); ctx.arc(px, py, 1.6 + 1.2 * clump, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = c.fg; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('expanding universe: contents by epoch', x0 + 8, y0 + 16);
  ctx.font = '20px ui-monospace, monospace';
  ctx.fillStyle = ep === 'radiation' ? '#ef6fa0' : ep === 'matter' ? '#ffd166' : '#a78bfa';
  ctx.fillText(`${ep}-dominated`, x0 + 8, y0 + ph - 34);
  const z = 1 / a - 1;
  ctx.font = '12px ui-monospace, monospace'; ctx.fillStyle = c.muted;
  ctx.fillText(`a = ${a.toExponential(2)}   z = ${z > 0 ? z.toExponential(2) : '0'}`, x0 + 8, y0 + ph - 12);
  ctx.textAlign = 'right'; ctx.fillStyle = '#5bc0eb';
  ctx.fillText('photons redshift + dilute ~ a^-4', x0 + pw - 8, y0 + 16);
  ctx.fillStyle = '#ffd166';
  ctx.fillText('matter dilutes ~ a^-3, then clumps', x0 + pw - 8, y0 + 32);
}

function drawDensity(c, a) {
  const top = SCENE_H;
  ctx.fillStyle = c.bg; ctx.fillRect(0, top, W, H - top);
  const padL = 60, padR = 16, padT = 12, padB = 26;
  const x0 = padL, x1 = W - padR, y0 = top + padT, y1 = H - padB;
  const aMinLog = -8, aMaxLog = 2, rMinLog = -8, rMaxLog = 30;
  const xFor = (la) => x0 + (x1 - x0) * (la - aMinLog) / (aMaxLog - aMinLog);
  const yFor = (lr) => y0 + (y1 - y0) * (1 - (lr - rMinLog) / (rMaxLog - rMinLog));
  const OL = Math.max(0, 1 - Om - Or);

  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let la = aMinLog; la <= aMaxLog; la += 2) {
    const x = xFor(la);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
  }
  const curve = (color, f) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    let st = false;
    for (let i = 0; i <= 200; i += 1) {
      const la = aMinLog + (aMaxLog - aMinLog) * i / 200;
      const lr = Math.log10(f(Math.pow(10, la)));
      if (lr < rMinLog || lr > rMaxLog) { st = false; continue; }
      const xx = xFor(la), yy = yFor(lr);
      if (!st) { ctx.moveTo(xx, yy); st = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  };
  curve('#5bc0eb', (av) => rhoRadiation(av, Or));
  curve('#ffd166', (av) => rhoMatter(av, Om));
  curve('#a78bfa', () => rhoLambda(OL));

  const aeq = aEq(Om, Or);
  if (aeq > 0) {
    const xe = xFor(Math.log10(aeq));
    ctx.strokeStyle = '#ef476f'; ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xe, y0); ctx.lineTo(xe, y1); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ef476f'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText('a_eq', xe + 4, y0 + 12);
  }
  // Synced marker at the current scale factor.
  const xm = xFor(Math.max(aMinLog, Math.min(aMaxLog, Math.log10(a))));
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xm, y0); ctx.lineTo(xm, y1); ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('rho/rho_crit  vs  a   (blue=radiation, gold=matter, violet=Lambda)', x0 + 6, y0 + 10);
  ctx.textAlign = 'right';
  ctx.fillText('a ->', x1 - 4, y1 + 14);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  const a = Math.pow(10, logA);
  drawUniverse(c, a);
  drawDensity(c, a);
  readoutZeq.textContent = zEq(Om, Or).toFixed(0);
  readoutAeq.textContent = aEq(Om, Or).toExponential(3);
}

let last = 0;
function loop(now) {
  if (!last) last = now;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  logA += dt * 0.9;                      // sweep early -> today, then loop
  if (logA > 0.3) logA = -6;
  render();
  requestAnimationFrame(loop);
}

function bootSync() {
  valueOm.textContent = Om.toFixed(3);
  valueOr.textContent = Or.toExponential(2);
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    logA = -6 + frac * 6.2;              // radiation era -> today across frames
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, Om, Or };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      }));
    }
    return;
  }
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true });
} else {
  bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop);
}
