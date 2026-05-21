// Reflection and refraction at a dielectric interface, drawn as the
// actual electromagnetic wave. The incident plane wave comes down from
// medium 1 (top), interferes with its reflection into the partial
// standing-wave pattern, and the transmitted wave continues into
// medium 2 (bottom) at the Snell angle; above the critical angle the
// lower field is a clinging evanescent skin. The reflected p-wave
// vanishes at Brewster. The Fresnel reflectance-vs-angle plot is the
// diagnostic. Numerics in sim.js. Reference: Hecht, Optics (5th ed.),
// Sec. 4.6; Jackson, Classical Electrodynamics (3rd ed.), Sec. 7.3.
import { snellTheta2, brewster, criticalAngle, fresnel } from './sim.js';
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

const READOUTS = ['th_i', 'th_t', 'n1/n2', 'R_s', 'R_p', 'regime'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const DEG = Math.PI / 180;
const st = { thi: 56.3, n1: 1.0, n2: 1.5, pol: 'p', t: 0, running: 1 };

// scene geometry: medium 1 is the TOP half, medium 2 the BOTTOM half,
// the interface is the horizontal mid-line, the normal is vertical.
const SX = 28, SY = 50, SW = 540, SH = 470;
const OX = SX + SW / 2, OY = SY + SH / 2;
const PX = 596, PW = 282, PYp = 196, PHp = 250;
const LAMBDA0 = 46, K0 = 2 * Math.PI / LAMBDA0, OMEGA = K0 * 2.4;

// half-resolution wave-field buffer, allocated once
const NX = SW >> 1, NY = SH >> 1;
const off = document.createElement('canvas'); off.width = NX; off.height = NY;
const offctx = off.getContext('2d');
const img = offctx.createImageData(NX, NY);
const buf = img.data;

function drawField(th1, n1, n2, th2, fr) {
  const ki = [K0 * n1 * Math.sin(th1), K0 * n1 * Math.cos(th1)];     // incident: down-right
  const kr = [K0 * n1 * Math.sin(th1), -K0 * n1 * Math.cos(th1)];    // reflected: up-right
  const rC = st.pol === 'p' ? fr.rp : fr.rs;
  const rMag = Math.hypot(rC.re, rC.im), rArg = Math.atan2(rC.im, rC.re);
  const tC = st.pol === 'p' ? fr.tp : fr.ts;
  const tMag = Math.hypot(tC.re, tC.im), tArg = Math.atan2(tC.im, tC.re);
  const tir = fr.tir;
  const kt = (!tir && th2 !== null) ? [K0 * n2 * Math.sin(th2), K0 * n2 * Math.cos(th2)] : null;
  const kpar = K0 * n1 * Math.sin(th1), kappa = K0 * fr.kappaK0;     // TIR evanescent
  const wt = OMEGA * st.t;
  let p = 0;
  for (let jj = 0; jj < NY; jj += 1) {
    const dyp = (jj * 2 + 1) - SH / 2;                               // y relative to interface (px, +down)
    for (let ii = 0; ii < NX; ii += 1) {
      const dxp = (ii * 2 + 1) - SW / 2;
      let e, med2;
      if (dyp <= 0) {                                                // medium 1: incident + reflected
        e = Math.cos(ki[0] * dxp + ki[1] * dyp - wt)
          + rMag * Math.cos(kr[0] * dxp + kr[1] * dyp - wt + rArg);
        med2 = 0;
      } else if (kt) {                                               // medium 2: transmitted
        e = tMag * Math.cos(kt[0] * dxp + kt[1] * dyp - wt + tArg);
        med2 = 1;
      } else {                                                       // TIR: evanescent skin
        e = (1 + rMag) * Math.exp(-kappa * dyp) * Math.cos(kpar * dxp - wt + rArg);
        med2 = 1;
      }
      const s = e * 70;
      let Rr, Gg, Bb;
      if (s >= 0) { const u = s > 100 ? 1 : s / 100; Rr = 40 * u + 6; Gg = 150 * u + 10; Bb = 205 * u + 16; }
      else { const u = s < -100 ? 1 : -s / 100; Rr = 14 * u + 6; Gg = 34 * u + 8; Bb = 120 * u + 16; }
      if (med2) { Gg += 16; Bb -= 6; }                               // faint tint for medium 2
      buf[p] = Rr; buf[p + 1] = Gg; buf[p + 2] = Bb; buf[p + 3] = 255;
      p += 4;
    }
  }
  offctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, SX, SY, SW, SH);
}

function guideRay(angFromNormalDown, color) {                        // thin ray guide
  // angle measured from the downward normal; returns unit dir
  return [Math.sin(angFromNormalDown), Math.cos(angFromNormalDown)];
}
function rayLine(x0, y0, x1, y1, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.setLineDash([7, 5]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.setLineDash([]);
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - 9 * Math.cos(a - 0.42), y1 - 9 * Math.sin(a - 0.42));
  ctx.lineTo(x1 - 9 * Math.cos(a + 0.42), y1 - 9 * Math.sin(a + 0.42));
  ctx.closePath(); ctx.fill();
}
function tlabel(s, x, y, col) {
  ctx.save(); ctx.fillStyle = col; ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 4;
  ctx.fillText(s, x, y); ctx.fillText(s, x, y); ctx.restore();
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const th1 = st.thi * DEG, n1 = st.n1, n2 = st.n2;
  const th2 = snellTheta2(n1, n2, th1);
  const f = fresnel(n1, n2, th1);
  const tc = criticalAngle(n1, n2), tB = brewster(n1, n2);
  const tir = f.tir;

  drawField(th1, n1, n2, th2, f);

  // interface, normal, frame
  ctx.strokeStyle = 'rgba(230,235,245,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(SX, OY); ctx.lineTo(SX + SW, OY); ctx.stroke(); ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(190,195,210,0.4)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(OX, SY); ctx.lineTo(OX, SY + SH); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(SX, SY, SW, SH);
  ctx.font = fontString(canvas, 'caption', 'mono');
  tlabel(`medium 1 (incident)  n1 = ${n1.toFixed(2)}`, SX + 12, SY + 20, '#aab4cc');
  tlabel(`medium 2 (transmit)  n2 = ${n2.toFixed(2)}`, SX + 12, SY + SH - 12, '#aeccc0');

  // thin guide rays so the angles are explicit (incident from the TOP)
  const L = SH * 0.44;
  const di = guideRay(th1);
  rayLine(OX - di[0] * L, OY - di[1] * L, OX, OY, 'rgba(255,210,74,0.9)');     // incident, comes down from top
  const Rsel = st.pol === 's' ? f.Rs : st.pol === 'p' ? f.Rp : 0.5 * (f.Rs + f.Rp);
  if (Rsel > 4e-3) rayLine(OX, OY, OX + di[0] * L, OY - di[1] * L, 'rgba(127,176,255,0.9)');   // reflected, up
  else tlabel('reflected p extinguished (Brewster)', OX + 16, OY - 60, '#7fb0ff');
  if (!tir && th2 !== null) {
    const dt = guideRay(th2);
    rayLine(OX, OY, OX + dt[0] * L, OY + dt[1] * L, 'rgba(127,224,192,0.9)');  // refracted, down
  }

  // angle arcs
  ctx.strokeStyle = 'rgba(255,210,90,0.7)'; ctx.beginPath();
  ctx.arc(OX, OY, 36, -Math.PI / 2, -Math.PI / 2 - th1, true); ctx.stroke();
  tlabel(`${st.thi.toFixed(0)} deg`, OX - 70, OY - 30, '#ffd24a');
  if (!tir && th2 !== null) {
    ctx.strokeStyle = 'rgba(127,224,192,0.7)'; ctx.beginPath();
    ctx.arc(OX, OY, 36, Math.PI / 2, Math.PI / 2 - th2, true); ctx.stroke();
    tlabel(`${(th2 / DEG).toFixed(0)} deg`, OX + 46, OY + 40, '#7fe0c0');
  }
  if (tir) tlabel('total internal reflection: evanescent skin below', OX - 150, OY + 40, '#ff9a78');

  // polarization inset (always present so the choice is perceptible)
  const ix = SX + SW - 168, iy = SY + 28, iw = 156, ih = 52;
  ctx.fillStyle = 'rgba(8,10,16,0.78)'; ctx.fillRect(ix, iy, iw, ih);
  ctx.strokeStyle = 'rgba(200,205,215,0.3)'; ctx.strokeRect(ix, iy, iw, ih);
  ctx.strokeStyle = 'rgba(255,210,90,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ix + 12, iy + 30); ctx.lineTo(ix + iw - 14, iy + 30); ctx.stroke(); ctx.lineWidth = 1;
  if (st.pol === 's' || st.pol === 'u') {
    ctx.fillStyle = '#7fb0ff';
    for (let q = 0; q < 6; q += 1) { ctx.beginPath(); ctx.arc(ix + 22 + q * 20, iy + 30, 4.5, 0, 6.2832); ctx.fill(); }
  }
  if (st.pol === 'p' || st.pol === 'u') {
    ctx.strokeStyle = '#ff9a78'; ctx.lineWidth = 2;
    for (let q = 0; q < 6; q += 1) { const xx = ix + 22 + q * 20; ctx.beginPath(); ctx.moveTo(xx, iy + 16); ctx.lineTo(xx, iy + 44); ctx.stroke(); }
    ctx.lineWidth = 1;
  }
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  tlabel(st.pol === 's' ? 's: E out of plane' : st.pol === 'p' ? 'p: E in plane' : 'unpolarized (s shown)', ix + iw / 2, iy + ih - 4, '#c8ccd6');
  ctx.textAlign = 'left';

  const reg = tir ? 'total internal reflection'
    : (Math.abs(th1 - tB) < 0.5 * DEG && st.pol !== 's' ? 'Brewster: no reflected p' : 'partial reflection + refraction');
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText(`incident wave from the top; reflected back up; transmitted down -- ${reg}`, SX + SW / 2, SY + SH + 22);
  ctx.textAlign = 'left';

  // Fresnel reflectance diagnostic
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(PX, PYp, PW, PHp);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(PX, PYp, PW, PHp);
  ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('Fresnel reflectance vs angle (diagnostic)', PX + PW / 2, PYp - 6);
  const gx = (deg) => PX + 8 + (deg / 90) * (PW - 16), gy = (Rv) => PYp + PHp - 18 - Rv * (PHp - 30);
  ctx.strokeStyle = 'rgba(200,205,215,0.25)'; ctx.beginPath();
  ctx.moveTo(PX + 8, gy(0)); ctx.lineTo(PX + PW - 8, gy(0));
  ctx.moveTo(PX + 8, gy(1)); ctx.lineTo(PX + PW - 8, gy(1)); ctx.stroke();
  for (const [key, col, polKey] of [['Rs', '#7fb0ff', 's'], ['Rp', '#ffd24a', 'p']]) {
    const sel = st.pol === polKey || st.pol === 'u';
    ctx.strokeStyle = col; ctx.lineWidth = sel ? 2.8 : 1.1; ctx.globalAlpha = sel ? 1 : 0.4;
    ctx.beginPath();
    for (let d = 0; d <= 90; d += 0.5) { const v = Math.min(1, fresnel(n1, n2, d * DEG)[key]); const X = gx(d), Y = gy(v); d === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
    ctx.stroke();
  }
  ctx.lineWidth = 1; ctx.globalAlpha = 1;
  if (tB && tB < Math.PI / 2) { ctx.strokeStyle = 'rgba(255,210,90,0.4)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(gx(tB / DEG), PYp + 6); ctx.lineTo(gx(tB / DEG), PYp + PHp - 6); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center'; ctx.fillText('Brewster', gx(tB / DEG), PYp + PHp - 4); }
  if (tc !== null) { ctx.strokeStyle = 'rgba(255,150,110,0.4)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(gx(tc / DEG), PYp + 6); ctx.lineTo(gx(tc / DEG), PYp + PHp - 6); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#c8ccd6'; ctx.textAlign = 'center'; ctx.fillText('crit', gx(tc / DEG), PYp + 12); }
  ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(gx(st.thi), gy(Math.min(1, st.pol === 's' ? f.Rs : f.Rp)), 4, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#7fb0ff'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left'; ctx.fillText('Rs', PX + 10, PYp + 14);
  ctx.fillStyle = '#ffd24a'; ctx.fillText('Rp', PX + 36, PYp + 14);
  ctx.fillStyle = '#c8ccd6'; ctx.textAlign = 'center'; ctx.fillText('theta_i (deg)', PX + PW / 2, PYp + PHp + 14); ctx.textAlign = 'left';

  rEls['th_i'].textContent = st.thi.toFixed(1) + ' deg';
  rEls['th_t'].textContent = tir || th2 === null ? 'TIR' : (th2 / DEG).toFixed(1) + ' deg';
  rEls['n1/n2'].textContent = `${n1.toFixed(2)}/${n2.toFixed(2)}`;
  rEls['R_s'].textContent = f.Rs.toFixed(4);
  rEls['R_p'].textContent = f.Rp.toFixed(4);
  rEls['regime'].textContent = tir ? 'TIR' : 'refracting';
}

function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const cTh = buildSlider('incidence (deg)', 1, 89, 0.5, st.thi, 'thi', v => v.toFixed(1));
const cN1 = buildSlider('n1 (incident)', 1.0, 2.5, 0.01, st.n1, 'n1', v => v.toFixed(2));
const cN2 = buildSlider('n2 (transmit)', 1.0, 2.5, 0.01, st.n2, 'n2', v => v.toFixed(2));
const pRow = document.createElement('div'); pRow.className = 'row';
const pLab = document.createElement('span'); pLab.className = 'label'; pLab.textContent = 'polarization';
const pSel = document.createElement('select'); pSel.setAttribute('aria-label', 'polarization');
for (const [v, t] of [['p', 'p (TM)'], ['s', 's (TE)'], ['u', 'unpolarized']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; pSel.appendChild(o); }
pSel.value = st.pol;
pSel.addEventListener('change', () => { st.pol = pSel.value; render(); });
pRow.appendChild(pLab); pRow.appendChild(pSel); const psp = document.createElement('span'); psp.className = 'value'; pRow.appendChild(psp);
controlsEl.appendChild(pRow);
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { thi: 56.3, n1: 1.0, n2: 1.5, pol: 'p', t: 0, running: 1 });
  cTh.inp.value = '56.3'; cTh.val.textContent = '56.3'; cN1.inp.value = '1'; cN1.val.textContent = '1.00'; cN2.inp.value = '1.5'; cN2.val.textContent = '1.50'; pSel.value = 'p';
  bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

function tick() { if (st.running) st.t += 1; render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    st.thi = 15 + frac * 67;                 // sweep incidence: refraction -> Brewster -> grazing
    st.t = 0;                                // frozen phase for a deterministic frame
    cTh.inp.value = String(st.thi); cTh.val.textContent = st.thi.toFixed(1);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const tB = brewster(1, 1.5);
  if (fresnel(1, 1.5, tB).Rp > 1e-9) return { name: 'Brewster', pass: false, msg: 'Rp != 0 at tB' };
  const tc = criticalAngle(1.5, 1);
  const a = fresnel(1.5, 1, tc + 10 * DEG);
  if (!a.tir || Math.abs(a.Rs - 1) > 1e-9) return { name: 'TIR', pass: false, msg: 'R != 1 above tc' };
  const e = fresnel(1, 1.5, 40 * DEG);
  if (Math.abs(e.Rs + e.Ts - 1) > 1e-4) return { name: 'energy', pass: false, msg: 'R+T != 1' };
  return { name: 'Snell + Brewster + TIR + R+T=1', pass: true, msg: 'Fresnel equations exact' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2, generic fallback) ===
// Reports the live control values as state. A later refinement pass
// can replace this with playground-specific physical quantities.
window.playground = window.playground || {};
if (!window.playground.getState) {
  window.playground.getState = function () {
    const fields = [];
    document.querySelectorAll('#controls input, #controls select').forEach((el) => {
      if (el.type === 'button') return;
      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });
    });
    return { fields };
  };
}
if (!window.playground.getInvariants) {
  window.playground.getInvariants = function () { return []; };
}
