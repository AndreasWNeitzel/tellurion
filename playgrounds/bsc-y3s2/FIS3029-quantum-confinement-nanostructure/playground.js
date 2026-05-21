// Quantum confinement in a nanostructure: the infinite-square-well
// levels in the confined directions and the dimensionality-
// characteristic density of states (E^1/2 bulk, step well, E^-1/2
// wire, delta dot). Physics is the gate-tested closed-form sim.js.
// Canvas2D, deterministic.
import { energyLevel, confinementGap, levels, dos, absorptionOnset } from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

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

const st = { dim: 'dot', L: 2, m: 1, running: !prefersReducedMotion(), phase: 0 };
const LPAN = { x: 30, y: 28, w: W * 0.42 - 40, h: H - 110 };   // well + levels
const RPAN = { x: W * 0.46, y: 28, w: W - W * 0.46 - 24, h: H - 110 }; // DOS

function drawWell() {
  const { x, y, w, h } = LPAN;
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px monospace';
  ctx.fillText('infinite well: levels E_n and wavefunctions psi_n(x) = sin(n pi x / L)', x + 6, y + 14);
  // energy axis: show the first 5 levels and their psi_n
  const Emax = energyLevel(6, st.L, st.m);
  const eY = (E) => y + h - 24 - (h - 60) * (E / Emax);
  // well walls
  const wx0 = x + w * 0.30, wx1 = x + w * 0.78;
  ctx.strokeStyle = 'rgba(150,170,210,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(wx0, y + 28); ctx.lineTo(wx0, y + h - 24); ctx.lineTo(wx1, y + h - 24); ctx.lineTo(wx1, y + 28); ctx.stroke();
  for (let n = 1; n <= 5; n += 1) {
    const E = energyLevel(n, st.L, st.m);
    const yy = eY(E);
    ctx.strokeStyle = `hsla(${200 - n * 22}, 70%, 65%, 0.9)`; ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(wx0, yy); ctx.lineTo(wx1, yy); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i <= 80; i += 1) {
      const xx = i / 80;
      const psi = Math.sin(n * Math.PI * xx) * Math.cos(st.phase * 0.5) * 0.5;
      const px = wx0 + xx * (wx1 - wx0);
      const py = yy - psi * (Math.min(40, (h - 60) / 6));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = 'rgba(220,230,245,0.8)'; ctx.font = '11px monospace';
    ctx.fillText('n=' + n + '  E=' + E.toFixed(2), wx1 + 6, yy + 3);
  }
}

function drawDOS() {
  const { x, y, w, h } = RPAN;
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const label = { bulk: '3D bulk:  g ~ E^1/2', well: '2D well:  g = staircase', wire: '1D wire:  g ~ (E-E_c)^-1/2 (van Hove)', dot: '0D dot:  g = discrete delta peaks' }[st.dim];
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px monospace';
  ctx.fillText('density of states  ' + label, x + 6, y + 14);
  const Emax = Math.max(8, 6 * confinementGap(st.L, st.m) * 4);
  let gMax = 1e-9;
  const N = 360;
  const gs = [];
  for (let i = 0; i <= N; i += 1) {
    const E = (i / N) * Emax;
    const g = dos(st.dim, E, st.L, st.m);
    gs.push(g); if (Number.isFinite(g) && g > gMax) gMax = g;
  }
  gMax *= st.dim === 'wire' || st.dim === 'dot' ? 0.55 : 1.05;
  const gx = (i) => x + 8 + (w - 16) * (i / N);
  const gy = (g) => y + h - 22 - (h - 50) * Math.min(1, (Number.isFinite(g) ? g : gMax) / gMax);
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= N; i += 1) { const xx = gx(i), yy = gy(gs[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  // absorption onset marker
  const onset = absorptionOnset(st.dim, st.L, st.m);
  const ox = x + 8 + (w - 16) * (onset / Emax);
  ctx.strokeStyle = 'rgba(255,180,90,0.8)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(ox, y + 22); ctx.lineTo(ox, y + h - 22); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,180,90,0.85)'; ctx.font = '11px monospace';
  ctx.fillText('absorption onset', Math.min(ox + 4, x + w - 100), y + 34);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('E ->', x + w - 34, y + h - 6);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawWell();
  drawDOS();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px monospace';
  ctx.fillText('change dimensionality: the DOS shape changes qualitatively (E^1/2 / step / spike / delta)', 30, H - 64);

  const e1 = energyLevel(1, st.L, st.m), e2 = energyLevel(2, st.L, st.m);
  rE1.textContent = e1.toFixed(3);
  rSplit.textContent = (e2 - e1).toFixed(3) + ' (= ' + ((e2 - e1) / e1).toFixed(2) + ' E1)';
  rGap.textContent = confinementGap(st.L, st.m).toFixed(3);
  rOnset.textContent = absorptionOnset(st.dim, st.L, st.m).toFixed(3);
}

function tick() {
  if (st.running) st.phase += 0.08;
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vL.textContent = st.L.toFixed(2); vM.textContent = st.m.toFixed(2); }
selDim.addEventListener('change', () => { st.dim = selDim.value; draw(); });
sL.addEventListener('input', () => { st.L = parseFloat(sL.value) / 100; syncLabels(); draw(); });
sM.addEventListener('input', () => { st.m = parseFloat(sM.value) / 100; syncLabels(); draw(); });
bR.addEventListener('click', () => {
  st.dim = 'dot'; st.L = 2; st.m = 1; st.running = true; st.phase = 0;
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
  if (CAPTURE_NAME) { st.dim = 'dot'; st.L = 2; st.m = 1; st.phase = (Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0) * 6; }
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
