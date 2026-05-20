// Dipole radiation in 3D. The primary scene is the physical radiation
// pattern: the sin^2(theta) toroidal "donut" surface of an oscillating
// dipole (or the half-wave antenna lobes), rendered as a rotating
// projected mesh with the pulsing source and outgoing wavefronts. The
// side panel is the polar angular pattern with the Larmor power and
// directivity. Numerics in sim.js. Reference: Jackson, Classical
// Electrodynamics (3rd ed.), Ch. 9.

import { dipolePattern, antennaPattern, totalPowerE, totalPowerM, directivity, C } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['source', 'f (MHz)', 'p0/m0', 'P (W)', 'directivity', 'lambda (m)'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const st = { source: 'electric', fMHz: 100, moment: 1.0, t: 0, running: 1 };
function patternFn() { return st.source === 'antenna' ? antennaPattern : dipolePattern; }
function omega() { return 2 * Math.PI * st.fMHz * 1e6; }
function powerW() {
  const w = omega();
  if (st.source === 'magnetic') return totalPowerM(st.moment * 1e-3, w);
  return totalPowerE(st.moment * 1e-9, w);                    // p0 in nC m
}

// geometry
const SX = 30, SY = 50, SW = 540, SH = 470;                   // 3D scene
const cx3 = SX + SW / 2, cy3 = SY + SH / 2;
const PX = 596, PW = 280, PYp = 196, PHp = 250;               // polar panel

// rotate (x,y,z) by yaw (about z) then pitch (about x), project ortho
function project(x, y, z, yaw, pitch, scale) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  let X = x * cy - y * sy, Y = x * sy + y * cy, Z = z;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const Y2 = Y * cp - Z * sp, Z2 = Y * sp + Z * cp;
  return [cx3 + X * scale, cy3 - Z2 * scale, Y2];              // returns [sx, sy, depth]
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(SX, SY, SW, SH);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(SX, SY, SW, SH);
  // The pattern is a surface of revolution about z, so spinning it
  // about z (yaw) is invisible. Tumbling it (pitch sweep) is what
  // makes the toroidal 3D structure read: the donut rocks from
  // near-edge-on to near-face-on. yaw is kept for subtle parallax.
  const pat = patternFn(), yaw = st.t * 0.22, pitch = -0.95 + 0.66 * Math.sin(st.t * 0.31), scale = 168;

  // radiation-pattern surface of revolution: radius = pattern(theta)
  const NT = 56, NP = 52, faces = [];
  for (let i = 0; i < NT; i += 1) {
    const th0 = Math.PI * i / NT, th1 = Math.PI * (i + 1) / NT;
    for (let j = 0; j < NP; j += 1) {
      const p0 = 2 * Math.PI * j / NP, p1 = 2 * Math.PI * (j + 1) / NP;
      const verts = [[th0, p0], [th1, p0], [th1, p1], [th0, p1]].map(([th, ph]) => {
        const rr = pat(th);
        return project(rr * Math.sin(th) * Math.cos(ph), rr * Math.sin(th) * Math.sin(ph), rr * Math.cos(th), yaw, pitch, scale);
      });
      const dep = (verts[0][2] + verts[1][2] + verts[2][2] + verts[3][2]) / 4;
      const shade = pat((th0 + th1) / 2);
      faces.push({ verts, dep, shade });
    }
  }
  faces.sort((a, b) => a.dep - b.dep);                         // painter's order
  const intensA = 0.52 + 0.34 * Math.min(1, st.moment / 2);     // radiated intensity ~ p0^2
  const dmin = faces.length ? faces[0].dep : 0;
  const dmax = faces.length ? faces[faces.length - 1].dep : 1;
  const drange = (dmax - dmin) || 1;
  ctx.lineJoin = 'round';
  for (const f of faces) {
    const c = f.shade;                                          // sin^2(theta) intensity 0..1
    const nd = (f.dep - dmin) / drange;                          // 0 far .. 1 near
    const lit = 0.55 + 0.45 * nd;                                // nearer faces brighter
    const R = Math.round((70 + 185 * c) * lit);
    const G = Math.round((110 + 110 * c) * lit);
    const B = Math.round((235 - 70 * c) * lit);
    ctx.fillStyle = `rgba(${R},${G},${B},${intensA})`;
    ctx.strokeStyle = `rgba(150,205,255,${0.05 + 0.10 * c})`;     // hairline, not a wire cage
    ctx.beginPath(); ctx.moveTo(f.verts[0][0], f.verts[0][1]);
    for (let k = 1; k < 4; k += 1) ctx.lineTo(f.verts[k][0], f.verts[k][1]);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // additive bloom along the high-intensity equator so the lobe reads
  // as luminous radiated power, not a mesh.
  ctx.globalCompositeOperation = 'lighter';
  for (const f of faces) {
    if (f.shade < 0.6) continue;
    const nd = (f.dep - dmin) / drange; if (nd < 0.5) continue;   // front equatorial band
    ctx.fillStyle = `rgba(120,190,255,${0.05 * f.shade})`;
    ctx.beginPath(); ctx.moveTo(f.verts[0][0], f.verts[0][1]);
    for (let k = 1; k < 4; k += 1) ctx.lineTo(f.verts[k][0], f.verts[k][1]);
    ctx.closePath(); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // E-field polarization texture on the surface: meridional (theta-hat)
  // for an electric dipole / antenna, azimuthal (phi-hat) for a
  // magnetic dipole. This is the real distinction between E and M
  // radiation of the same sin^2 pattern.
  const azim = st.source === 'magnetic';
  ctx.strokeStyle = 'rgba(255,225,140,0.55)'; ctx.lineWidth = 1.2;
  for (let i = 1; i < NT; i += 3) {
    const th = Math.PI * i / NT, rr = pat(th); if (rr < 0.05) continue;
    for (let j = 0; j < NP; j += 3) {
      const ph = 2 * Math.PI * j / NP, e = 0.13;
      const th2 = azim ? th : th + e, ph2 = azim ? ph + e * 1.6 : ph;
      const a = project(rr * Math.sin(th) * Math.cos(ph), rr * Math.sin(th) * Math.sin(ph), rr * Math.cos(th), yaw, pitch, scale);
      const r2 = pat(th2);
      const b = project(r2 * Math.sin(th2) * Math.cos(ph2), r2 * Math.sin(th2) * Math.sin(ph2), r2 * Math.cos(th2), yaw, pitch, scale);
      if (a[2] < 0) continue;                                   // front-facing only
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }
  ctx.lineWidth = 1;
  // dipole axis + oscillating source at the centre
  const axTop = project(0, 0, 1.25, yaw, pitch, scale), axBot = project(0, 0, -1.25, yaw, pitch, scale);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(axTop[0], axTop[1]); ctx.lineTo(axBot[0], axBot[1]); ctx.stroke(); ctx.setLineDash([]);
  const osc = Math.sin(st.t * 6);
  const qAmp = (0.07 + 0.16 * st.moment) * (1 + 0.5 * osc);    // p0 = charge x separation
  const qp = project(0, 0, qAmp, yaw, pitch, scale);
  const qm = project(0, 0, -qAmp, yaw, pitch, scale);
  ctx.fillStyle = osc >= 0 ? '#ff6a5d' : '#7fb0ff';
  ctx.beginPath(); ctx.arc(qp[0], qp[1], 6, 0, 6.2832); ctx.fill();
  ctx.fillStyle = osc >= 0 ? '#7fb0ff' : '#ff6a5d';
  ctx.beginPath(); ctx.arc(qm[0], qm[1], 6, 0, 6.2832); ctx.fill();
  // outgoing wavefronts: spacing tracks the wavelength lambda = c/f,
  // so higher frequency packs visibly more rings (a strong, physical
  // frequency cue beyond the scale-free pattern shape)
  const ringPx = (frac) => 24 + frac * (Math.min(SW, SH) * 0.52);
  const nRings = Math.max(2, Math.min(16, Math.round(st.fMHz / 22)));
  ctx.globalCompositeOperation = 'lighter';
  for (let w = 0; w < nRings; w += 1) {
    const fr = ((st.t * 0.45 + w / nRings) % 1);
    ctx.strokeStyle = `rgba(140,210,255,${0.62 * (1 - fr)})`; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let a = 0; a <= 48; a += 1) {
      const th = Math.PI * a / 48, amp = 0.35 + 0.65 * pat(th), R = ringPx(fr) * amp;
      const pp = project(R / scale * Math.sin(th), 0, R / scale * Math.cos(th), yaw, pitch, scale);
      if (a === 0) ctx.moveTo(pp[0], pp[1]); else ctx.lineTo(pp[0], pp[1]);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${st.source === 'antenna' ? 'half-wave antenna' : st.source + ' dipole'} radiation pattern (rotating)`, SX + SW / 2, SY + SH + 20);
  ctx.textAlign = 'left';

  // polar pattern panel
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(PX, PYp, PW, PHp);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(PX, PYp, PW, PHp);
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('angular pattern (axis vertical)', PX + PW / 2, PYp - 6);
  const pcx = PX + PW / 2, pcy = PYp + PHp / 2, pr = Math.min(PW, PHp) * 0.4;
  ctx.strokeStyle = 'rgba(150,160,180,0.3)';
  ctx.beginPath(); ctx.moveTo(pcx, pcy - pr - 6); ctx.lineTo(pcx, pcy + pr + 6); ctx.stroke();   // dipole axis
  ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let a = 0; a <= 180; a += 1) {
    const th = Math.PI * a / 180, rr = pat(th) * pr;
    // theta from +z axis (up); right lobe
    const X = pcx + rr * Math.sin(th), Y = pcy - rr * Math.cos(th);
    a === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
  }
  for (let a = 180; a >= 0; a -= 1) { const th = Math.PI * a / 180, rr = pat(th) * pr; ctx.lineTo(pcx - rr * Math.sin(th), pcy - rr * Math.cos(th)); }
  ctx.closePath(); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#c8ccd6'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('theta = 0 (null)', pcx, pcy - pr - 12);
  ctx.fillText('theta = 90 (max)', pcx + pr + 2, pcy + 4);

  const P = powerW(), D = directivity(pat), lamM = C / (st.fMHz * 1e6);
  rEls['source'].textContent = st.source;
  rEls['f (MHz)'].textContent = st.fMHz.toFixed(0);
  rEls['p0/m0'].textContent = st.moment.toFixed(2);
  rEls['P (W)'].textContent = P.toExponential(2);
  rEls['directivity'].textContent = D.toFixed(3);
  rEls['lambda (m)'].textContent = lamM.toFixed(3);
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
const srRow = document.createElement('div'); srRow.className = 'row';
const srLab = document.createElement('span'); srLab.className = 'label'; srLab.textContent = 'source';
const srSel = document.createElement('select'); srSel.setAttribute('aria-label', 'source type');
for (const [v, t] of [['electric', 'electric dipole'], ['magnetic', 'magnetic dipole'], ['antenna', 'half-wave antenna']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; srSel.appendChild(o); }
srSel.value = st.source;
srSel.addEventListener('change', () => { st.source = srSel.value; render(); });
srRow.appendChild(srLab); srRow.appendChild(srSel); const sp = document.createElement('span'); sp.className = 'value'; srRow.appendChild(sp);
controlsEl.appendChild(srRow);
const cF = buildSlider('frequency (MHz)', 20, 400, 5, st.fMHz, 'fMHz', v => v.toFixed(0));
const cM = buildSlider('moment p0/m0', 0.3, 3, 0.1, st.moment, 'moment', v => v.toFixed(1));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { source: 'electric', fMHz: 100, moment: 1.0, t: 0, running: 1 });
  srSel.value = 'electric'; cF.inp.value = '100'; cF.val.textContent = '100'; cM.inp.value = '1'; cM.val.textContent = '1.0';
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
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * 12.566 : 0;             // one full rotation cycle
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  if (Math.abs(dipolePattern(Math.PI / 2) - 1) > 1e-12 || dipolePattern(0) > 1e-12) return { name: 'sin^2 pattern', pass: false, msg: 'shape wrong' };
  const r = totalPowerE(1e-9, 2 * 1e8) / totalPowerE(1e-9, 1e8);
  if (Math.abs(r - 16) > 1e-6) return { name: 'omega^4', pass: false, msg: `ratio ${r}` };
  const D = directivity(dipolePattern);
  if (Math.abs(D - 1.5) > 5e-3) return { name: 'directivity', pass: false, msg: `D=${D}` };
  return { name: 'sin^2 pattern, omega^4 power, D=3/2', pass: true, msg: 'Jackson Ch. 9 dipole radiation' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
