// Asymptotic g-mode period spacing in red giants. The scene is a vertical
// cross-section of the star with the WKB displacement eigenfunction xi_n(r)
// times the angular factor P_l(cos theta) and cos(omega t). The two diagnostics
// are the buoyancy frequency N(r) that fixes the cavity and the period comb
// whose even spacing is Pi_1; both come from the one buoyancy integral in
// sim.js. The spacing Pi_1 separates the RGB (inert He core) from the red-clump
// (He-core burning) stars. Canvas2D only.
//
// Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology (2010),
// Ch. 3.4; Bedding et al., Nature 471 (2011) 608 (the RGB / red-clump split).

import { fontString } from '../../../shared/js/canvas-type.js';
import { setupCanvas, stack, clipTo } from '../../../shared/js/render/vertical-layout.js';
import { rdbu } from '../../../shared/js/render/colormaps.js';
import { PROFILES, brunt, phaseIntegral, pi1FromProfile, Pi_l, evolutionStage, modeProfileArray } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });

const selProfile = document.getElementById('select-profile');
const selL = document.getElementById('select-l');
const sN = document.getElementById('slider-n'), vN = document.getElementById('value-n');
const sSpeed = document.getElementById('slider-speed'), vSpeed = document.getElementById('value-speed');
const vProfile = document.getElementById('value-profile');
const vL = document.getElementById('value-l');
const btnReset = document.getElementById('btn-reset');
const btnPause = document.getElementById('btn-pause');

const NR = 240;
const st = { profile: 'rgb', l: 1, n: 14, speed: 1, running: !DETERMINISTIC, t: 0, modeArr: null, Pi1: 80, P_n: 1500 };

let view = { w: 800, h: 1000, dpr: 1 };
let REG = null, disk = null;

function relayout() {
  view = setupCanvas(canvas, ctx);
  REG = stack({ width: view.w, height: view.h }, [
    { name: 'scene', weight: 1.5 },
    { name: 'brunt', weight: 0.95 },
    { name: 'comb', weight: 0.9 },
  ]);
}

function colors() {
  const css = getComputedStyle(document.body);
  return {
    bg: css.getPropertyValue('--bg').trim() || '#060608',
    panel: '#0a0c12',
    fg: css.getPropertyValue('--fg').trim() || '#e8e8e8',
    muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6',
    border: 'rgba(255,255,255,0.12)', grid: 'rgba(255,255,255,0.09)',
    cavity: '#78c8ff', bv: '#ffd98c', comb: '#ffd166', comb2: '#5bc0eb',
  };
}

// Shared RdBu blended toward a dark neutral at the midpoint, so the nodal
// surfaces (displacement zero) read as dark contour lines.
function rdbuDark(v) {
  const t = 0.5 + 0.5 * Math.max(-1, Math.min(1, v));
  const c = rdbu(t), w = Math.min(1, Math.abs(v) * 2.6);   // only the nodes (v~0) go dark
  return { r: c.r * w + 14 * (1 - w), g: c.g * w + 16 * (1 - w), b: c.b * w + 24 * (1 - w) };
}

function recompute() {
  const p = PROFILES[st.profile];
  st.modeArr = modeProfileArray(p, st.n, NR);
  const Pi_0 = pi1FromProfile(p) * Math.sqrt(2);
  st.Pi1 = Pi_l(Pi_0, st.l === 1 ? 1 : 2);
  st.P_n = (st.n + 0.5) * st.Pi1;
}

function sampleMode(r) {
  if (r >= 1) return 0;
  const idx = r * NR, i0 = Math.floor(idx), i1 = Math.min(NR, i0 + 1), a = idx - i0;
  return (1 - a) * st.modeArr[i0] + a * st.modeArr[i1];
}
function P_l(cosTheta, l) { return l === 1 ? cosTheta : 0.5 * (3 * cosTheta * cosTheta - 1); }

function panel(col, r, title) {
  ctx.fillStyle = col.panel; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  if (title) {
    ctx.font = fontString(canvas, 'caption', 'sans', 600);
    ctx.fillStyle = col.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(title, r.x + 8, r.y + 7);
  }
}

// Build the cross-section into an offscreen canvas (dpr-safe) and blit it.
function drawCrossSection(col, r) {
  panel(col, r, 'Cross-section: the g-mode standing wave in the buoyancy cavity');
  const titleH = 22, stripH = 26;
  const draw = { x: r.x, y: r.y + titleH, w: r.w, h: r.h - titleH - stripH };
  const ox = draw.x + draw.w / 2, oy = draw.y + draw.h / 2;
  const R = Math.min(draw.w, draw.h) * 0.46;
  const px = Math.max(40, Math.round(R));
  const SZ = 2 * px;
  const p = PROFILES[st.profile];
  const cosWt = Math.cos(st.t);

  if (!disk || disk.width !== SZ) disk = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(SZ, SZ) : Object.assign(document.createElement('canvas'), { width: SZ, height: SZ });
  const dctx = disk.getContext('2d');
  const img = dctx.createImageData(SZ, SZ);
  const d = img.data;
  for (let yy = 0; yy < SZ; yy += 1) {
    for (let xx = 0; xx < SZ; xx += 1) {
      const dx = xx - px, dy = yy - px, rr = Math.hypot(dx, dy), o = (yy * SZ + xx) * 4;
      if (rr >= px - 0.5) { d[o + 3] = 0; continue; }
      const rNorm = rr / px;
      const cosTheta = rr === 0 ? 0 : (-dy) / rr;
      const Nloc = brunt(rNorm, p);
      let bgR = 52, bgG = 24, bgB = 18;
      if (rNorm < p.r_cc) { bgR = 60; bgG = 38; bgB = 22; }
      else if (Nloc > 0.01) { bgR = 44; bgG = 32; bgB = 26; }
      if (Nloc > 0.005) {
        const amp = sampleMode(rNorm) * P_l(cosTheta, st.l) * cosWt * 1.5;
        const c = rdbuDark(amp);
        d[o] = 0.85 * c.r + 0.15 * bgR; d[o + 1] = 0.85 * c.g + 0.15 * bgG; d[o + 2] = 0.85 * c.b + 0.15 * bgB; d[o + 3] = 255;
      } else { d[o] = bgR; d[o + 1] = bgG; d[o + 2] = bgB; d[o + 3] = 255; }
    }
  }
  dctx.putImageData(img, 0, 0);

  ctx.save(); clipTo(ctx, draw);
  ctx.save(); ctx.beginPath(); ctx.arc(ox, oy, R, 0, 2 * Math.PI); ctx.clip();
  ctx.drawImage(disk, ox - R, oy - R, 2 * R, 2 * R); ctx.restore();
  ctx.strokeStyle = 'rgba(255,210,160,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(ox, oy, R, 0, 2 * Math.PI); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,200,255,0.6)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(ox, oy, R * p.r_env, 0, 2 * Math.PI); ctx.stroke();
  if (p.r_cc > 0) { ctx.beginPath(); ctx.arc(ox, oy, R * p.r_cc, 0, 2 * Math.PI); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,210,160,0.85)'; ctx.fillText('photosphere', ox + R * 0.72, oy - R + 8);
  ctx.fillStyle = col.cavity; ctx.fillText('g-mode cavity', draw.x + 10, draw.y + 12);
  if (p.r_cc > 0) { ctx.fillStyle = '#ffb87a'; ctx.fillText('convective core (N=0)', draw.x + 10, draw.y + 28); }
  ctx.restore();

  // readout strip.
  const stage = evolutionStage(st.l === 1 ? st.Pi1 : Pi_l(st.Pi1 * Math.sqrt(st.l * (st.l + 1)), 1));
  const items = [
    [st.profile.toUpperCase(), st.profile === 'rgb' ? '#ffb87a' : col.cavity],
    [`Pi_${st.l} = ${st.Pi1.toFixed(0)} s`, col.comb],
    [`n = ${st.n}`, col.fg],
    [`stage ${stage}`, col.muted],
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = fontString(canvas, 'caption', 'mono', 700);
  let widest = 0; for (const [t] of items) widest = Math.max(widest, ctx.measureText(t).width);
  if (widest > r.w / 4 - 8) ctx.font = fontString(canvas, 'tick', 'mono', 700);
  items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillText(t, r.x + r.w * (i + 0.5) / 4, r.y + r.h - 13); });
}

function drawBrunt(col, r) {
  panel(col, r, 'Buoyancy frequency N(r): the cavity that sets Pi_1');
  const inner = { x: r.x + 40, y: r.y + 28, w: r.w - 40 - 16, h: r.h - 28 - 30 };
  const p = PROFILES[st.profile];
  const xOf = (x) => inner.x + x * inner.w;
  const yOf = (N) => inner.y + inner.h - (N / 8) * inner.h;

  ctx.fillStyle = 'rgba(120,200,255,0.10)'; ctx.fillRect(xOf(p.r_cc), inner.y, xOf(p.r_env) - xOf(p.r_cc), inner.h);
  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('8', inner.x - 5, inner.y); ctx.fillText('0', inner.x - 5, inner.y + inner.h);

  ctx.strokeStyle = col.bv; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 220; i += 1) { const x = i / 220; const X = xOf(x), Y = yOf(brunt(x, p)); i === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
  ctx.stroke();

  // radial nodes of the current mode along the bottom.
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
  let prev = st.modeArr[1];
  for (let i = 2; i <= NR; i += 1) { const cur = st.modeArr[i]; if (prev * cur < 0) { const X = xOf(i / NR); ctx.beginPath(); ctx.moveTo(X, inner.y + inner.h - 5); ctx.lineTo(X, inner.y + inner.h); ctx.stroke(); } prev = cur; }

  ctx.fillStyle = col.bv; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = fontString(canvas, 'tick', 'mono', 700); ctx.fillText('N(r)', inner.x + 6, inner.y + 4);
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('radius  r / R     (cavity shaded; ticks = radial nodes of mode n)', inner.x + inner.w / 2, inner.y + inner.h + 8);
}

function drawComb(col, r) {
  panel(col, r, 'Period comb: even spacing Pi_1 is the asymptotic g-mode signature');
  const inner = { x: r.x + 16, y: r.y + 30, w: r.w - 32, h: r.h - 30 - 30 };
  const Pmin = Math.max(0, st.P_n - 8 * st.Pi1), Pmax = st.P_n + 8 * st.Pi1;
  const xOf = (P) => inner.x + (P - Pmin) / (Pmax - Pmin) * inner.w;

  ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(inner.x, inner.y + inner.h); ctx.lineTo(inner.x + inner.w, inner.y + inner.h); ctx.stroke();
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const raw = (Pmax - Pmin) / 7, mag = Math.pow(10, Math.floor(Math.log10(raw))), q = raw / mag;
  const tick = (q < 1.5 ? 1 : q < 3.5 ? 2 : q < 7.5 ? 5 : 10) * mag;
  for (let P = Math.ceil(Pmin / tick) * tick; P <= Pmax; P += tick) { const X = xOf(P); ctx.strokeStyle = col.grid; ctx.beginPath(); ctx.moveTo(X, inner.y + inner.h); ctx.lineTo(X, inner.y + inner.h + 4); ctx.stroke(); ctx.fillText(String(Math.round(P)), X, inner.y + inner.h + 6); }

  const lineCol = st.l === 1 ? 'rgba(255,209,102,0.55)' : 'rgba(91,192,235,0.55)';
  for (let kk = -8; kk <= 8; kk += 1) {
    const nn = st.n + kk, P = (nn + 0.5) * st.Pi1; if (P < Pmin || P > Pmax) continue;
    const X = xOf(P);
    if (kk === 0) { ctx.strokeStyle = col.comb; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(X, inner.y + 14); ctx.lineTo(X, inner.y + inner.h); ctx.stroke(); ctx.fillStyle = col.comb; ctx.fillText(`n=${nn}`, X, inner.y); }
    else { ctx.strokeStyle = lineCol; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X, inner.y + 18); ctx.lineTo(X, inner.y + inner.h); ctx.stroke(); }
  }
  // spacing bracket between two adjacent teeth.
  const Xa = xOf((st.n + 0.5) * st.Pi1), Xb = xOf((st.n + 1.5) * st.Pi1);
  if (Xb < inner.x + inner.w) {
    ctx.strokeStyle = col.fg; ctx.lineWidth = 1; const yb = inner.y + 26;
    ctx.beginPath(); ctx.moveTo(Xa, yb); ctx.lineTo(Xb, yb); ctx.stroke();
    ctx.fillStyle = col.fg; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(`Pi_${st.l} = ${st.Pi1.toFixed(0)} s`, (Xa + Xb) / 2, yb - 2);
  }
  ctx.fillStyle = col.muted; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('period P (s)', inner.x + inner.w / 2, inner.y + inner.h + 18);
}

function render() {
  if (!REG) relayout();
  if (!st.modeArr) recompute();
  if (st.running && !CAPTURE_NAME) st.t += 0.06 * (st.speed || 0);
  const col = colors();
  ctx.fillStyle = col.bg; ctx.fillRect(0, 0, view.w, view.h);
  drawCrossSection(col, REG.scene);
  drawBrunt(col, REG.brunt);
  drawComb(col, REG.comb);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

function syncLabels() {
  vN.textContent = String(st.n); vSpeed.textContent = String(st.speed);
  vProfile.textContent = st.profile === 'rgb' ? 'RGB' : 'RC'; vL.textContent = String(st.l);
}

selProfile.addEventListener('change', () => { st.profile = selProfile.value; recompute(); syncLabels(); render(); });
selL.addEventListener('change', () => { st.l = parseInt(selL.value, 10); recompute(); syncLabels(); render(); });
sN.addEventListener('input', () => { st.n = parseInt(sN.value, 10); recompute(); syncLabels(); render(); });
sSpeed.addEventListener('input', () => { st.speed = parseInt(sSpeed.value, 10); syncLabels(); });
btnReset.addEventListener('click', () => {
  st.profile = 'rgb'; st.l = 1; st.n = 14; st.speed = 1; st.running = true; st.t = 0;
  selProfile.value = 'rgb'; selL.value = '1'; sN.value = '14'; sSpeed.value = '1';
  btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
  recompute(); syncLabels(); render();
});
btnPause.addEventListener('click', () => { st.running = !st.running; btnPause.textContent = st.running ? 'Pause' : 'Play'; btnPause.setAttribute('aria-pressed', String(!st.running)); });

function bootSync() {
  relayout(); recompute(); syncLabels();
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    if (f < 0.4) { st.profile = 'rgb'; st.n = Math.round(8 + (f / 0.4) * 14); }
    else if (f < 0.6) { st.profile = 'rgb'; st.n = 28; }
    else { st.profile = 'rc'; st.n = Math.round(8 + ((f - 0.6) / 0.4) * 14); }
    selProfile.value = st.profile; sN.value = String(st.n); st.t = 0;   // max-displacement phase
    recompute(); syncLabels();
  }
  render();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); }
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }

window.addEventListener('resize', () => { relayout(); render(); });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { relayout(); render(); }).observe(canvas);

// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return { fields: [
    { key: 'profile-type', label: 'Evolutionary stage', value: evolutionStage(st.l === 1 ? st.Pi1 : Pi_l(st.Pi1 * Math.sqrt(st.l * (st.l + 1)), 1)), format: 'text' },
    { key: 'period-spacing', label: `Pi_${st.l} (s)`, value: st.Pi1, format: 'float' },
    { key: 'mode-degree', label: 'Mode degree l', value: st.l, format: 'float' },
    { key: 'radial-order', label: 'Radial order n', value: st.n, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  const profile = PROFILES[st.profile];
  if (!profile) return [];
  const { total } = phaseIntegral(profile, 400);
  const arr = modeProfileArray(profile, st.n, NR);
  let nodes = 0; for (let i = 1; i <= NR; i += 1) if (arr[i] * arr[i - 1] < 0) nodes += 1;
  return [
    { key: 'phase-integral-positive', label: 'Buoyancy integral positive', value: total > 0 ? 'pass' : 'drift', status: total > 0 ? 'pass' : 'drift' },
    { key: 'mode-nodes', label: 'Mode nodes match radial order', value: `${nodes} vs ${st.n}`, status: Math.abs(nodes - st.n) <= 1 ? 'pass' : 'drift' },
  ];
};
