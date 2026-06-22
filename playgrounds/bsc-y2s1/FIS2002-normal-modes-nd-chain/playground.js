// Normal modes of a mass-spring chain made physical: the chain of
// masses on springs oscillates in the selected mode while the side
// panel shows the dispersion relation. Monatomic gives one branch
// (omega = 2 sqrt(K/m) |sin(theta/2)|); a diatomic chain with two
// spring constants splits into an acoustic and an optical branch with
// a zone-boundary gap that closes when the springs are equal. Click
// the dispersion panel to pick a mode. Reference: Ashcroft and
// Mermin, Solid State Physics, Ch. 22.

import { monatomicOmega, modeShape, diatomicBranches, bandGap } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['lattice', 'N', 'mode', 'omega', 'gap', 'sim t'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const st = { lattice: 'diatomic', N: 12, mode: 3, Kratio: 2.0, t: 0, running: 1 };
const K1 = 1, m = 1;

// A diatomic N-site chain has N modes: the lower half is the acoustic
// branch, the upper half the optical branch. Map the single mode index
// to its branch and reduced wavenumber.
function modeInfo() {
  if (st.lattice === 'monatomic') return { branch: 'mono', theta: (st.mode * Math.PI) / (st.N + 1) };
  const half = Math.max(1, Math.floor(st.N / 2));
  if (st.mode <= half) return { branch: 'acoustic', theta: (st.mode * Math.PI) / (half + 1) };
  return { branch: 'optical', theta: ((st.mode - half) * Math.PI) / (half + 1) };
}
function modeMax() { return st.lattice === 'monatomic' ? st.N : 2 * Math.max(1, Math.floor(st.N / 2)); }

// geometry
// Portrait stack: chain band on top, dispersion panel full-width below.
const CHX = 40, CHY = 70, CHW = canvas.width - 80, CHH = Math.round(canvas.height * 0.33);          // chain band
const PXX = 40, PXY = CHY + CHH + 56, PXW = canvas.width - 80, PXH = canvas.height - (CHY + CHH + 56) - 46;         // dispersion panel
const LGX = 540, LGW = 300;                              // legend / mode info

function omegaOf() {
  const mi = modeInfo();
  if (mi.branch === 'mono') return monatomicOmega(st.mode, st.N, K1, m);
  const b = diatomicBranches(mi.theta, K1, st.Kratio * K1, m);
  return mi.branch === 'optical' ? b.optical : b.acoustic;
}

// transverse displacement of mass i at time t for the active mode
function disp(i) {
  const mi = modeInfo(), w = omegaOf();
  if (mi.branch === 'mono') {
    return 0.9 * modeShape(st.mode, st.N)[i] * Math.cos(w * st.t);
  }
  const cell = Math.floor((i - 1) / 2), sub = (i - 1) % 2;
  const sign = mi.branch === 'optical' && sub === 1 ? -1 : 1;
  return 0.9 * sign * Math.sin(mi.theta * cell + (sub ? mi.theta / 2 : 0)) * Math.cos(w * st.t);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const N = st.N, dx = CHW / (N + 1), midY = CHY + CHH / 2, amp = CHH * 0.34;

  // chain band
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(CHX, CHY, CHW, CHH);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(CHX, CHY, CHW, CHH);
  ctx.strokeStyle = 'rgba(150,160,180,0.3)'; ctx.beginPath(); ctx.moveTo(CHX, midY); ctx.lineTo(CHX + CHW, midY); ctx.stroke();

  const X = (i) => CHX + i * dx;
  const Y = (i) => midY - disp(i) * amp;
  // springs as zig-zags between consecutive nodes (walls at 0 and N+1)
  ctx.strokeStyle = 'rgba(170,180,200,0.6)'; ctx.lineWidth = 1.4;
  for (let i = 0; i <= N; i += 1) {
    const x0 = X(i), y0 = Y(i), x1 = X(i + 1), y1 = Y(i + 1), seg = 7;
    ctx.beginPath(); ctx.moveTo(x0, y0);
    for (let s = 1; s < seg; s += 1) { const f = s / seg; const zz = (s % 2 ? 1 : -1) * 5; ctx.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f + zz); }
    ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.lineWidth = 1;
  // walls
  ctx.fillStyle = '#3a3f4b'; ctx.fillRect(X(0) - 6, midY - amp - 10, 6, 2 * amp + 20); ctx.fillRect(X(N + 1), midY - amp - 10, 6, 2 * amp + 20);
  // masses
  for (let i = 1; i <= N; i += 1) {
    const diatomic = st.lattice === 'diatomic';
    const big = diatomic && ((i - 1) % 2 === 1);
    ctx.fillStyle = big ? '#7fd6ff' : '#ffcf5d';
    ctx.beginPath(); ctx.arc(X(i), Y(i), big ? 9 : 7, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke();
  }
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`${st.N}-mass ${st.lattice} chain oscillating in the ${modeInfo().branch === 'mono' ? 'n=' + st.mode : modeInfo().branch} mode`, CHX + CHW / 2, CHY + CHH + 20);
  ctx.textAlign = 'left';

  // dispersion panel
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(PXX, PXY, PXW, PXH);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(PXX, PXY, PXW, PXH);
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('dispersion  ω(k)   (click to pick a mode)', PXX + PXW / 2, PXY - 6);
  const wMax = st.lattice === 'monatomic' ? 2 * Math.sqrt(K1 / m) * 1.08 : Math.sqrt(2 * (K1 + st.Kratio * K1) / m) * 1.08;
  const kx = (th) => PXX + 8 + (th / Math.PI) * (PXW - 16);
  const wy = (w) => PXY + PXH - 14 - (w / wMax) * (PXH - 26);
  ctx.strokeStyle = 'rgba(200,205,215,0.25)'; ctx.beginPath(); ctx.moveTo(PXX + 8, wy(0)); ctx.lineTo(PXX + PXW - 8, wy(0)); ctx.stroke();
  if (st.lattice === 'monatomic') {
    ctx.strokeStyle = '#ffcf5d'; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let p = 0; p <= 120; p += 1) { const th = (p / 120) * Math.PI; const w = 2 * Math.sqrt(K1 / m) * Math.abs(Math.sin(th / 2)); const xx = kx(th), yy = wy(w); p === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
    ctx.stroke(); ctx.lineWidth = 1;
  } else {
    const K2 = st.Kratio * K1;
    // shade the gap band
    const gA = diatomicBranches(Math.PI, K1, K2, m).acoustic, gO = diatomicBranches(Math.PI, K1, K2, m).optical;
    ctx.fillStyle = 'rgba(255,120,110,0.12)'; ctx.fillRect(PXX + 8, wy(gO), PXW - 16, wy(gA) - wy(gO));
    for (const [bk, col] of [['acoustic', '#ffcf5d'], ['optical', '#7fd6ff']]) {
      ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
      for (let p = 0; p <= 120; p += 1) { const th = (p / 120) * Math.PI; const w = diatomicBranches(th, K1, K2, m)[bk]; const xx = kx(th), yy = wy(w); p === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
  // selected-mode marker
  ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(kx(modeInfo().theta), wy(omegaOf()), 5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('k a', PXX + PXW / 2, PXY + PXH + 13);
  ctx.save(); ctx.translate(PXX - 7, PXY + PXH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('ω', 0, 0); ctx.restore();
  ctx.textAlign = 'left';

  // legend / info
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono');
  const gap = st.lattice === 'diatomic' ? bandGap(K1, st.Kratio * K1, m) : 0;
  ctx.fillText(st.lattice === 'monatomic' ? 'one acoustic branch' : 'acoustic (yellow) + optical (blue)', LGX, PXY + 16);
  ctx.fillText(st.lattice === 'diatomic' ? `band gap = ${gap.toFixed(3)}` : 'no band gap (monatomic)', LGX, PXY + 38);
  ctx.fillText(st.lattice === 'diatomic' ? 'optical: neighbours out of phase' : 'higher modes: shorter wavelength', LGX, PXY + 60);
  ctx.fillText('click the panel to select a mode', LGX, PXY + 86);

  rEls['lattice'].textContent = st.lattice;
  rEls['N'].textContent = String(st.N);
  rEls['mode'].textContent = modeInfo().branch === 'mono' ? String(st.mode) : `${st.mode} ${modeInfo().branch[0]}`;
  rEls['omega'].textContent = omegaOf().toFixed(4);
  rEls['gap'].textContent = st.lattice === 'diatomic' ? gap.toFixed(3) : '0';
  rEls['sim t'].textContent = st.t.toFixed(2);
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => {
    st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value);
    if (st.mode > modeMax()) st.mode = modeMax();
    st.t = 0; render();
  });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
function buildSelect(label, opts, key, after) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
  sel.value = st[key];
  sel.addEventListener('change', () => { st[key] = sel.value; if (after) after(); st.t = 0; render(); });
  const sp = document.createElement('span'); sp.className = 'value';
  row.appendChild(lab); row.appendChild(sel); row.appendChild(sp);
  controlsEl.appendChild(row); return sel;
}
const lSel = buildSelect('lattice', [['monatomic', 'monatomic'], ['diatomic', 'diatomic (2 springs)']], 'lattice', () => { st.mode = Math.min(st.mode, modeMax()); });
const cN = buildSlider('N masses', 4, 24, 1, st.N, 'N', v => v.toFixed(0));
const cM = buildSlider('mode n', 1, 24, 1, st.mode, 'mode', v => v.toFixed(0));
const cK = buildSlider('spring ratio K2/K1', 1, 5, 0.1, st.Kratio, 'Kratio', v => v.toFixed(1));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { lattice: 'diatomic', N: 12, mode: 3, Kratio: 2.0, t: 0, running: 1 });
  lSel.value = 'diatomic'; cN.inp.value = '12'; cN.val.textContent = '12'; cM.inp.value = '3'; cM.val.textContent = '3'; cK.inp.value = '2'; cK.val.textContent = '2.0';
  bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

// click the dispersion panel to select the nearest mode
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const cxp = (e.clientX - r.left) * canvas.width / r.width, cyp = (e.clientY - r.top) * canvas.height / r.height;
  if (cxp < PXX || cxp > PXX + PXW || cyp < PXY || cyp > PXY + PXH) return;
  const frac = Math.max(0, Math.min(1, (cxp - PXX - 8) / (PXW - 16)));
  if (st.lattice === 'monatomic') {
    st.mode = Math.max(1, Math.min(st.N, Math.round(frac * st.N)));
  } else {
    const half = Math.max(1, Math.floor(st.N / 2));
    const idx = Math.max(1, Math.min(half, Math.round(frac * half)));
    const wMaxL = Math.sqrt(2 * (K1 + st.Kratio * K1) / m) * 1.08;
    const wClick = (1 - (cyp - PXY - 14) / (PXH - 26)) * wMaxL;
    const th = (idx / (half + 1)) * Math.PI;
    const bb = diatomicBranches(th, K1, st.Kratio * K1, m);
    const optical = Math.abs(wClick - bb.optical) < Math.abs(wClick - bb.acoustic);
    st.mode = optical ? half + idx : idx;
  }
  cM.inp.value = String(st.mode); cM.val.textContent = String(st.mode);
  st.t = 0; render();
});

let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) st.t += dr * 1.6;
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * (2 * Math.PI / Math.max(0.05, omegaOf())) : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const N = 12, K = 1, mm = 1;
  for (let n = 1; n <= N; n += 1) {
    const exact = 2 * Math.sqrt(K / mm) * Math.sin((n * Math.PI) / (2 * (N + 1)));
    if (Math.abs(monatomicOmega(n, N, K, mm) - exact) > 1e-9) return { name: 'monatomic omega_n', pass: false, msg: `mode ${n}` };
  }
  if (bandGap(1, 1, mm) > 1e-9) return { name: 'gap closes at K1=K2', pass: false, msg: `gap=${bandGap(1, 1, mm)}` };
  return { name: 'omega_n formula + gap closes at K1=K2', pass: true, msg: 'N modes exact; monatomic limit gap 0' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  const omega = omegaOf();
  const omega0 = 2 * Math.sqrt(K1 / m);
  return { fields: [
    { key: "mode-n", label: "mode n", value: st.mode, format: "float" },
    { key: "omega", label: "omega / omega_0", value: (omega / omega0).toFixed(3), format: "float" }
  ] };
};
window.playground.getInvariants = function () {
  const omega = omegaOf();
  const omega0 = 2 * Math.sqrt(K1 / m);
  const gap = st.lattice === 'diatomic' ? bandGap(K1, st.Kratio * K1, m) : 0;
  const omegaMax = st.lattice === 'monatomic' ? omega0 : Math.sqrt(2 * (K1 + st.Kratio * K1) / m);

  return [
    {
      key: 'omega-below-ceiling',
      label: `omega ${(omega / omega0).toFixed(3)} omega_0`,
      value: (omega / omega0).toFixed(3),
      status: (omega < omegaMax * 1.01) ? 'pass' : 'drift'
    },
    {
      key: 'band-gap-monatomic',
      label: st.lattice === 'monatomic' ? 'no band gap' : `gap ${gap.toFixed(3)}`,
      value: gap.toFixed(3),
      status: st.lattice === 'monatomic' ? (gap < 1e-9 ? 'pass' : 'drift') : (gap > 0 ? 'pass' : 'drift')
    },
    {
      key: 'chain-bounded',
      label: `${st.N} masses, mode ${st.mode}`,
      value: st.mode <= modeMax() ? 'ok' : 'overflow',
      status: st.mode <= modeMax() ? 'pass' : 'drift'
    }
  ];
};
