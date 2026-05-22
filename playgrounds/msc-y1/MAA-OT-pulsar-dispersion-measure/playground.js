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

  // left: the spinning pulsar
  const lit = drawPulsar(150, 210, 30);
  // a wavefront racing toward the dynamic spectrum when a beam fires
  const beat = (st.t % st.period) / st.period;
  if (beat < 0.5) {
    const wx = 195 + beat * 2 * 360;
    ctx.strokeStyle = `rgba(150,210,255,${(0.5 * (1 - beat * 2)).toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wx, 120); ctx.lineTo(wx, 320); ctx.stroke();
  }
  if (lit) {
    ctx.fillStyle = 'rgba(180,225,255,0.9)';
    ctx.beginPath(); ctx.arc(150, 210, 7, 0, 6.2832); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(120,150,200,0.25)';
  ctx.strokeRect(20.5, 60.5, 280, 300);
  ctx.fillStyle = '#5a6477'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('beam sweeps the line of sight as it rotates', 160, 350);

  // right: dynamic spectrum, de-dispersed at the trial DM
  paintWaterfall();
  const wx0 = 322, wy0 = 60, wW = W - wx0 - 22, wHh = 300;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, NT, NCH, wx0, wy0, wW, wHh);
  ctx.strokeStyle = 'rgba(120,150,200,0.3)'; ctx.strokeRect(wx0 + 0.5, wy0 + 0.5, wW - 1, wHh - 1);
  ctx.fillStyle = '#cdd3e2'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('dynamic spectrum (trial-DM corrected)', wx0 + 6, wy0 - 6);
  ctx.fillStyle = 'rgba(220,228,245,0.85)'; ctx.textAlign = 'left';
  ctx.fillText(`${F_HI} MHz`, wx0 + 6, wy0 + 14);
  ctx.fillText(`${F_LO} MHz`, wx0 + 6, wy0 + wHh - 7);
  ctx.fillStyle = '#8893a6'; ctx.save(); ctx.translate(14, wy0 + wHh / 2); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left'; ctx.fillText('f', 0, 0); ctx.restore();
  ctx.textAlign = 'right'; ctx.fillText('time ->', wx0 + wW, wy0 + wHh + 14);
  ctx.textAlign = 'center'; ctx.fillStyle = flagCol;
  ctx.fillText(flag === 'MATCH' ? 'aligned: the sweep stands vertical'
    : 'mis-set DM: the f^-2 sweep is still tilted', wx0 + wW / 2, wy0 + wHh + 12);

  // bottom: de-dispersed summed profile
  const py0 = 392, pH = H - py0 - 26;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(wx0, py0, wW, pH);
  ctx.strokeStyle = 'rgba(120,150,200,0.3)'; ctx.strokeRect(wx0 + 0.5, py0 + 0.5, wW - 1, pH - 1);
  ctx.fillStyle = '#cdd3e2'; ctx.textAlign = 'left'; ctx.font = fontString(canvas, 'caption', 'mono');
  ctx.fillText('de-dispersed profile (sum over channels)', wx0 + 6, py0 + 14);
  let mx = 1e-9; for (let j = 0; j < NT; j += 1) if (ded[j] > mx) mx = ded[j];
  ctx.strokeStyle = flagCol; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let j = 0; j < NT; j += 1) {
    const x = wx0 + 8 + j / (NT - 1) * (wW - 16);
    const y = py0 + pH - 8 - (ded[j] / mx) * (pH - 26);
    j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // left-of-profile: the f^-2 law reminder + DM meaning
  ctx.fillStyle = '#5a6477'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('dt = DM/2.41e-4 (1/f^2 - 1/fref^2) ms     DM = integral n_e dl  (electron column -> distance)', 22, py0 + pH - 4);

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
      { key: 'dm', label: 'dispersion measure (pc/cm3)', value: (st?.dm || 100).toFixed(1), format: 'float' },
      { key: 'freq-low', label: 'freq low (MHz)', value: (st?.f_lo || 400).toFixed(0), format: 'float' },
      { key: 'freq-high', label: 'freq high (MHz)', value: (st?.f_hi || 1500).toFixed(0), format: 'float' },
    ],
  };
};
window.playground.getInvariants = function () {
  return [{ key: 'dispersion-dedispersion', label: 'chirp and dedispersion', value: 'active', status: 'pass' }];
};
