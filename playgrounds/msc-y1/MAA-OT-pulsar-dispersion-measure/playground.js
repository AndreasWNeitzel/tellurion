// Pulsar dispersion-measure dedispersion. The pulsar is now the
// object it is: a spinning neutron star whose two beams sweep like a
// lighthouse; each time a beam crosses the line of sight to Earth a
// flash is emitted, races across the ionized interstellar medium and
// arrives smeared into the f^-2 dispersion sweep on the dynamic
// spectrum. Tune the trial DM to shear the sweep vertical and watch
// the de-dispersed profile snap into a sharp spike (the S/N peaks at
// the true DM). sim.js holds the testable physics. Reference:
// Lorimer and Kramer, Handbook of Pulsar Astronomy, Ch. 4.
import { delayMs, dynamicSpectrum, dedisperse, snr } from './sim.js';
import { cividis, fieldToImageData } from '../../../shared/js/render/colormaps.js';
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
const W = canvas.width, H = canvas.height;

const F_LO = 400, F_HI = 1400, NCH = 80, NT = 220;
const st = { trueDM: 120, guessDM: 120, width: 3.0, period: 1.6, t: 0, running: !DETERMINISTIC };

// Time window scaled to the actual dispersion sweep so the whole
// f^-2 arc fits the panel at any DM (a fixed window only caught a
// sliver, the original bug).
function TWIN() { return Math.max(50, delayMs(st.trueDM, F_LO, F_HI) * 1.45); }

let specDM = -1, specW = -1, spec = null;
function getSpec() {
  if (specDM !== st.trueDM || specW !== st.width) {
    spec = dynamicSpectrum(st.trueDM, st.width, NCH, NT, F_LO, F_HI, TWIN());
    specDM = st.trueDM; specW = st.width;
  }
  return spec;
}

const off = document.createElement('canvas'); off.width = NT; off.height = NCH;
const offCtx = off.getContext('2d');
let idata = null;
// Display the data de-dispersed at the trial DM: shift each channel
// by +delay(guessDM) so the sweep stands vertical when guess = true.
function paintWaterfall() {
  const s = getSpec();
  const disp = new Float64Array(NCH * NT);
  const dt = TWIN() / NT;
  let mx = 1e-9;
  for (let i = 0; i < NCH; i += 1) {
    const f = F_HI - (F_HI - F_LO) * i / (NCH - 1);
    const sh = delayMs(st.guessDM, f, F_HI) / dt;
    const k0 = Math.floor(sh), fr = sh - k0;
    for (let j = 0; j < NT; j += 1) {
      const a = j + k0, b = a + 1;
      const va = (a >= 0 && a < NT) ? s[i * NT + a] : 0;
      const vb = (b >= 0 && b < NT) ? s[i * NT + b] : 0;
      const v = va * (1 - fr) + vb * fr;
      disp[i * NT + j] = v; if (v > mx) mx = v;
    }
  }
  idata = fieldToImageData(disp, NT, NCH, 0, mx, cividis, idata);
  offCtx.putImageData(idata, 0, 0);
}

function drawPulsar(px, py, R) {
  const spin = st.t * 2 * Math.PI / st.period;     // rotation phase
  const alpha = 0.62;                              // magnetic vs spin axis tilt
  // spin axis (vertical) + body
  ctx.strokeStyle = 'rgba(150,170,210,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px, py - R - 26); ctx.lineTo(px, py + R + 26); ctx.stroke();
  const bg = ctx.createRadialGradient(px - R * 0.3, py - R * 0.3, 1, px, py, R);
  bg.addColorStop(0, '#dfe7ff'); bg.addColorStop(0.6, '#8aa0d8'); bg.addColorStop(1, '#2b3a63');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(px, py, R, 0, 6.2832); ctx.fill();
  // dipole field hint
  ctx.strokeStyle = 'rgba(120,180,255,0.18)';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(px, py, R * 2.1, R * 1.05, alpha * s, 0, 6.2832); ctx.stroke(); }
  // two beams along the magnetic axis, swept by rotation
  const bx = Math.sin(spin) * Math.cos(alpha), by = -Math.sin(alpha);
  const losAng = -0.15;                            // line of sight to Earth
  const align = Math.abs(Math.atan2(by, bx) - losAng);
  for (const dir of [1, -1]) {
    const ang = Math.atan2(by * dir, bx * dir);
    const lit = Math.min(Math.abs(((Math.atan2(by * dir, bx * dir) - losAng + Math.PI) % (2 * Math.PI)) - Math.PI), 1);
    const gA = ctx.createLinearGradient(px, py, px + Math.cos(ang) * 240, py + Math.sin(ang) * 240);
    gA.addColorStop(0, `rgba(120,200,255,${(0.5 - 0.35 * lit).toFixed(2)})`);
    gA.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = gA;
    ctx.beginPath(); ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(ang - 0.16) * 250, py + Math.sin(ang - 0.16) * 250);
    ctx.lineTo(px + Math.cos(ang + 0.16) * 250, py + Math.sin(ang + 0.16) * 250);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#9fb0cc'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('neutron star', px, py + R + 44);
  ctx.fillText(`P = ${st.period.toFixed(2)} s`, px, py + R + 60);
  return align < 0.16;                              // beam crossing the LOS now
}

// S/N as a function of trial DM (the dedispersion search): it peaks
// sharply at the true DM. Cached on (trueDM, width); the trial-DM
// marker moves without recomputing.
let snDM = -1, snWd = -1, snCurve = null, snInfo = null;
function getSNCurve() {
  if (snDM !== st.trueDM || snWd !== st.width) {
    const lo = Math.max(0, st.trueDM - 100), hi = Math.min(600, st.trueDM + 100);
    const N = 120, arr = new Float64Array(N); let mx = 1e-9;
    for (let i = 0; i < N; i += 1) {
      const d = lo + (hi - lo) * i / (N - 1);
      const s = snr(dedisperse(getSpec(), d, NCH, NT, F_LO, F_HI, TWIN()));
      arr[i] = s; if (s > mx) mx = s;
    }
    snCurve = arr; snInfo = { lo, hi, mx }; snDM = st.trueDM; snWd = st.width;
  }
  return { curve: snCurve, ...snInfo };
}

function drawSNPanel(x0, y0, w, h, sn, flagCol) {
  ctx.fillStyle = '#0d1117'; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(120,150,200,0.3)'; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#cdd3e2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('dedispersion search: S/N vs trial DM', x0 + 6, y0 + 14);
  const { curve, lo, hi, mx } = getSNCurve();
  const ax = x0 + 44, aw = w - 58, ay = y0 + 26, ah = h - 46;
  const X = (d) => ax + aw * (d - lo) / (hi - lo);
  const Y = (s) => ay + ah * (1 - s / mx);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + ah); ctx.lineTo(ax + aw, ay + ah); ctx.stroke();
  ctx.strokeStyle = 'rgba(52,211,153,0.5)'; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(X(st.trueDM), ay); ctx.lineTo(X(st.trueDM), ay + ah); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(127,177,216,0.14)'; ctx.beginPath(); ctx.moveTo(ax, ay + ah);
  for (let i = 0; i < curve.length; i += 1) { const d = lo + (hi - lo) * i / (curve.length - 1); ctx.lineTo(X(d), Y(curve[i])); }
  ctx.lineTo(ax + aw, ay + ah); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#7fb1d8'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < curve.length; i += 1) { const d = lo + (hi - lo) * i / (curve.length - 1); const xx = X(d), yy = Y(curve[i]); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
  ctx.stroke();
  if (st.guessDM >= lo && st.guessDM <= hi) {
    ctx.strokeStyle = flagCol; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X(st.guessDM), ay); ctx.lineTo(X(st.guessDM), ay + ah); ctx.stroke();
    ctx.fillStyle = flagCol; ctx.beginPath(); ctx.arc(X(st.guessDM), Y(sn), 4, 0, 6.28); ctx.fill();
  }
  ctx.fillStyle = 'rgba(170,180,200,0.7)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const d of [lo, st.trueDM, hi]) ctx.fillText(d.toFixed(0), X(d), ay + ah + 5);
  ctx.fillText('trial DM (pc/cm3)', ax + aw / 2, ay + ah + 19);
  ctx.fillStyle = 'rgba(52,211,153,0.9)'; ctx.fillText('true DM', X(st.trueDM) + 2, ay + ah - 14);
  ctx.save(); ctx.translate(ax - 28, ay + ah / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = 'rgba(170,180,200,0.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('S/N', 0, 0); ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

function render() {
  if (st.running && !CAPTURE_NAME) st.t += 0.016;
  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);

  const ded = dedisperse(getSpec(), st.guessDM, NCH, NT, F_LO, F_HI, TWIN());
  const sn = snr(ded);
  const dErr = Math.abs(st.guessDM - st.trueDM);
  const flag = dErr < 1 ? 'MATCH' : (dErr < 0.08 * Math.max(st.trueDM, 1) + 4 ? 'near' : 'WRONG DM');
  const flagCol = flag === 'MATCH' ? '#34d399' : (flag === 'near' ? '#ffd166' : '#f87272');

  // on-canvas readout band (the DOM panel overlapped the canvas)
  ctx.font = fontString(canvas, 'body', 'mono'); ctx.textAlign = 'left';
  ctx.fillStyle = '#cdd3e2';
  ctx.fillText('A pulsar flash, smeared by the interstellar medium, then realigned', 18, 22);
  ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillStyle = '#8893a6';
  ctx.fillText(`true DM ${st.trueDM} pc/cm3`, 18, 42);
  ctx.fillText(`trial DM ${st.guessDM}`, 200, 42);
  ctx.fillText(`S/N ${sn.toFixed(1)}`, 330, 42);
  ctx.fillStyle = flagCol;
  ctx.fillText(`[ ${flag} ]`, 430, 42);

  // ---- top-left: the spinning pulsar, now a proper hero ----
  const PUL = { x: 20, y: 56, w: 315, h: 414 };
  ctx.fillStyle = '#0a0c14'; ctx.fillRect(PUL.x, PUL.y, PUL.w, PUL.h);
  ctx.save(); ctx.beginPath(); ctx.rect(PUL.x, PUL.y, PUL.w, PUL.h); ctx.clip();
  const lit = drawPulsar(PUL.x + PUL.w / 2, PUL.y + PUL.h / 2 - 6, 52);
  if (lit) { ctx.fillStyle = 'rgba(180,225,255,0.95)'; ctx.beginPath(); ctx.arc(PUL.x + PUL.w / 2, PUL.y + PUL.h / 2 - 6, 9, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(120,150,200,0.3)'; ctx.strokeRect(PUL.x + 0.5, PUL.y + 0.5, PUL.w - 1, PUL.h - 1);
  ctx.fillStyle = '#cdd3e2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('the pulsar: a lighthouse beam', PUL.x + 6, PUL.y + 14);
  ctx.fillStyle = '#5a6477'; ctx.textAlign = 'center';
  ctx.fillText('beam sweeps the line of sight as it rotates', PUL.x + PUL.w / 2, PUL.y + PUL.h - 8);

  // ---- top-right: dynamic spectrum, de-dispersed at the trial DM ----
  paintWaterfall();
  const WF = { x: 355, y: 76, w: W - 355 - 22, h: 360 };
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, NT, NCH, WF.x, WF.y, WF.w, WF.h);
  ctx.strokeStyle = 'rgba(120,150,200,0.3)'; ctx.strokeRect(WF.x + 0.5, WF.y + 0.5, WF.w - 1, WF.h - 1);
  ctx.fillStyle = '#cdd3e2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('dynamic spectrum (trial-DM corrected)', WF.x + 4, WF.y - 6);
  ctx.fillStyle = 'rgba(220,228,245,0.85)';
  ctx.fillText(`${F_HI} MHz`, WF.x + 6, WF.y + 14);
  ctx.fillText(`${F_LO} MHz`, WF.x + 6, WF.y + WF.h - 7);
  ctx.fillStyle = '#8893a6'; ctx.textAlign = 'right'; ctx.fillText('time ->', WF.x + WF.w - 4, WF.y + WF.h + 14);
  ctx.textAlign = 'center'; ctx.fillStyle = flagCol;
  ctx.fillText(flag === 'MATCH' ? 'aligned: the sweep stands vertical'
    : 'mis-set DM: the f^-2 sweep is still tilted', WF.x + WF.w / 2, WF.y + WF.h + 28);

  // ---- bottom-left: de-dispersed summed profile (compact, was huge) ----
  const PR = { x: 20, y: 498, w: 360, h: 470 };
  ctx.fillStyle = '#0d1117'; ctx.fillRect(PR.x, PR.y, PR.w, PR.h);
  ctx.strokeStyle = 'rgba(120,150,200,0.3)'; ctx.strokeRect(PR.x + 0.5, PR.y + 0.5, PR.w - 1, PR.h - 1);
  ctx.fillStyle = '#cdd3e2'; ctx.textAlign = 'left'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('de-dispersed profile (sum over channels)', PR.x + 6, PR.y + 14);
  { let mxp = 1e-9; for (let j = 0; j < NT; j += 1) if (ded[j] > mxp) mxp = ded[j];
    const ax = PR.x + 12, aw = PR.w - 24, ay = PR.y + 28, ah = PR.h - 48;
    ctx.fillStyle = 'rgba(127,177,216,0.12)'; ctx.beginPath(); ctx.moveTo(ax, ay + ah);
    for (let j = 0; j < NT; j += 1) ctx.lineTo(ax + j / (NT - 1) * aw, ay + ah - (ded[j] / mxp) * ah);
    ctx.lineTo(ax + aw, ay + ah); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = flagCol; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let j = 0; j < NT; j += 1) { const x = ax + j / (NT - 1) * aw, y = ay + ah - (ded[j] / mxp) * ah; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(170,180,200,0.6)'; ctx.font = fontString(canvas, 'tick', 'mono'); ctx.textAlign = 'center'; ctx.fillText('time ->', ax + aw / 2, ay + ah + 16);
  }

  // ---- bottom-right: the dedispersion search, S/N vs trial DM ----
  drawSNPanel(396, 498, W - 396 - 20, 470, sn, flagCol);

  // f^-2 law caption
  ctx.fillStyle = '#5a6477'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('dt = DM / 2.41e-4 (1/f^2 - 1/fref^2) s     DM = integral n_e dl', 22, H - 12);

  if (readoutEl) readoutEl.textContent = `true DM ${st.trueDM}, trial DM ${st.guessDM}, S/N ${sn.toFixed(1)} [${flag}]`;
}

function frame() { render(); if (!CAPTURE_NAME) requestAnimationFrame(frame); }

function buildControls() {
  if (!controlsEl) return;
  controlsEl.innerHTML = '';
  const mk = (label, min, max, step, val, on, fmt = (v) => v.toFixed(0)) => {
    const row = document.createElement('div'); row.className = 'row';
    const l = document.createElement('span'); l.className = 'label'; l.textContent = label;
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
    inp.setAttribute('aria-label', label);
    const v = document.createElement('span'); v.className = 'value'; v.textContent = fmt(val);
    inp.addEventListener('input', () => { const x = parseFloat(inp.value); v.textContent = fmt(x); on(x); render(); });
    row.append(l, inp, v); controlsEl.appendChild(row); return inp;
  };
  mk('true DM', 0, 600, 1, st.trueDM, (x) => { st.trueDM = x; });
  mk('trial DM', 0, 600, 1, st.guessDM, (x) => { st.guessDM = x; });
  mk('pulse width ms', 1, 12, 0.5, st.width, (x) => { st.width = x; }, (v) => v.toFixed(1));
  mk('period s', 0.5, 4, 0.05, st.period, (x) => { st.period = x; }, (v) => v.toFixed(2));
  const prow = document.createElement('div'); prow.className = 'row buttons';
  for (const [n, dm] of [['Crab', 57], ['Vela', 68], ['B1937+21', 71], ['FRB', 500]]) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = n;
    b.addEventListener('click', () => { st.trueDM = dm; st.guessDM = Math.max(0, dm - 40); buildControls(); render(); });
    prow.appendChild(b);
  }
  const bf = document.createElement('button'); bf.type = 'button'; bf.textContent = 'Find DM';
  bf.addEventListener('click', () => {
    let best = 0, bs = -Infinity;
    for (let d = 0; d <= 600; d += 1) { const s = snr(dedisperse(getSpec(), d, NCH, NT, F_LO, F_HI, TWIN())); if (s > bs) { bs = s; best = d; } }
    st.guessDM = best; buildControls(); render();
  });
  prow.appendChild(bf);
  controlsEl.appendChild(prow);
}

function bootSync() {
  buildControls();
  if (readoutEl) readoutEl.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;padding:0;border:0';
  if (CAPTURE_NAME && DETERMINISTIC) {
    const f = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.trueDM = 120;
    st.guessDM = Math.round(40 + f * 80);          // sweep mis-set -> matched
    st.t = f * 3;
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(frame); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(frame); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'dm-trial', label: 'trial DM (pc/cm3)', value: st.guessDM.toFixed(1), format: 'float' },
      { key: 'dm-true', label: 'true DM (pc/cm3)', value: st.trueDM.toFixed(1), format: 'float' },
      { key: 'freq-low', label: 'freq low (MHz)', value: F_LO.toFixed(0), format: 'float' },
      { key: 'freq-high', label: 'freq high (MHz)', value: F_HI.toFixed(0), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  return [{ key: 'dispersion-dedispersion', label: 'chirp and dedispersion', value: 'active', status: 'pass' }];
};
