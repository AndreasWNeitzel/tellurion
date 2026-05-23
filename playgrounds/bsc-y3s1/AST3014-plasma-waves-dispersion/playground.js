// Plasma-wave dispersion: the omega-k diagram of the cold/warm fluid
// modes (Langmuir, ion-acoustic, O-mode, X-mode, Alfven), with the
// light line, the omega = omega_p reference, and the X-mode cutoffs
// and upper-hybrid resonance marked. A marker sweeps the branch
// showing the phase and group speed, and a small inset shows a wave
// at the marked (k, omega) travelling at the phase speed. Physics is
// the gate-tested sim.js (closed form, deterministic).
import {
  sample, oModeSpeeds, upperHybrid, xCutoffs, plasmaFrequency,
} from './sim.js';
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
const rWp = document.getElementById('readout-wp');
const rCut = document.getElementById('readout-cut');
const rVph = document.getElementById('readout-vph');
const rVgr = document.getElementById('readout-vgr');
const selMode = document.getElementById('select-mode');
const sNe = document.getElementById('slider-ne'), vNe = document.getElementById('value-ne');
const sWc = document.getElementById('slider-wc'), vWc = document.getElementById('value-wc');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const st = { mode: 'omode', wpRel: 1.0, wc: 0.6, running: !prefersReducedMotion(), phase: 0 };
const C = 20;                                        // light speed in plot units (omega_p = 1)
const params = () => ({ wp: st.wpRel, c: C, vth: 0.05, cs: 0.02, lambdaD: 0.3, vA: 0.3, wc: st.wc });

// log-log plot box
const PX0 = 64, PX1 = W - 24, PY0 = 28, PY1 = H - 116;
const KLO = 1e-3, KHI = 40, WLO = 1e-2, WHI = 80;
const lx = (k) => PX0 + (Math.log10(Math.max(KLO, k)) - Math.log10(KLO)) / (Math.log10(KHI) - Math.log10(KLO)) * (PX1 - PX0);
const ly = (w) => PY1 - (Math.log10(Math.max(WLO, w)) - Math.log10(WLO)) / (Math.log10(WHI) - Math.log10(WLO)) * (PY1 - PY0);

function grid() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(120,135,165,0.18)'; ctx.lineWidth = 1; ctx.fillStyle = 'rgba(170,180,205,0.5)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.textAlign = 'center';
  for (let e = -3; e <= 2; e += 1) { const x = lx(10 ** e); ctx.beginPath(); ctx.moveTo(x, PY0); ctx.lineTo(x, PY1); ctx.stroke(); ctx.fillText('1e' + e, Math.max(PX0 + 8, Math.min(PX1 - 8, x)), PY1 + 14); }
  ctx.textAlign = 'right';
  for (let e = -2; e <= 1; e += 1) { const y = ly(10 ** e); ctx.beginPath(); ctx.moveTo(PX0, y); ctx.lineTo(PX1, y); ctx.stroke(); ctx.fillText('1e' + e, PX0 - 6, y + 3); }
  ctx.fillStyle = 'rgba(200,210,230,0.7)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('k  (omega_p / c units)', (PX0 + PX1) / 2 - 60, H - 64);
  ctx.save(); ctx.translate(16, (PY0 + PY1) / 2 + 30); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'left'; ctx.fillText('ω / omega_p', 0, 0); ctx.restore();
  // light line omega = c k
  ctx.strokeStyle = 'rgba(120,200,255,0.4)'; ctx.setLineDash([4, 4]); ctx.beginPath();
  ctx.moveTo(lx(WLO / C), ly(WLO)); ctx.lineTo(lx(WHI / C), ly(WHI)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(120,200,255,0.6)'; ctx.fillText('ω = c k', lx(WHI / C) - 70, ly(WHI) + 14);
  // omega_p reference
  ctx.strokeStyle = 'rgba(255,210,120,0.45)'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(PX0, ly(st.wpRel)); ctx.lineTo(PX1, ly(st.wpRel)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,210,120,0.7)'; ctx.fillText('omega_p', PX1 - 56, ly(st.wpRel) - 4);
}

function drawXmarks() {
  const { wL, wR } = xCutoffs(st.wpRel, st.wc);
  const wUH = upperHybrid(st.wpRel, st.wc);
  for (const [val, lab, col] of [[wL, 'wL', '#9fd'], [wR, 'wR', '#9fd'], [wUH, 'wUH (resonance)', '#f9a']]) {
    ctx.strokeStyle = col === '#f9a' ? 'rgba(255,150,170,0.5)' : 'rgba(150,255,210,0.4)';
    ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(PX0, ly(val)); ctx.lineTo(PX1, ly(val)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.fillText(lab, PX0 + 4, ly(val) - 3);
  }
}

function draw() {
  grid();
  if (st.mode === 'xmode') drawXmarks();
  const pts = sample(st.mode, params(), 260);
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2.2; ctx.beginPath();
  let started = false;
  for (const { k, w } of pts) {
    if (k <= 0 || !Number.isFinite(w)) { started = false; continue; }
    const X = lx(k), Y = ly(w);
    if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  // sweeping marker
  let mk = null;
  if (pts.length > 2) {
    const idx = Math.floor((0.15 + 0.7 * (0.5 + 0.5 * Math.sin(st.phase))) * (pts.length - 1));
    mk = pts[Math.max(1, Math.min(pts.length - 1, idx))];
    const X = lx(mk.k), Y = ly(mk.w);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X, Y, 5, 0, 2 * Math.PI); ctx.fill();
  }
  // travelling-wave inset (phase speed at the marker)
  if (mk) {
    const iy = H - 40, ix0 = PX0, iw = PX1 - PX0;
    ctx.strokeStyle = 'rgba(160,200,255,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let i = 0; i <= 160; i += 1) {
      const xx = i / 160, ph = 2 * Math.PI * 4 * xx - st.phase * 3;
      const yy = iy + Math.sin(ph) * 11;
      if (i === 0) ctx.moveTo(ix0 + xx * iw, yy); else ctx.lineTo(ix0 + xx * iw, yy);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(180,200,230,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    ctx.fillText('wave at (k, ω), travelling at phase speed', ix0, iy + 24);

    const vph = mk.w / mk.k;
    let vgr = vph;
    const i2 = pts.indexOf(mk);
    if (i2 > 0 && i2 < pts.length - 1) {
      const a = pts[i2 - 1], b = pts[i2 + 1];
      if (b.k !== a.k) vgr = (b.w - a.w) / (b.k - a.k);
    }
    rVph.textContent = vph.toFixed(3);
    rVgr.textContent = vgr.toFixed(3);
  }
  rWp.textContent = st.wpRel.toFixed(3);
  if (st.mode === 'xmode') {
    const { wL, wR } = xCutoffs(st.wpRel, st.wc);
    rCut.textContent = 'wL ' + wL.toFixed(2) + ' wR ' + wR.toFixed(2);
  } else if (st.mode === 'omode' || st.mode === 'langmuir') {
    rCut.textContent = 'cutoff w=wp';
  } else {
    rCut.textContent = 'no cutoff';
  }
}

function tick() {
  if (st.running) st.phase += 0.03;
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vNe.textContent = st.wpRel.toFixed(2); vWc.textContent = st.wc.toFixed(2); }
selMode.addEventListener('change', () => { st.mode = selMode.value; draw(); });
sNe.addEventListener('input', () => { st.wpRel = parseFloat(sNe.value) / 100; syncLabels(); draw(); });
sWc.addEventListener('input', () => { st.wc = parseFloat(sWc.value) / 100; syncLabels(); draw(); });
bR.addEventListener('click', () => {
  st.mode = 'omode'; st.wpRel = 1; st.wc = 0.6; st.running = true; st.phase = 0;
  selMode.value = 'omode'; sNe.value = '100'; sWc.value = '60';
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); syncLabels(); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { wave_mode: st.mode, wp_rel: st.wpRel.toFixed(2), wc_rel: st.wc.toFixed(2) }; }
function restoreState() {
  const q = parseUrlState();
  if (!q) return;
  if (q.wave_mode) { st.mode = q.wave_mode; selMode.value = q.wave_mode; }
  if (q.wp_rel) { st.wpRel = parseFloat(q.wp_rel); sNe.value = String(Math.round(st.wpRel * 100)); }
  if (q.wc_rel) { st.wc = parseFloat(q.wc_rel); sWc.value = String(Math.round(st.wc * 100)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    st.mode = 'omode'; st.wpRel = 1; st.wc = 0.6;
    const f = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    st.phase = f * 6;
    draw();
  } else {
    draw();
  }
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
  const pts = sample(st.mode, params(), 3);
  const vph = pts.length > 0 && pts[0].k > 0 ? pts[0].w / pts[0].k : 0;
  return {
    fields: [
      { key: 'wave-mode', label: 'Wave mode', value: st.mode, format: undefined },
      { key: 'omega-p', label: 'Plasma freq wp', value: st.wpRel, format: 'float' },
      { key: 'cyc-freq', label: 'Cyclotron freq wc', value: st.wc, format: 'float' },
      { key: 'phase-speed', label: 'Phase speed vph', value: vph.toFixed(3), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  const pts = sample(st.mode, params(), 100);
  let allFinite = true;
  for (const pt of pts) {
    if (!Number.isFinite(pt.w) || !Number.isFinite(pt.k)) {
      allFinite = false;
      break;
    }
  }
  return [
    {
      key: 'dispersion-well-defined',
      label: 'Dispersion relation values finite',
      value: allFinite ? 'pass' : 'drift',
      status: allFinite ? 'pass' : 'drift',
    },
  ];
};
