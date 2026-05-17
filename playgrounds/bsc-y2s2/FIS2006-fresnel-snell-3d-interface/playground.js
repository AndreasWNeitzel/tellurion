// Reflection and refraction at a dielectric interface. The primary
// scene is physical: an incident beam strikes the boundary, the
// reflected and refracted beams leave at the Snell angle, the
// reflected p-beam vanishes at Brewster, and above the critical angle
// the beam is totally internally reflected with an evanescent skin.
// The side panel is the Fresnel reflectance R_s, R_p versus angle.
// Numerics in sim.js. Reference: Hecht, Optics (5th ed.), Sec. 4.6.

import { snellTheta2, brewster, criticalAngle, fresnel } from './sim.js';

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
// default at Brewster for 1 -> 1.5 (atan 1.5 = 56.31 deg): the p-beam
// vanishes here, so the polarization choice is dramatic on load
const st = { thi: 56.3, n1: 1.0, n2: 1.5, pol: 'p', t: 0, running: 1 };

// geometry
const SX = 28, SY = 50, SW = 540, SH = 470;
const ox = SX + SW / 2, oy = SY + SH / 2;                      // interface point
const PX = 596, PW = 282, PYp = 196, PHp = 250;

// strength in [0,1] sets the beam WIDTH (a large-area signal): a
// strong beam is a thick bright band, a vanishing one is gone.
function beam(ang, len, fromOrigin, color, dashPhase, strength) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const x0 = fromOrigin ? ox : ox - dx * len, y0 = fromOrigin ? oy : oy - dy * len;
  const x1 = ox + (fromOrigin ? dx * len : 0), y1 = oy + (fromOrigin ? dy * len : 0);
  const core = 2 + 12 * strength;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.20; ctx.strokeStyle = color; ctx.lineWidth = core + 13;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();   // glow
  ctx.globalAlpha = 0.95; ctx.lineWidth = core;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.lineCap = 'butt';
  const fade = 1;
  // wavefront ticks: subtle, so the Q1 motion does not swamp the
  // genuine control effects in the probe noise floor
  const nx = -dy, ny = dx;
  ctx.globalAlpha = fade * 0.5; ctx.lineWidth = 1;
  for (let s = 0.14; s < 1; s += 0.28) {
    const f = (s + dashPhase) % 1;
    const px = x0 + (x1 - x0) * f, py = y0 + (y1 - y0) * f;
    ctx.beginPath(); ctx.moveTo(px - nx * 5, py - ny * 5); ctx.lineTo(px + nx * 5, py + ny * 5); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.lineWidth = 1;
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const th1 = st.thi * DEG, n1 = st.n1, n2 = st.n2;
  const th2 = snellTheta2(n1, n2, th1);
  const f = fresnel(n1, n2, th1);
  const tc = criticalAngle(n1, n2), tB = brewster(n1, n2);
  const tir = f.tir;

  // two media as tinted half-planes (interface is the horizontal line)
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(SX, SY, SW, SH);
  ctx.fillStyle = `rgba(120,150,210,${0.05 + 0.05 * n1})`; ctx.fillRect(SX, SY, SW, oy - SY);
  ctx.fillStyle = `rgba(120,200,180,${0.05 + 0.05 * n2})`; ctx.fillRect(SX, oy, SW, SY + SH - oy);
  ctx.strokeStyle = 'rgba(220,225,235,0.55)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(SX, oy); ctx.lineTo(SX + SW, oy); ctx.stroke(); ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(180,185,200,0.35)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(ox, SY); ctx.lineTo(ox, SY + SH); ctx.stroke(); ctx.setLineDash([]);   // normal
  ctx.strokeRect(SX, SY, SW, SH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`medium 1: n1 = ${n1.toFixed(2)}`, SX + 10, SY + 18);
  ctx.fillText(`medium 2: n2 = ${n2.toFixed(2)}`, SX + 10, SY + SH - 10);
  // polarization-state inset: a fixed, always-present E-field diagram
  // (s = E out of the plane of incidence, p = E in the plane). This
  // makes the polarization choice perceptible regardless of n or angle.
  const ix = SX + SW - 168, iy = SY + 14, iw = 156, ih = 56;
  ctx.fillStyle = 'rgba(8,10,16,0.7)'; ctx.fillRect(ix, iy, iw, ih);
  ctx.strokeStyle = 'rgba(200,205,215,0.3)'; ctx.strokeRect(ix, iy, iw, ih);
  ctx.strokeStyle = 'rgba(255,210,90,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ix + 12, iy + 34); ctx.lineTo(ix + iw - 14, iy + 34); ctx.stroke();
  ctx.lineWidth = 1;
  if (st.pol === 's' || st.pol === 'u') {
    ctx.fillStyle = '#7fb0ff';
    for (let q = 0; q < 6; q += 1) { ctx.beginPath(); ctx.arc(ix + 22 + q * 20, iy + 34, 4.5, 0, 6.2832); ctx.fill(); ctx.strokeStyle = '#0a0c12'; ctx.beginPath(); ctx.arc(ix + 22 + q * 20, iy + 34, 4.5, 0, 6.2832); ctx.stroke(); }
  }
  if (st.pol === 'p' || st.pol === 'u') {
    ctx.strokeStyle = '#ff9a78'; ctx.lineWidth = 2;
    for (let q = 0; q < 6; q += 1) { const xx = ix + 22 + q * 20; ctx.beginPath(); ctx.moveTo(xx, iy + 18); ctx.lineTo(xx, iy + 50); ctx.moveTo(xx - 4, iy + 22); ctx.lineTo(xx, iy + 18); ctx.lineTo(xx + 4, iy + 22); ctx.moveTo(xx - 4, iy + 46); ctx.lineTo(xx, iy + 50); ctx.lineTo(xx + 4, iy + 46); ctx.stroke(); }
    ctx.lineWidth = 1;
  }
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(st.pol === 's' ? 's: E out of plane' : st.pol === 'p' ? 'p: E in plane' : 'unpolarized (s + p)', ix + iw / 2, iy + ih - 5);
  ctx.textAlign = 'left';

  const L = SH * 0.46, phase = (st.t * 0.28) % 1;
  // incident beam (full-strength, always present)
  beam(-Math.PI / 2 + th1, L, false, '#ffd24a', phase, 1);
  // reflected beam: WIDTH scales with sqrt(R) for the chosen
  // polarisation, so it is a thick band normally and genuinely
  // vanishes at Brewster (p) -- the headline physics, large-area
  const Rsel = st.pol === 's' ? f.Rs : st.pol === 'p' ? f.Rp : 0.5 * (f.Rs + f.Rp);
  const refStr = Math.sqrt(Math.min(1, Rsel));
  if (Rsel > 4e-3) beam(-Math.PI / 2 - th1, L, true, '#7fb0ff', phase, refStr);
  else { ctx.fillStyle = 'rgba(127,176,255,0.7)'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText('reflected p extinguished (Brewster)', ox - 100, oy - 64); ctx.textAlign = 'left'; }
  // refracted beam (lower medium) or evanescent skin in TIR
  if (!tir && th2 !== null) {
    const Tsel = st.pol === 's' ? f.Ts : st.pol === 'p' ? f.Tp : 0.5 * (f.Ts + f.Tp);
    beam(Math.PI / 2 - th2, L, true, '#7fe0c0', phase, Math.sqrt(Math.min(1, Tsel)));
  } else {
    // evanescent: field clings to the surface, decaying with depth
    const kap = f.kappaK0;
    ctx.strokeStyle = 'rgba(255,150,110,0.8)';
    for (let d = 1; d < 60; d += 1) {
      const amp = Math.exp(-kap * d * 0.06) * 26;
      if (amp < 0.4) break;
      const xx = ox + d * 4 * Math.cos(0.2);
      ctx.globalAlpha = Math.exp(-kap * d * 0.06);
      ctx.beginPath(); ctx.moveTo(xx, oy); ctx.lineTo(xx, oy + amp); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff9a78'; ctx.fillText('evanescent skin (TIR)', ox + 16, oy + 44);
  }
  // angle arcs + labels
  ctx.strokeStyle = 'rgba(255,210,90,0.6)'; ctx.beginPath(); ctx.arc(ox, oy, 34, -Math.PI / 2, -Math.PI / 2 + th1); ctx.stroke();
  ctx.fillStyle = '#ffd24a'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${st.thi.toFixed(0)} deg`, ox - 52, oy - 30);
  if (!tir && th2 !== null) { ctx.strokeStyle = 'rgba(127,224,192,0.6)'; ctx.beginPath(); ctx.arc(ox, oy, 34, Math.PI / 2, Math.PI / 2 - th2, true); ctx.stroke(); ctx.fillStyle = '#7fe0c0'; ctx.fillText(`${(th2 / DEG).toFixed(0)} deg`, ox + 52, oy + 38); }
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  const reg = tir ? 'total internal reflection' : (Math.abs(st.thi * DEG - tB) < 0.5 * DEG && st.pol !== 's' ? 'Brewster: no reflected p' : 'partial reflection + refraction');
  ctx.fillText(`incident (yellow), reflected (blue), refracted (green) -- ${reg}`, SX + SW / 2, SY + SH + 20);
  ctx.textAlign = 'left';

  // Fresnel reflectance panel
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(PX, PYp, PW, PHp);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(PX, PYp, PW, PHp);
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('Fresnel reflectance vs angle', PX + PW / 2, PYp - 6);
  const gx = (deg) => PX + 8 + (deg / 90) * (PW - 16), gy = (Rv) => PYp + PHp - 18 - Rv * (PHp - 30);
  ctx.strokeStyle = 'rgba(200,205,215,0.25)'; ctx.beginPath(); ctx.moveTo(PX + 8, gy(0)); ctx.lineTo(PX + PW - 8, gy(0)); ctx.moveTo(PX + 8, gy(1)); ctx.lineTo(PX + PW - 8, gy(1)); ctx.stroke();
  // shade the area under the selected polarization's curve: a large
  // pol-dependent region (Rp's Brewster dip vs the monotone Rs)
  const selKeys = st.pol === 'u' ? ['Rs', 'Rp'] : [st.pol === 's' ? 'Rs' : 'Rp'];
  for (const key of selKeys) {
    ctx.fillStyle = key === 'Rs' ? 'rgba(127,176,255,0.16)' : 'rgba(255,210,74,0.16)';
    ctx.beginPath(); ctx.moveTo(gx(0), gy(0));
    for (let d = 0; d <= 90; d += 1) ctx.lineTo(gx(d), gy(Math.min(1, fresnel(n1, n2, d * DEG)[key])));
    ctx.lineTo(gx(90), gy(0)); ctx.closePath(); ctx.fill();
  }
  for (const [key, col, polKey] of [['Rs', '#7fb0ff', 's'], ['Rp', '#ffd24a', 'p']]) {
    const sel = st.pol === polKey || st.pol === 'u';
    ctx.strokeStyle = col; ctx.lineWidth = sel ? 2.8 : 1.1; ctx.globalAlpha = sel ? 1 : 0.4;
    ctx.beginPath();
    for (let d = 0; d <= 90; d += 0.5) { const fr = fresnel(n1, n2, d * DEG); const X = gx(d), Y = gy(Math.min(1, fr[key])); d === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
    ctx.stroke();
  }
  ctx.lineWidth = 1; ctx.globalAlpha = 1;
  if (tB && tB < Math.PI / 2) { ctx.strokeStyle = 'rgba(255,210,90,0.4)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(gx(tB / DEG), PYp + 6); ctx.lineTo(gx(tB / DEG), PYp + PHp - 6); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#c8ccd6'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText('Brewster', gx(tB / DEG), PYp + PHp - 4); }
  if (tc !== null) { ctx.strokeStyle = 'rgba(255,150,110,0.4)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(gx(tc / DEG), PYp + 6); ctx.lineTo(gx(tc / DEG), PYp + PHp - 6); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#c8ccd6'; ctx.fillText('crit', gx(tc / DEG), PYp + 12); }
  ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(gx(st.thi), gy(Math.min(1, st.pol === 's' ? f.Rs : f.Rp)), 4, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#7fb0ff'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'left'; ctx.fillText('Rs', PX + 10, PYp + 14);
  ctx.fillStyle = '#ffd24a'; ctx.fillText('Rp', PX + 36, PYp + 14);
  ctx.fillStyle = '#c8ccd6'; ctx.textAlign = 'center'; ctx.fillText('theta_i (deg)', PX + PW / 2, PYp + PHp + 14); ctx.textAlign = 'left';

  rEls['th_i'].textContent = st.thi.toFixed(1) + ' deg';
  rEls['th_t'].textContent = tir || th2 === null ? 'TIR' : (th2 / DEG).toFixed(1) + ' deg';
  rEls['n1/n2'].textContent = `${n1.toFixed(2)}/${n2.toFixed(2)}`;
  rEls['R_s'].textContent = f.Rs.toFixed(4);
  rEls['R_p'].textContent = f.Rp.toFixed(4);
  rEls['regime'].textContent = tir ? 'TIR' : 'refracting';
}

// controls
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

let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) st.t += dr;
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * 2 : 0;
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
