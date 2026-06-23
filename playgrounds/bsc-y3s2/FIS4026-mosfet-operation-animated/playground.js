// n-channel enhancement MOSFET, square-law model. Panel A: the
// I_D-V_DS output characteristics for a family of V_GS, with the
// pinch-off locus V_DS = V_GS - V_th separating triode and
// saturation and the operating point swept in V_DS. Panel B: the
// device cross-section with the inversion channel tapering and
// pinching off at the drain. Panel C: the I_D-V_GS transfer curve
// with the threshold marked. Gate-tested sim.js; deterministic.
// Neamen 2012, Ch. 10-11; Shichman and Hodges 1968.
import {
  drainCurrent, saturationCurrent, region, channelThickness,
  outputCurve, transferCurve,
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
const rVgs = document.getElementById('readout-vgs');
const rVds = document.getElementById('readout-vds');
const rId = document.getElementById('readout-id');
const rReg = document.getElementById('readout-region');
const sG = document.getElementById('slider-vgs'), vG = document.getElementById('value-vgs');
const sT = document.getElementById('slider-vth'), vT = document.getElementById('value-vth');
const sL = document.getElementById('slider-lam'), vL = document.getElementById('value-lam');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const KN = 1e-3;                                        // transconductance (A/V^2)
const VDS_MAX = 6, VGS_MAX = 5;
const DEF_VGS = 3, DEF_VTH = 1, DEF_LAM = 0;
const st = { vgs: DEF_VGS, vth: DEF_VTH, lambda: DEF_LAM, running: !prefersReducedMotion(), vds: 0 };
const opts = () => ({ vth: st.vth, kn: KN, lambda: st.lambda });

function family() {
  const ovs = [0.5, 1, 1.5, 2, 2.5];
  return ovs.map((o) => st.vth + o).filter((v) => v <= VGS_MAX + 1e-9);
}
function iMax() {
  let m = 1e-9;
  for (const vg of family()) m = Math.max(m, drainCurrent(vg, VDS_MAX, opts()));
  return Math.max(m, drainCurrent(st.vgs, VDS_MAX, opts()));
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(title, x + 8, y + 14);
}

function drawOutput(x, y, w, h) {
  panel(x, y, w, h, 'output characteristics I_D vs V_DS: triode | pinch-off | saturation');
  const x0 = x + 44, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const Im = iMax();
  const X = (v) => x0 + (x1 - x0) * v / VDS_MAX;
  const Y = (i) => y1 - (y1 - y0) * i / Im;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
  for (let f = 0; f <= 1.0001; f += 0.25) { ctx.beginPath(); ctx.moveTo(x0, Y(f * Im)); ctx.lineTo(x1, Y(f * Im)); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText(`${(Im * 1e3).toFixed(1)} mA`, x + 6, Y(Im) + 8); ctx.fillText('0', x + 6, Y(0));
  // pinch-off locus I_D = (kn/2) V_DS^2 (V_DS = V_ov along it)
  ctx.strokeStyle = 'rgba(241,192,105,0.55)'; ctx.setLineDash([4, 3]); ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) { const v = VDS_MAX * i / 120; const xx = X(v), yy = Y(0.5 * KN * v * v); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(241,192,105,0.85)'; ctx.fillText('pinch-off locus V_DS = V_GS - V_th', x0 + 8, y0 + 12);
  for (const vg of family()) {
    const cur = Math.abs(vg - st.vgs) < 1e-6;
    const c = cur ? '#7fd1ff' : 'rgba(140,165,205,0.55)';
    const oc = outputCurve(vg, VDS_MAX, 200, opts());
    ctx.strokeStyle = c; ctx.lineWidth = cur ? 2.4 : 1.2; ctx.beginPath();
    for (let i = 0; i <= 200; i += 1) { const xx = X(oc.vds[i]), yy = Y(oc.id[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
    ctx.stroke();
    ctx.fillStyle = c; ctx.fillText(`V_GS=${vg.toFixed(1)}`, X(VDS_MAX) - 56, Y(drainCurrent(vg, VDS_MAX, opts())) - 4);
  }
  const id = drainCurrent(st.vgs, st.vds, opts());
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.moveTo(X(st.vds), y0); ctx.lineTo(X(st.vds), y1); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(X(st.vds), Y(id), 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('V_DS (V) ->', x1 - 70, y1 + 14);
}

function drawDevice(x, y, w, h) {
  panel(x, y, w, h, 'cross-section: gate, oxide, inversion channel');
  const dx0 = x + 24, dx1 = x + w - 16, top = y + 34, bot = y + h - 26;
  const midH = bot - top;
  ctx.fillStyle = '#221a2e'; ctx.fillRect(dx0, top, dx1 - dx0, midH);          // p-substrate
  ctx.fillStyle = 'rgba(210,220,240,0.6)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('p-substrate (body)', dx0 + 8, bot - 8);
  const sW = (dx1 - dx0) * 0.16;
  ctx.fillStyle = '#2f6ad6';
  ctx.fillRect(dx0, top, sW, midH * 0.5);                                       // n+ source
  ctx.fillRect(dx1 - sW, top, sW, midH * 0.5);                                  // n+ drain
  ctx.fillStyle = 'rgba(220,230,250,0.85)';
  ctx.fillText('n+ S', dx0 + 6, top + 14); ctx.fillText('n+ D', dx1 - sW + 6, top + 14);
  // gate oxide + metal above the channel region
  const gx0 = dx0 + sW, gx1 = dx1 - sW;
  ctx.fillStyle = '#3a3340'; ctx.fillRect(gx0, top - 8, gx1 - gx0, 6);          // oxide
  ctx.fillStyle = '#8f8aa0'; ctx.fillRect(gx0, top - 20, gx1 - gx0, 10);        // gate metal
  ctx.fillStyle = 'rgba(220,230,250,0.85)'; ctx.fillText('gate', (gx0 + gx1) / 2 - 12, top - 23);
  // inversion channel: thickness profile along x
  const chMax = midH * 0.34;
  ctx.fillStyle = 'rgba(127,209,255,0.85)';
  ctx.beginPath(); ctx.moveTo(gx0, top);
  const Npx = 80;
  for (let i = 0; i <= Npx; i += 1) {
    const xf = i / Npx;
    const th = channelThickness(xf, st.vgs, st.vds, opts());
    ctx.lineTo(gx0 + (gx1 - gx0) * xf, top + chMax * th);
  }
  ctx.lineTo(gx1, top); ctx.closePath(); ctx.fill();
  const reg = region(st.vgs, st.vds, st.vth);
  ctx.fillStyle = 'rgba(127,209,255,0.95)';
  ctx.fillText(reg === 'cutoff' ? 'no channel (cutoff)'
    : reg === 'triode' ? 'continuous channel (triode)'
      : 'pinched off at drain (saturation)', gx0 + 4, top + chMax + 16);
}

function drawTransfer(x, y, w, h) {
  panel(x, y, w, h, 'transfer characteristic: I_D vs V_GS');
  const x0 = x + 40, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const tc = transferCurve(Math.max(st.vds, 0.05), VGS_MAX, 240, opts());
  let Im = 1e-9; for (let i = 0; i <= 240; i += 1) Im = Math.max(Im, tc.id[i]);
  const X = (v) => x0 + (x1 - x0) * v / VGS_MAX;
  const Y = (i) => y1 - (y1 - y0) * i / Im;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(X(st.vth), y0); ctx.lineTo(X(st.vth), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(241,192,105,0.85)'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('V_th', X(st.vth) + 3, y0 + 12);
  ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) { const xx = X(tc.vgs[i]), yy = Y(tc.id[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(st.vgs), Y(drainCurrent(st.vgs, Math.max(st.vds, 0.05), opts())), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('V_GS (V) ->', x1 - 70, y1 + 14);
  ctx.fillText('I_D', x + 6, y0 + 2);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawOutput(20, 22, W - 40, 232);
  drawDevice(20, 270, (W - 52) / 2, H - 270 - 16);
  drawTransfer(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  const id = drainCurrent(st.vgs, st.vds, opts());
  rVgs.textContent = st.vgs.toFixed(2);
  rVds.textContent = st.vds.toFixed(2);
  rId.textContent = `${(id * 1e3).toFixed(3)} mA`;
  rReg.textContent = region(st.vgs, st.vds, st.vth);
}

const LIVE_FRAC = 1 / 360;
function tick() {
  if (st.running) {
    st.vds = Math.min(VDS_MAX, st.vds + LIVE_FRAC * VDS_MAX);
    if (st.vds >= VDS_MAX - 1e-9) { st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); }
  }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vG.textContent = st.vgs.toFixed(2); vT.textContent = st.vth.toFixed(2); vL.textContent = st.lambda.toFixed(3); }
function restart() { st.vds = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
sG.addEventListener('input', () => { st.vgs = parseFloat(sG.value) / 100; syncLabels(); draw(); });
sT.addEventListener('input', () => { st.vth = parseFloat(sT.value) / 100; syncLabels(); draw(); });
sL.addEventListener('input', () => { st.lambda = parseFloat(sL.value) / 1000; syncLabels(); draw(); });
bR.addEventListener('click', () => {
  st.vgs = DEF_VGS; st.vth = DEF_VTH; st.lambda = DEF_LAM;
  sG.value = String(DEF_VGS * 100); sT.value = String(DEF_VTH * 100); sL.value = String(DEF_LAM * 1000);
  syncLabels(); restart(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.vds >= VDS_MAX - 1e-9) restart();
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { vgs: st.vgs.toFixed(2), vth: st.vth.toFixed(2), lam: st.lambda.toFixed(3) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.vgs) { st.vgs = parseFloat(s.vgs); sG.value = String(Math.round(st.vgs * 100)); }
  if (s.vth) { st.vth = parseFloat(s.vth); sT.value = String(Math.round(st.vth * 100)); }
  if (s.lam) { st.lambda = parseFloat(s.lam); sL.value = String(Math.round(st.lambda * 1000)); }
}

function boot() {
  restoreState(); syncLabels();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.vds = f * VDS_MAX;
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
  const id = drainCurrent(st.vgs, st.vds, opts());
  const reg = region(st.vgs, st.vds, st.vth);
  return {
    fields: [
      { key: 'gate-voltage', label: 'V_GS (V)', value: st.vgs, format: 'float' },
      { key: 'drain-voltage', label: 'V_DS (V)', value: st.vds, format: 'float' },
      { key: 'threshold', label: 'V_th (V)', value: st.vth, format: 'float' },
      { key: 'drain-current', label: 'I_D (mA)', value: id * 1000, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  const id = drainCurrent(st.vgs, st.vds, opts());
  const reg = region(st.vgs, st.vds, st.vth);
  const vov = st.vgs - st.vth;
  const shouldBeCutoff = vov <= 0;
  const isCutoff = id < 1e-6;
  const shouldBeActive = vov > 0;
  return [
    {
      key: 'current-nonnegativity',
      label: 'Drain current >= 0',
      value: id >= 0 ? 'pass' : 'fail',
      status: id >= 0 ? 'pass' : 'drift'
    },
    {
      key: 'cutoff-consistency',
      label: 'V_GS < V_th implies minimal current',
      value: !shouldBeCutoff || isCutoff ? 'pass' : 'drift',
      status: !shouldBeCutoff || isCutoff ? 'pass' : 'drift'
    }
  ];
};
