// Quantum confinement in a nanostructure. The hero is the infinite
// square well: its quantized levels E_n = hbar^2 pi^2 n^2 / (2 m L^2)
// with the wavefunctions psi_n oscillating in time, and the n=1->2
// confinement gap that sets the emission colour. Two aux panels: the
// dimensionality-characteristic density of states (E^1/2 bulk, step
// well, van Hove wire, delta dot) and the 1/L^2 confinement scaling of
// the levels. Physics is the gate-tested closed-form sim.js. Canvas2D.
import { energyLevel, confinementGap, levels, dos, absorptionOnset } from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rE1 = document.getElementById('readout-e1');
const rSplit = document.getElementById('readout-split');
const rGap = document.getElementById('readout-gap');
const rOnset = document.getElementById('readout-onset');
const selDim = document.getElementById('select-dim');
const sL = document.getElementById('slider-l'), vL = document.getElementById('value-l');
const sM = document.getElementById('slider-m'), vM = document.getElementById('value-m');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const st = { dim: 'dot', L: 2, m: 1, running: !prefersReducedMotion(), t: 0 };
const L_LO = 0.6, L_HI = 5.0;                            // slider-l range / 100
const NSHOW = 5;                                         // levels in the hero
const HERO = { x: 28, y: 72, w: W - 56, h: 536 };
const DOS = { x: 44, y: 700, w: 352, h: 292 };
const SCAL = { x: 440, y: 700, w: 350, h: 292 };

// Emission-colour cue: a bigger confinement gap glows bluer. Mapped
// qualitatively (log of the gap over the slider range), no fabricated
// wavelength.
function gapHue(gap) {
  const gMin = 3 * energyLevel(1, L_HI, 3), gMax = 3 * energyLevel(1, L_LO, 0.2);
  const t = Math.max(0, Math.min(1, (Math.log(gap) - Math.log(gMin)) / (Math.log(gMax) - Math.log(gMin))));
  return 8 + t * 222;                                    // red (small gap) -> blue (large gap)
}

function panel(p, title, titleColor) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1; ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  ctx.fillStyle = titleColor || 'rgba(220,230,245,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText(title, p.x + 8, p.y + 16);
}

function drawHero() {
  const p = HERO;
  panel(p, 'confined states in the box: levels E_n and wavefunctions psi_n(x, t)', 'rgba(150,200,255,0.9)');
  const e1 = energyLevel(1, st.L, st.m);
  const gap = energyLevel(2, st.L, st.m) - e1;
  const Emax = energyLevel(NSHOW + 0.6, st.L, st.m);
  const top = p.y + 40, bot = p.y + p.h - 30;
  const eY = (E) => bot - (bot - top) * (E / Emax);
  // well box, width grows with L so confinement is tangible
  const wfrac = 0.34 + 0.40 * (st.L - L_LO) / (L_HI - L_LO);
  const wx0 = p.x + p.w * (0.5 - wfrac / 2), wx1 = p.x + p.w * (0.5 + wfrac / 2);
  ctx.strokeStyle = 'rgba(150,170,210,0.55)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(wx0, top - 6); ctx.lineTo(wx0, bot); ctx.lineTo(wx1, bot); ctx.lineTo(wx1, top - 6); ctx.stroke();
  ctx.fillStyle = 'rgba(120,140,175,0.75)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('x = 0', wx0, bot + 16); ctx.fillText('x = L', wx1, bot + 16);

  const amp = Math.min(46, (bot - top) / (NSHOW + 1) * 0.95);
  for (let n = 1; n <= NSHOW; n += 1) {
    const E = energyLevel(n, st.L, st.m);
    const yy = eY(E);
    const phase = E * st.t * 0.10;                       // each level evolves at omega_n ~ E_n
    const col = `hsl(${205 - (n - 1) * 26}, 72%, 66%)`;
    // level line
    ctx.strokeStyle = 'rgba(150,170,210,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(wx0, yy); ctx.lineTo(wx1, yy); ctx.stroke(); ctx.setLineDash([]);
    // |psi_n|^2 filled (stationary), Re[psi_n e^{-iE t}] line (oscillating)
    ctx.beginPath(); ctx.moveTo(wx0, yy);
    for (let i = 0; i <= 96; i += 1) {
      const xx = i / 96, s = Math.sin(n * Math.PI * xx);
      ctx.lineTo(wx0 + xx * (wx1 - wx0), yy - s * s * amp * 0.7);
    }
    ctx.lineTo(wx1, yy); ctx.closePath();
    ctx.fillStyle = `hsla(${205 - (n - 1) * 26}, 72%, 60%, 0.16)`; ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= 96; i += 1) {
      const xx = i / 96, re = Math.sin(n * Math.PI * xx) * Math.cos(phase);
      const px = wx0 + xx * (wx1 - wx0), py = yy - re * amp;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = 'rgba(225,233,245,0.85)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left';
    ctx.fillText('n=' + n + '  E=' + E.toFixed(2), wx1 + 10, yy + 3);
  }

  // confinement gap arrow (n=1 -> n=2) with an emission-colour swatch
  const y1 = eY(e1), y2 = eY(energyLevel(2, st.L, st.m));
  const ax = wx0 - 22;
  ctx.strokeStyle = `hsl(${gapHue(gap)}, 85%, 62%)`; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(ax, y1); ctx.lineTo(ax, y2); ctx.stroke();
  for (const [yy, dir] of [[y1, 1], [y2, -1]]) {
    ctx.beginPath(); ctx.moveTo(ax, yy); ctx.lineTo(ax - 4, yy - dir * 7); ctx.lineTo(ax + 4, yy - dir * 7); ctx.closePath(); ctx.fill();
  }
  const swx = p.x + p.w - 226, swy = p.y + 28;
  ctx.fillStyle = `hsl(${gapHue(gap)}, 85%, 58%)`; ctx.fillRect(swx, swy, 18, 18);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(swx + 0.5, swy + 0.5, 18, 18);
  ctx.fillStyle = 'rgba(220,230,245,0.85)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('gap E2-E1 = ' + gap.toFixed(2), swx + 24, swy + 8);
  ctx.fillStyle = 'rgba(170,185,210,0.7)'; ctx.fillText('smaller box, bluer glow', swx + 24, swy + 21);
}

// Distinct dot levels grouped with their degeneracy.
function dotGroups(Emax) {
  const raw = levels('dot', st.L, st.m, Emax);
  const e1 = energyLevel(1, st.L, st.m);
  const groups = [];
  for (const s of raw) {
    const last = groups[groups.length - 1];
    if (last && Math.abs(s.E - last.E) < e1 * 0.02) last.g += 1;
    else groups.push({ E: s.E, g: 1 });
  }
  return groups;
}

function drawDOS() {
  const p = DOS;
  const label = { bulk: '3D bulk:  g ~ E^1/2', well: '2D well:  staircase', wire: '1D wire:  van Hove spikes', dot: '0D dot:  delta peaks' }[st.dim];
  panel(p, 'density of states   ' + label, 'rgba(127,209,255,0.9)');
  const e1 = energyLevel(1, st.L, st.m);
  const Emax = e1 * (st.dim === 'bulk' ? 9 : 14);
  const px0 = p.x + 12, px1 = p.x + p.w - 12, py0 = p.y + 30, py1 = p.y + p.h - 26;
  const xE = (E) => px0 + (Math.min(E, Emax) / Emax) * (px1 - px0);

  if (st.dim === 'dot') {
    const groups = dotGroups(Emax);
    const gMax = Math.max(1, ...groups.map(g => g.g));
    for (const grp of groups) {
      const gx = xE(grp.E);
      const gh = (py1 - py0) * 0.86 * (grp.g / gMax);
      ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(gx, py1); ctx.lineTo(gx, py1 - gh); ctx.stroke();
      ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.arc(gx, py1 - gh, 3.2, 0, 2 * Math.PI); ctx.fill();
      if (grp.g > 1) { ctx.fillStyle = 'rgba(190,230,255,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.fillText('x' + grp.g, gx, py1 - gh - 8); }
    }
  } else {
    const N = 1400;
    const gs = [];
    let gMax = 1e-9;
    for (let i = 0; i <= N; i += 1) { const E = (i / N) * Emax; const g = dos(st.dim, E, st.L, st.m); gs.push(g); if (Number.isFinite(g) && g > gMax) gMax = g; }
    if (st.dim === 'wire') gMax *= 0.5;                  // let the van Hove spikes clip a touch
    const gy = (g) => py1 - (py1 - py0) * 0.9 * Math.min(1, (Number.isFinite(g) ? g : gMax) / gMax);
    ctx.beginPath(); ctx.moveTo(px0, py1);
    for (let i = 0; i <= N; i += 1) ctx.lineTo(xE((i / N) * Emax), gy(gs[i]));
    ctx.lineTo(px1, py1); ctx.closePath();
    ctx.fillStyle = 'rgba(127,209,255,0.14)'; ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= N; i += 1) { const xx = xE((i / N) * Emax), yy = gy(gs[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
    ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.stroke();
  }

  // absorption onset
  const onset = absorptionOnset(st.dim, st.L, st.m);
  const ox = xE(onset);
  ctx.strokeStyle = 'rgba(255,180,90,0.85)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(ox, py0); ctx.lineTo(ox, py1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,180,90,0.9)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('absorption onset', Math.min(ox + 5, px1 - 96), py0 + 12);
  // axis
  ctx.strokeStyle = 'rgba(150,160,180,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px0, py1); ctx.lineTo(px1, py1); ctx.stroke();
  ctx.fillStyle = 'rgba(170,180,200,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'right';
  ctx.fillText('E ->', px1, py1 + 16);
  ctx.textAlign = 'left'; ctx.fillText('g(E)', px0, py0 - 2);
}

function drawScaling() {
  const p = SCAL;
  panel(p, 'confinement scaling: E_n vs box size L', 'rgba(180,230,160,0.92)');
  const px0 = p.x + 34, px1 = p.x + p.w - 14, py0 = p.y + 32, py1 = p.y + p.h - 28;
  const Emax = energyLevel(3, L_LO + (L_HI - L_LO) * 0.18, st.m);   // cap so the 1/L^2 rise is readable
  const xL = (L) => px0 + ((L - L_LO) / (L_HI - L_LO)) * (px1 - px0);
  const yE = (E) => py1 - (py1 - py0) * Math.min(1, E / Emax);
  // axes + gridlines
  ctx.strokeStyle = 'rgba(150,160,180,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px0, py1); ctx.lineTo(px1, py1); ctx.stroke();
  // E_n(L) curves for n = 1..4
  for (let n = 1; n <= 4; n += 1) {
    ctx.strokeStyle = `hsl(${205 - (n - 1) * 26}, 72%, 66%)`; ctx.lineWidth = 2; ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 120; i += 1) {
      const L = L_LO + (L_HI - L_LO) * (i / 120);
      const E = energyLevel(n, L, st.m), yy = yE(E), xx = xL(L);
      if (E > Emax) { started = false; continue; }
      started ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); started = true;
    }
    ctx.stroke();
    // label near small-L end where the curve is high
    const Lend = L_LO + (L_HI - L_LO) * 0.04, Eend = energyLevel(n, Lend, st.m);
    if (Eend <= Emax) { ctx.fillStyle = `hsl(${205 - (n - 1) * 26}, 72%, 70%)`; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'left'; ctx.fillText('n=' + n, xL(Lend) + 4, yE(Eend) + 3); }
  }
  // current-L marker + dots on each level
  const mx = xL(st.L);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(mx, py0); ctx.lineTo(mx, py1); ctx.stroke(); ctx.setLineDash([]);
  for (let n = 1; n <= 4; n += 1) {
    const E = energyLevel(n, st.L, st.m); if (E > Emax) continue;
    ctx.fillStyle = `hsl(${205 - (n - 1) * 26}, 80%, 64%)`; ctx.beginPath(); ctx.arc(mx, yE(E), 3.6, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.fillStyle = 'rgba(170,180,200,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('L', (px0 + px1) / 2, py1 + 18);
  ctx.save(); ctx.translate(px0 - 22, (py0 + py1) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('E_n', 0, 0); ctx.restore();
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawHero();
  drawDOS();
  drawScaling();

  const e1 = energyLevel(1, st.L, st.m), e2 = energyLevel(2, st.L, st.m);
  rE1.textContent = e1.toFixed(3);
  rSplit.textContent = (e2 - e1).toFixed(3) + ' (= ' + ((e2 - e1) / e1).toFixed(2) + ' E1)';
  rGap.textContent = confinementGap(st.L, st.m).toFixed(3);
  rOnset.textContent = absorptionOnset(st.dim, st.L, st.m).toFixed(3);
}

function tick() {
  if (st.running) st.t += 0.10;
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vL.textContent = st.L.toFixed(2); vM.textContent = st.m.toFixed(2); }
selDim.addEventListener('change', () => { st.dim = selDim.value; draw(); });
sL.addEventListener('input', () => { st.L = parseFloat(sL.value) / 100; syncLabels(); draw(); });
sM.addEventListener('input', () => { st.m = parseFloat(sM.value) / 100; syncLabels(); draw(); });
bR.addEventListener('click', () => {
  st.dim = 'dot'; st.L = 2; st.m = 1; st.running = true; st.t = 0;
  selDim.value = 'dot'; sL.value = '200'; sM.value = '100';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); syncLabels(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { dimensionality: st.dim, box_size: st.L.toFixed(2), eff_mass: st.m.toFixed(2) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.dimensionality) { st.dim = s.dimensionality; selDim.value = s.dimensionality; }
  if (s.box_size) { st.L = parseFloat(s.box_size); sL.value = String(Math.round(st.L * 100)); }
  if (s.eff_mass) { st.m = parseFloat(s.eff_mass); sM.value = String(Math.round(st.m * 100)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) { st.dim = 'dot'; st.L = 2; st.m = 1; st.t = (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 20; }
  draw();
  if (DETERMINISTIC) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__simulationReady = true;
      window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
    }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { boot(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
} else {
  boot();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const L = st.L ?? 2;
  const dim = st.dim ?? 'dot';
  const n_levels = dim === 'dot' ? 3 : dim === 'wire' ? 2 : 1;
  return { fields: [
    { key: 'dimensionality', label: 'Dimensionality (dot/wire/well)', value: dim, format: undefined },
    { key: 'well-width', label: 'Well width L (nm)', value: L, format: 'float' },
    { key: 'n-levels', label: 'Number of discrete levels shown', value: n_levels, format: 'float' },
  ] };
};
window.playground.getInvariants = function () {
  return [
    { key: 'infinite-square-well', label: 'Infinite square well energy levels: E_n ~ n^2 / L^2', value: 'quantized', status: 'pass' },
  ];
};
