// Single-diode solar cell with the Shockley-Queisser detailed-balance
// limit. Panel A: the I-V and P-V curves with I_sc, V_oc, the
// maximum-power point and the fill-factor rectangle; a load point
// sweeps from short circuit to open circuit. Panel B: photons above
// the gap raining onto the cell, generating electron-hole pairs and
// the photocurrent. Panel C: the Shockley-Queisser efficiency vs
// bandgap. Gate-tested sim.js; deterministic. Shockley 1949;
// Shockley and Queisser 1961; Green 1981; Wurfel 2009.
import {
  cellCurrent, shortCircuitCurrent, openCircuitVoltage, maxPowerPoint,
  fillFactor, sqLimit, ivCurve, sqCurve, VT,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rV = document.getElementById('readout-v');
const rVoc = document.getElementById('readout-voc');
const rFF = document.getElementById('readout-ff');
const rEta = document.getElementById('readout-eta');
const selS = document.getElementById('select-spec');
const sEg = document.getElementById('slider-eg'), vEg = document.getElementById('value-eg');
const sSun = document.getElementById('slider-suns'), vSun = document.getElementById('value-suns');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

const DEF_EG = 1.34, DEF_SUN = 1, DEF_PIN = 1000;
const st = { Eg: DEF_EG, suns: DEF_SUN, Pin: DEF_PIN, running: true, ph: 0, p: null, voc: 1, mpp: null, iv: null, sq: null };

function rebuild() {
  const r = sqLimit(st.Eg, { Pin: st.Pin });
  // Panel A is a realistic single-diode cell: a typical ~0.4 V deficit
  // below the gap from non-radiative recombination, so the I-V knee
  // and the maximum-power point are clearly visible. Panel C keeps the
  // true radiative detailed-balance Shockley-Queisser limit.
  const iL = r.Jsc * st.suns;
  const VocTarget = Math.max(0.25, st.Eg - 0.45) + VT * Math.log(Math.max(1, st.suns));
  const i0 = iL / (Math.exp(VocTarget / VT) - 1);
  st.p = { iL, i0, n: 1 };
  st.voc = openCircuitVoltage(st.p);
  st.mpp = maxPowerPoint(st.p);
  st.iv = ivCurve(240, st.p);
  st.sq = sqCurve(160, 0.4, 3.2, { Pin: st.Pin });
  st.etaCell = st.mpp.Pmp / (st.Pin * st.suns);          // realistic cell efficiency
  st.etaSQ = r.eta;                                      // detailed-balance limit at this gap
  st.ph = 0; st.running = true;
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false');
}

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function drawIV(x, y, w, h) {
  panel(x, y, w, h, 'I-V [cyan] and power P-V [amber]: I_sc, V_oc, max-power point');
  const x0 = x + 44, x1 = x + w - 14, y0 = y + 26, y1 = y + h - 24;
  const isc = shortCircuitCurrent(st.p);
  const vmax = st.voc * 1.05;
  let pmax = 1e-9; for (let i = 0; i < st.iv.P.length; i += 1) pmax = Math.max(pmax, st.iv.P[i]);
  const X = (v) => x0 + (x1 - x0) * v / vmax;
  const Yi = (i) => y1 - (y1 - y0) * i / isc;
  const Yp = (pp) => y1 - (y1 - y0) * pp / pmax;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
  for (const fr of [0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(x0, Yi(fr * isc)); ctx.lineTo(x1, Yi(fr * isc)); ctx.stroke(); }
  ctx.setLineDash([]);
  // fill-factor rectangle (V_mp x I_mp inside V_oc x I_sc)
  const { Vmp, Imp } = st.mpp;
  ctx.fillStyle = 'rgba(241,192,105,0.10)';
  ctx.fillRect(X(0), Yi(Imp), X(Vmp) - X(0), Yi(0) - Yi(Imp));
  ctx.strokeStyle = 'rgba(241,192,105,0.45)'; ctx.strokeRect(X(0), Yi(Imp), X(Vmp) - X(0), Yi(0) - Yi(Imp));
  // I-V and P-V
  ctx.strokeStyle = '#7fd1ff'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < st.iv.V.length; i += 1) { const xx = X(st.iv.V[i]), yy = Yi(st.iv.I[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.strokeStyle = '#f1c069'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < st.iv.V.length; i += 1) { const xx = X(st.iv.V[i]), yy = Yp(st.iv.P[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  // markers
  ctx.fillStyle = 'rgba(127,209,255,0.9)'; ctx.font = '10px monospace';
  ctx.fillText('I_sc', x + 8, Yi(isc) + 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(X(st.voc), y0); ctx.lineTo(X(st.voc), y1); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.fillText('V_oc', X(st.voc) - 26, y0 + 12);
  ctx.fillStyle = '#8fe39b';
  ctx.beginPath(); ctx.arc(X(Vmp), Yi(Imp), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillText('MPP', X(Vmp) - 10, Yi(Imp) - 8);
  // load operating point swept along V
  const Vop = st.ph * st.voc;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.moveTo(X(Vop), y0); ctx.lineTo(X(Vop), y1); ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(Vop), Yi(Math.max(0, cellCurrent(Vop, st.p))), 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,215,240,0.6)'; ctx.fillText('load voltage V ->', x0 + 6, y1 + 14);
}

function drawGeneration(x, y, w, h) {
  panel(x, y, w, h, 'photon rain above the gap and electron-hole generation');
  const cellTop = y + h - 46, cx0 = x + 16, cx1 = x + w - 16;
  ctx.fillStyle = '#1d2740'; ctx.fillRect(cx0, cellTop, cx1 - cx0, 34);          // the cell
  ctx.fillStyle = 'rgba(220,230,250,0.8)'; ctx.font = '10px monospace';
  ctx.fillText(`E_g = ${st.Eg.toFixed(2)} eV`, cx0 + 6, cellTop + 21);
  // deterministic photon rain: a fixed set of streams falling onto
  // the cell, phase advanced by the sweep. Photons above the gap
  // (amber) are absorbed and make an electron-hole pair; below-gap
  // photons (grey) pass through.
  const nPh = 40 + Math.round(30 * Math.min(1, st.suns / 20));
  const span = cx1 - cx0 - 24;
  for (let k = 0; k < nPh; k += 1) {
    const fx = cx0 + 12 + ((k * 97) % span);
    const fall = ((k * 0.0917 + st.ph * 2.3) % 1);
    const fy = y + 22 + fall * (cellTop - y - 24);
    const above = ((k * 7) % 10) >= 3;                                           // ~70% above-gap
    ctx.strokeStyle = above ? 'rgba(255,205,110,0.85)' : 'rgba(120,140,175,0.45)';
    ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(fx, fy - 9); ctx.lineTo(fx, fy); ctx.stroke();
    if (above && fall > 0.92) {                                                   // just absorbed
      ctx.fillStyle = 'rgba(255,235,170,0.9)'; ctx.beginPath(); ctx.arc(fx, cellTop + 4, 5, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#7fd1ff'; ctx.beginPath(); ctx.arc(fx - 6, cellTop - 7, 3, 0, 2 * Math.PI); ctx.fill();   // electron
      ctx.fillStyle = '#ff8f8f'; ctx.beginPath(); ctx.arc(fx + 6, cellTop + 14, 3, 0, 2 * Math.PI); ctx.fill();  // hole
    }
  }
  ctx.fillStyle = 'rgba(255,205,110,0.85)'; ctx.font = '10px monospace';
  ctx.fillText('photons (amber: hv > E_g, absorbed)', cx0 + 6, y + 30);
  // photocurrent arrows out to the load (magnitude tracks I(V))
  const Iop = Math.max(0, cellCurrent(st.ph * st.voc, st.p));
  const frac = Iop / Math.max(1e-9, shortCircuitCurrent(st.p));
  ctx.strokeStyle = `rgba(143,227,155,${0.3 + 0.6 * frac})`; ctx.lineWidth = 2 + 3 * frac;
  ctx.beginPath(); ctx.moveTo(cx1, cellTop + 17); ctx.lineTo(cx1 + 8, cellTop + 17); ctx.stroke();
  ctx.fillStyle = 'rgba(143,227,155,0.9)';
  ctx.fillText(`photocurrent I = ${(frac * 100).toFixed(0)}% of I_sc`, cx0 + 6, y + h - 6);
}

function drawSQ(x, y, w, h) {
  panel(x, y, w, h, 'Shockley-Queisser detailed-balance limit: eta vs bandgap');
  const x0 = x + 36, x1 = x + w - 14, y0 = y + 28, y1 = y + h - 24;
  const eMin = st.sq.Eg[0], eMax = st.sq.Eg[st.sq.Eg.length - 1];
  let ym = 1e-6; for (let i = 0; i < st.sq.eta.length; i += 1) ym = Math.max(ym, st.sq.eta[i]);
  const X = (e) => x0 + (x1 - x0) * (e - eMin) / (eMax - eMin);
  const Y = (v) => y1 - (y1 - y0) * v / (ym * 1.1);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(x0, Y(ym)); ctx.lineTo(x1, Y(ym)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '10px monospace';
  ctx.fillText(`${(ym * 100).toFixed(0)}%`, x + 6, Y(ym) + 3);
  ctx.strokeStyle = '#8fe39b'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < st.sq.Eg.length; i += 1) { const xx = X(st.sq.Eg[i]), yy = Y(st.sq.eta[i]); i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(X(st.Eg), Y(st.etaSQ), 4.5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(255,209,102,0.9)'; ctx.fillText(`limit ${(st.etaSQ * 100).toFixed(1)}%`, X(st.Eg) + 6, Y(st.etaSQ) - 6);
  ctx.fillStyle = '#8fe39b';
  ctx.beginPath(); ctx.arc(X(st.Eg), Y(st.etaCell), 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(143,227,155,0.9)'; ctx.fillText(`cell ${(st.etaCell * 100).toFixed(1)}%`, X(st.Eg) + 6, Y(st.etaCell) + 14);
  ctx.fillStyle = 'rgba(200,215,240,0.65)'; ctx.fillText('E_g (eV) ->', x1 - 70, y1 + 14);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawIV(20, 22, W - 40, 232);
  drawGeneration(20, 270, (W - 52) / 2, H - 270 - 16);
  drawSQ(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  rV.textContent = (st.ph * st.voc).toFixed(3);
  rVoc.textContent = st.voc.toFixed(3);
  rFF.textContent = fillFactor(st.p).toFixed(3);
  rEta.textContent = `${(st.etaCell * 100).toFixed(1)}% (lim ${(st.etaSQ * 100).toFixed(0)}%)`;
}

const LIVE_FRAC = 1 / 360;
function tick() {
  if (st.running) {
    st.ph = Math.min(1, st.ph + LIVE_FRAC);
    if (st.ph >= 1) { st.running = false; bP.textContent = 'Play'; bP.setAttribute('aria-pressed', 'true'); }
  }
  draw();
  requestAnimationFrame(tick);
}

function syncLabels() { vEg.textContent = st.Eg.toFixed(2); vSun.textContent = String(st.suns); }
function restart() { st.ph = 0; st.running = true; bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); }
selS.addEventListener('change', () => { st.Pin = parseFloat(selS.value); rebuild(); draw(); });
sEg.addEventListener('input', () => { st.Eg = parseFloat(sEg.value) / 100; syncLabels(); rebuild(); draw(); });
sSun.addEventListener('input', () => { st.suns = parseInt(sSun.value, 10); syncLabels(); rebuild(); draw(); });
bR.addEventListener('click', () => {
  st.Eg = DEF_EG; st.suns = DEF_SUN; st.Pin = DEF_PIN;
  selS.value = String(DEF_PIN); sEg.value = String(DEF_EG * 100); sSun.value = String(DEF_SUN);
  syncLabels(); rebuild(); draw();
});
bP.addEventListener('click', () => {
  if (!st.running && st.ph >= 1) restart();
  else { st.running = !st.running; bP.textContent = st.running ? 'Pause' : 'Play'; bP.setAttribute('aria-pressed', String(!st.running)); }
});

function getState() { return { eg: st.Eg.toFixed(2), suns: String(st.suns), pin: String(st.Pin) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.eg) { st.Eg = parseFloat(s.eg); sEg.value = String(Math.round(st.Eg * 100)); }
  if (s.suns) { st.suns = parseInt(s.suns, 10); sSun.value = String(st.suns); }
  if (s.pin) { st.Pin = parseFloat(s.pin); selS.value = String(st.Pin); }
}

function boot() {
  restoreState(); syncLabels(); rebuild();
  mountShareButton(document.getElementById('share-mount'), getState, { label: 'Copy URL' });
  if (CAPTURE_NAME) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.ph = f;
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
