// Friedmann cosmography made physical: the scale factor a(t) evolves
// from the Big Bang through matter-era deceleration, past the
// acceleration onset, into Lambda-dominated expansion. An expanding
// comoving patch of galaxies tracks a(t) as cosmic time sweeps. The
// a(t) curve is built parametrically from the unchanged sim.js
// (E, ageGyr, comovingDistanceMpc, hubbleTimeGyr).

import { E, ageGyr, comovingDistanceMpc } from './sim.js';
import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

const params        = new URLSearchParams(location.search);
const SEED          = parseInt(params.get('seed') ?? `0x${DEFAULT_SEED.toString(16)}`, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME  = params.get('capture');
const CAPTURE_FRAC  = parseFloat(params.get('captureFraction') ?? 'NaN');

const canvas     = document.getElementById('stage');
const ctx        = canvas.getContext('2d', { alpha: false });
const readoutT0  = document.getElementById('readout-t0');
const readoutDc  = document.getElementById('readout-dc');
const sliderOm   = document.getElementById('slider-om');
const sliderH0   = document.getElementById('slider-h0');
const valueOm    = document.getElementById('value-om');
const valueH0    = document.getElementById('value-h0');

const W = canvas.width, H = canvas.height;
const rng = makeRng(SEED);
let Om = parseFloat(sliderOm.value);
let H0 = parseFloat(sliderH0.value);
let phase = 0;          // animation phase (fraction of the shown time span)

sliderOm.addEventListener('input', () => { Om = parseFloat(sliderOm.value); valueOm.textContent = Om.toFixed(3); rebuild(); });
sliderH0.addEventListener('input', () => { H0 = parseFloat(sliderH0.value); valueH0.textContent = H0.toFixed(1); rebuild(); });

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

// Parametric a(t): sample redshift from the far past (z large) to the
// far future (z -> -0.9, a -> 10). t comes from sim.js ageGyr.
let TAB = [];
function rebuild() {
  const Ol = 1 - Om;
  const zs = [];
  for (let i = 0; i <= 60; i += 1) zs.push(30 * Math.pow(1 - i / 60, 3));   // 30 .. 0, dense near 0
  for (let i = 1; i <= 28; i += 1) zs.push(-0.9 * (i / 28));                // 0 .. -0.9 (future)
  TAB = zs.map((z) => ({ t: ageGyr(z, Om, Ol, H0), a: 1 / (1 + z), z }));
  TAB.sort((p, q) => p.t - q.t);
}
function aAt(t) {
  if (t <= TAB[0].t) return TAB[0].a;
  if (t >= TAB[TAB.length - 1].t) return TAB[TAB.length - 1].a;
  let lo = 0, hi = TAB.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (TAB[m].t < t) lo = m; else hi = m; }
  const f = (t - TAB[lo].t) / (TAB[hi].t - TAB[lo].t || 1);
  return TAB[lo].a + f * (TAB[hi].a - TAB[lo].a);
}
rebuild();

const GAL = Array.from({ length: 130 }, () => ({ x: rng() * 2 - 1, y: rng() * 2 - 1, s: 0.6 + rng() * 1.3 }));

const PLOT_H = H * 0.40;

function drawAofT(c, tNow, tMax) {
  const padL = 56, padR = 16, padT = 20, padB = 26;
  const x0 = padL, x1 = W - padR, y0 = padT, y1 = PLOT_H - padB;
  const aMax = 4;
  const X = (t) => x0 + (x1 - x0) * t / tMax;
  const Y = (a) => y1 - (y1 - y0) * Math.min(a, aMax) / aMax;

  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) { const x = x0 + (x1 - x0) * i / 5; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.moveTo(x0, Y(1)); ctx.lineTo(x1, Y(1)); ctx.stroke();

  const t0 = ageGyr(0, 1 - Om, undefined, H0) || ageGyr(0, Om, 1 - Om, H0);
  // a(t) curve: solid past (t <= t0), dashed future.
  ctx.lineWidth = 2.4;
  for (const seg of [{ to: t0, dash: [], col: '#ffd166' }, { from: t0, dash: [6, 5], col: 'rgba(167,139,250,0.9)' }]) {
    ctx.strokeStyle = seg.col; ctx.setLineDash(seg.dash); ctx.beginPath();
    let st = false;
    for (let i = 0; i <= 240; i += 1) {
      const t = tMax * i / 240;
      if (seg.to !== undefined && t > seg.to) break;
      if (seg.from !== undefined && t < seg.from) continue;
      const x = X(t), y = Y(aAt(t));
      if (!st) { ctx.moveTo(x, y); st = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Today (a = 1) and Big Bang markers.
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(t0), Y(1), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`today  t0=${t0.toFixed(1)} Gyr`, X(t0), Y(1) - 10);
  ctx.fillStyle = '#ef476f';
  ctx.beginPath(); ctx.arc(X(0), Y(0), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.textAlign = 'left'; ctx.fillText('Big Bang', X(0) + 6, y1 - 4);

  // Animated "now" marker sweeping cosmic time.
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(X(tNow), y0); ctx.lineTo(X(tNow), y1); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(tNow), Y(aAt(tNow)), 4, 0, 2 * Math.PI); ctx.fill();

  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('scale factor a(t): decelerate (matter) -> accelerate (Lambda)', x0 + 4, y0 + 10);
  ctx.textAlign = 'right'; ctx.fillText('t (Gyr) ->', x1 - 2, y1 + 16);
}

function drawUniverse(c, aNow, tNow, zNow) {
  const top = PLOT_H, x0 = 16, y0 = top + 8, pw = W - 32, ph = H - top - 30;
  ctx.fillStyle = '#04050a'; ctx.fillRect(x0, y0, pw, ph);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, pw - 1, ph - 1);
  const cx = x0 + pw / 2, cy = y0 + ph / 2;
  // Comoving galaxies separated by a(t); redshift tint grows with a.
  const base = Math.min(pw, ph) * 0.085 * aNow;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();
  const red = Math.min(1, Math.max(0, (aNow - 1) / 3));
  for (const g of GAL) {
    const x = cx + g.x * base, y = cy + g.y * base;
    if (x < x0 - 4 || x > x0 + pw + 4 || y < y0 - 4 || y > y0 + ph + 4) continue;
    ctx.fillStyle = `rgba(${180 + 60 * red | 0},${205 - 90 * red | 0},${255 - 110 * red | 0},0.7)`;
    ctx.beginPath(); ctx.arc(x, y, g.s, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = c.fg; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('comoving patch: separations scale with a(t)', x0 + 8, y0 + 16);
  ctx.font = '20px ui-monospace, monospace'; ctx.fillStyle = '#ffd166';
  ctx.fillText(`t = ${tNow.toFixed(1)} Gyr   a = ${aNow.toFixed(2)}   z = ${zNow > -0.01 ? zNow.toFixed(2) : zNow.toFixed(2)}`, x0 + 8, y0 + ph - 14);
}

function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  const tMax = TAB[TAB.length - 1].t;
  const tNow = phase * tMax;
  const aNow = aAt(tNow);
  const zNow = 1 / aNow - 1;
  drawAofT(c, tNow, tMax);
  drawUniverse(c, aNow, tNow, zNow);
  const Ol = 1 - Om;
  readoutT0.textContent = ageGyr(0, Om, Ol, H0).toFixed(2);
  readoutDc.textContent = comovingDistanceMpc(1.0, Om, Ol, H0).toFixed(0);
}

let last = 0;
function loop(now) {
  if (!last) last = now;
  phase += Math.min(0.05, (now - last) / 1000) * 0.12;
  last = now;
  if (phase > 1) phase = 0;
  render();
  requestAnimationFrame(loop);
}

function bootSync() {
  valueOm.textContent = Om.toFixed(3);
  valueH0.textContent = H0.toFixed(1);
  if (Number.isFinite(CAPTURE_FRAC)) {
    Om = 0.10 + 0.55 * CAPTURE_FRAC;
    sliderOm.value = String(Om); valueOm.textContent = Om.toFixed(3);
    rebuild();
    phase = 0.12 + 0.8 * CAPTURE_FRAC;
    render();
    if (DETERMINISTIC) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, Om, H0 };
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
