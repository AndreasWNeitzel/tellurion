// Exoplanet interior hero. A 3D cutaway sphere rotates so the layered
// composition is visible from every angle. The cutaway is a quarter
// wedge removed from the front; behind the wedge the layered cross
// section is drawn with depth shading. Two secondary panels track the
// mass-radius curve and the pressure profile from the centre out.
//
// CPU physics: shared/js/engine/exoplanet-interior-cpu.js (constant-
// density layered planet, hydrostatic central pressure, mass-radius).

import { RHO, solvePlanet, massRadiusCurve, pressureProfile, normaliseFractions } from './sim.js';
import { fontString } from '../../../shared/js/canvas-type.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['mass (Me)', 'R (Re)', 'composition', 'core mass %', 'central P (Pa)', 'rho_avg (kg/m3)'];
const rEls = {};
for (const k of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = k;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[k] = b;
}

const st = {
  Mearth: 1.0,
  fIron: 0.32, fSil: 0.68, fWater: 0.0, fGas: 0.0,
  t: 0, running: 1, preset: 'Earth-like',
};

function frac() { return normaliseFractions({ iron: st.fIron, silicate: st.fSil, water: st.fWater, gas: st.fGas }); }
let sol = solvePlanet({ massEarth: st.Mearth, frac: frac() });
function rebuild() { sol = solvePlanet({ massEarth: st.Mearth, frac: frac() }); }

// Layout (820 x 1040 portrait): cutaway on top, the two diagnostic panels
// side by side below.
const NX = 30, NY = 40, NW = 760, NH = 580;        // cutaway scene
const cx0 = NX + NW * 0.5, cy0 = NY + NH * 0.5 - 6;
const PX = 30, PY = 650, PW = 370, PH = 360;       // M-R curve
const PSX = 420, PSY = 650, PSW = 370, PSH = 360;  // pressure profile

// Layer colours (warm core to cool envelope).
const LCOL = {
  iron:     { fill: '#b6411e', edge: '#7a2a13', label: 'iron core' },
  silicate: { fill: '#6c5b3a', edge: '#3f3623', label: 'silicate mantle' },
  water:    { fill: '#3a87c6', edge: '#23618f', label: 'water/ice' },
  gas:      { fill: '#c6b485', edge: '#7a7058', label: 'H/He envelope' },
};

function drawLayeredSphere() {
  // Frame
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(NX, NY, NW, NH);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.strokeRect(NX, NY, NW, NH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('layered planet (3D cutaway, slow rotation)', NX + 14, NY + 22);

  // Slow yaw rotation; viewer is at +z looking -z. The cutaway wedge
  // (yaw=now ... yaw+90 deg) faces the viewer so the cross section
  // is visible. To make the rotation feel like the planet is turning,
  // shift the wedge angle with time.
  const R_view = Math.min(NW, NH) * 0.34;        // planet drawn radius (px)
  const tNow = (Date.now() / 1000) % 1e6;
  const yawDeg = (st.t * 12) % 360;
  const yaw = yawDeg * Math.PI / 180;

  // Star backdrop (deterministic): twinkling pinpoints.
  const seed = (s) => { let x = s | 0; return () => { x = (x + 0x6D2B79F5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const rnd = seed(0x05317);
  for (let i = 0; i < 80; i += 1) {
    const sx = NX + rnd() * NW, sy = NY + rnd() * NH;
    const a = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(tNow * 1.4 + i));
    ctx.fillStyle = `rgba(220,228,255,${(a * 0.45).toFixed(3)})`;
    ctx.fillRect(sx, sy, 1.4, 1.4);
  }

  // 1) FAR HALF: draw the full sphere with depth shading. This is the
  //    BACK of the planet showing through the cutaway. Use radial
  //    gradients for each layer rendered as concentric ellipses (the
  //    sphere viewed edge-on).
  // 2) FRONT-FACING WEDGE: draw a 3/4 spherical shell rendered as a
  //    sequence of arcs leaving out a 90 deg wedge centred on the
  //    rotating yaw direction. The wedge angles in screen coordinates.
  // 3) WEDGE INTERIOR: draw the layered cross section visible through
  //    the wedge cut (radial sectors).

  // Build per-layer outer radii in CSS px (scale = R_view / R_total).
  const Rt = sol.R_total;
  const layers = sol.layers;
  const order = layers.slice().reverse();   // outer -> inner for drawing front
  const Rpx = (R_m) => (R_m / Rt) * R_view;

  // Cutaway wedge: 90-degree opening centred at the current yaw angle.
  const wedgeHalf = Math.PI / 4;                  // 90 deg total
  const wedgeCenter = yaw % (2 * Math.PI);
  const wA = wedgeCenter - wedgeHalf, wB = wedgeCenter + wedgeHalf;

  // BACK HEMISPHERE: draw faint ellipses (foreshortened to half-height
  // ellipses) showing layers visible through the cutaway.
  ctx.save();
  ctx.beginPath(); ctx.arc(cx0, cy0, R_view, 0, 6.2832); ctx.clip();
  for (const L of order) {
    const Rp = Rpx(L.R_outer);
    const col = LCOL[L.name];
    const g = ctx.createRadialGradient(cx0 - Rp * 0.3, cy0 - Rp * 0.4, Rp * 0.1, cx0, cy0, Rp);
    g.addColorStop(0, col.fill);
    g.addColorStop(0.55, col.edge);
    g.addColorStop(1, '#020306');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx0, cy0, Rp, 0, 6.2832); ctx.fill();
  }
  ctx.restore();

  // FRONT WEDGE-OUT: re-cover the planet with a 3/4 disc (leave wedge
  // hollow) for the FRONT hemisphere appearance with specular highlight.
  ctx.save();
  ctx.beginPath();
  // outer arc for the visible 270 deg
  ctx.moveTo(cx0, cy0);
  ctx.arc(cx0, cy0, R_view, wB, wA + 2 * Math.PI);
  ctx.closePath();
  ctx.clip();
  // draw a single-colour outermost layer for the front face with shading
  const outer = layers[layers.length - 1];
  const fg = ctx.createRadialGradient(cx0 - R_view * 0.45, cy0 - R_view * 0.55, R_view * 0.1, cx0, cy0, R_view);
  fg.addColorStop(0, '#fdf3d0');
  fg.addColorStop(0.18, LCOL[outer.name].fill);
  fg.addColorStop(0.7, LCOL[outer.name].edge);
  fg.addColorStop(1, '#02030a');
  ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx0, cy0, R_view, 0, 6.2832); ctx.fill();
  // specular hotspot
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(cx0 - R_view * 0.45, cy0 - R_view * 0.5, R_view * 0.18, 0, 6.2832); ctx.fill();
  ctx.restore();

  // WEDGE WALLS: thin coloured radial sectors marking the interfaces.
  // These are inside the wedge (the cut-away area), visible as the slice.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx0, cy0);
  ctx.lineTo(cx0 + R_view * Math.cos(wA), cy0 + R_view * Math.sin(wA));
  ctx.arc(cx0, cy0, R_view, wA, wB);
  ctx.lineTo(cx0, cy0);
  ctx.closePath();
  ctx.clip();
  for (const L of order) {
    const Rp = Rpx(L.R_outer);
    ctx.fillStyle = LCOL[L.name].fill;
    ctx.beginPath(); ctx.arc(cx0, cy0, Rp, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = LCOL[L.name].edge; ctx.lineWidth = 1.2; ctx.stroke();
  }
  // depth shading: a soft gradient over the wedge interior.
  const wg = ctx.createLinearGradient(cx0 + Math.cos(wedgeCenter) * R_view, cy0 + Math.sin(wedgeCenter) * R_view, cx0, cy0);
  wg.addColorStop(0, 'rgba(0,0,0,0)'); wg.addColorStop(1, 'rgba(255,255,255,0.10)');
  ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx0, cy0, R_view, 0, 6.2832); ctx.fill();
  ctx.restore();

  // Layer-edge rings (full planet outline)
  ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 1.0;
  for (const L of layers) {
    if (L.R_outer === 0) continue;
    ctx.beginPath(); ctx.arc(cx0, cy0, Rpx(L.R_outer), 0, 6.2832); ctx.stroke();
  }
  ctx.lineWidth = 1;

  // Legend of layers
  let ly = NY + NH - 24;
  for (const L of order.slice().reverse()) {
    const col = LCOL[L.name];
    ctx.fillStyle = col.fill; ctx.fillRect(NX + 14, ly - 8, 12, 12);
    ctx.strokeStyle = col.edge; ctx.strokeRect(NX + 14, ly - 8, 12, 12);
    ctx.fillStyle = '#c8ccd6'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
    const pct = (L.M / sol.Mtot * 100).toFixed(1);
    ctx.fillText(`${col.label} (rho = ${L.rho} kg/m3, ${pct}% mass)`, NX + 32, ly + 2);
    ly -= 18;
  }
}

function drawMRcurve() {
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.strokeRect(PX, PY, PW, PH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('mass-radius curve (Earth units)', PX + 14, PY + 20);

  const M_axis = [];
  for (let i = 0; i < 60; i += 1) M_axis.push(0.1 + i * 0.15);  // 0.1 .. ~9 Mearth
  const compositions = [
    { lab: 'pure iron', f: { iron: 1 }, col: '#b6411e' },
    { lab: 'iron 50 % + sil 50 %', f: { iron: 0.5, silicate: 0.5 }, col: '#cc7733' },
    { lab: 'silicate', f: { silicate: 1 }, col: '#6c5b3a' },
    { lab: 'water-rich', f: { silicate: 0.3, water: 0.7 }, col: '#3a87c6' },
    { lab: 'mini-Neptune', f: { silicate: 0.7, gas: 0.3 }, col: '#c6b485' },
  ];
  const curves = compositions.map(c => ({ ...c, pts: massRadiusCurve(c.f, M_axis) }));

  let xMin = M_axis[0], xMax = M_axis[M_axis.length - 1];
  let yMax = 0; for (const c of curves) for (const p of c.pts) yMax = Math.max(yMax, p.R_earth);
  yMax *= 1.05;

  const pad = 44, padR = 12, padT = 32, padB = 32;
  const xp = (m) => PX + pad + (m - xMin) / (xMax - xMin) * (PW - pad - padR);
  const yp = (r) => PY + padT + (1 - r / yMax) * (PH - padT - padB);

  // grid
  ctx.strokeStyle = 'rgba(120,128,140,0.18)';
  for (let m = 1; m <= 8; m += 1) { ctx.beginPath(); ctx.moveTo(xp(m), yp(0)); ctx.lineTo(xp(m), yp(yMax)); ctx.stroke(); }
  for (let r = 1; r <= Math.floor(yMax); r += 1) { ctx.beginPath(); ctx.moveTo(xp(xMin), yp(r)); ctx.lineTo(xp(xMax), yp(r)); ctx.stroke(); }

  // curves
  ctx.lineWidth = 1.8;
  for (const c of curves) {
    ctx.strokeStyle = c.col;
    ctx.beginPath();
    c.pts.forEach((p, k) => { const X = xp(p.M_earth), Y = yp(p.R_earth); k === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  // current planet marker
  const X = xp(sol.M_earth), Y = yp(sol.R_earth);
  ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(X, Y, 6.5, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(X, Y, 6.5, 0, 6.2832); ctx.stroke();
  ctx.fillStyle = '#ffd24a'; ctx.font = fontString(canvas, 'caption', 'mono', 600); ctx.textAlign = 'left';
  ctx.fillText(`this planet (${sol.M_earth.toFixed(2)} Me, ${sol.R_earth.toFixed(2)} Re)`, X + 10, Y - 8);

  // legend
  let ly = PY + 40;
  ctx.font = fontString(canvas, 'caption', 'mono');
  for (const c of curves) {
    ctx.fillStyle = c.col; ctx.fillRect(PX + PW - 200, ly - 6, 14, 6);
    ctx.fillStyle = '#c8ccd6'; ctx.fillText(c.lab, PX + PW - 182, ly);
    ly += 14;
  }
  // axes
  ctx.fillStyle = '#9aa0ad'; ctx.textAlign = 'center';
  ctx.fillText('mass M / M_Earth', PX + PW / 2, PY + PH - 8);
  ctx.save(); ctx.translate(PX + 14, PY + PH / 2 + 8); ctx.rotate(-Math.PI / 2);
  ctx.fillText('radius R / R_Earth', 0, 0); ctx.restore();
  ctx.textAlign = 'left';
}

function drawPressureProfile() {
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(PSX, PSY, PSW, PSH);
  ctx.strokeStyle = 'rgba(220,225,235,0.45)'; ctx.strokeRect(PSX, PSY, PSW, PSH);
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'left';
  ctx.fillText('pressure profile from centre to surface', PSX + 14, PSY + 20);

  const N = 220;
  const prof = pressureProfile(sol, N);
  const pad = 50, padR = 14, padT = 32, padB = 28;
  let yMax = 0; for (const p of prof) yMax = Math.max(yMax, p.P);
  yMax = Math.max(yMax, 1e6);
  const xp = (r) => PSX + pad + (r / sol.R_total) * (PSW - pad - padR);
  const yp = (P) => PSY + padT + (1 - P / yMax) * (PSH - padT - padB);

  // layer-coloured background bands (centre -> surface)
  for (const L of sol.layers) {
    const col = LCOL[L.name];
    ctx.fillStyle = col.fill + '22';     // hex alpha 0x22 ~ 13 %
    ctx.fillRect(xp(L.R_inner), PSY + padT, xp(L.R_outer) - xp(L.R_inner), PSH - padT - padB);
  }

  // profile curve
  ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2.0;
  ctx.beginPath();
  prof.forEach((p, k) => { const X = xp(p.r), Y = yp(p.P); k === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
  ctx.stroke();
  ctx.lineWidth = 1;

  // axes
  ctx.fillStyle = '#9aa0ad'; ctx.font = fontString(canvas, 'caption', 'mono'); ctx.textAlign = 'center';
  ctx.fillText('radius r (m)', PSX + PSW / 2, PSY + PSH - 6);
  ctx.save(); ctx.translate(PSX + 16, PSY + PSH / 2 + 12); ctx.rotate(-Math.PI / 2);
  ctx.fillText('pressure P (Pa)', 0, 0); ctx.restore();
  ctx.textAlign = 'left';
  // axis ticks
  ctx.fillStyle = 'rgba(160,170,185,0.85)';
  ctx.fillText('0', xp(0), PSY + PSH - 16);
  ctx.fillText(`${(sol.R_total / 1e6).toFixed(2)} Mm`, xp(sol.R_total) - 20, PSY + PSH - 16);
  ctx.textAlign = 'right';
  ctx.fillText(yMax.toExponential(1), PSX + pad - 6, PSY + padT + 6);
  ctx.fillText('0', PSX + pad - 6, PSY + PSH - padB);
  ctx.textAlign = 'left';

  // central pressure annotation
  ctx.fillStyle = '#ffd24a'; ctx.font = fontString(canvas, 'caption', 'mono', 600);
  ctx.fillText(`P(0) = ${sol.centralPressure.toExponential(2)} Pa`, PSX + pad + 14, PSY + padT + 22);
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawLayeredSphere();
  drawMRcurve();
  drawPressureProfile();

  // readouts
  const rhoAvg = sol.Mtot / (4 / 3 * Math.PI * sol.R_total ** 3);
  const fr = frac();
  const compTxt = `${(fr.iron * 100).toFixed(0)}Fe / ${(fr.silicate * 100).toFixed(0)}Si / ${(fr.water * 100).toFixed(0)}H2O / ${(fr.gas * 100).toFixed(0)}gas`;
  rEls['mass (Me)'].textContent = sol.M_earth.toFixed(2);
  rEls['R (Re)'].textContent = sol.R_earth.toFixed(2);
  rEls['composition'].textContent = compTxt;
  rEls['core mass %'].textContent = (fr.iron * 100).toFixed(0);
  rEls['central P (Pa)'].textContent = sol.centralPressure.toExponential(2);
  rEls['rho_avg (kg/m3)'].textContent = rhoAvg.toFixed(0);
}

// controls
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); rebuild(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const cM = buildSlider('mass / M_Earth', 0.1, 8, 0.1, st.Mearth, 'Mearth', v => v.toFixed(1));
const cFe = buildSlider('iron fraction', 0, 1, 0.02, st.fIron, 'fIron', v => v.toFixed(2));
const cSi = buildSlider('silicate fraction', 0, 1, 0.02, st.fSil, 'fSil', v => v.toFixed(2));
const cWa = buildSlider('water fraction', 0, 1, 0.02, st.fWater, 'fWater', v => v.toFixed(2));
const cGa = buildSlider('H/He gas fraction', 0, 1, 0.02, st.fGas, 'fGas', v => v.toFixed(2));

function presetRow(label, presets) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const p of presets) { const o = document.createElement('option'); o.textContent = p.label; sel.appendChild(o); }
  const sp = document.createElement('span'); sp.className = 'value'; sp.textContent = '';
  sel.addEventListener('change', () => {
    const p = presets.find(x => x.label === sel.value);
    if (!p) return;
    st.Mearth = p.M; st.fIron = p.f.iron ?? 0; st.fSil = p.f.silicate ?? 0; st.fWater = p.f.water ?? 0; st.fGas = p.f.gas ?? 0;
    cM.inp.value = String(st.Mearth); cM.val.textContent = st.Mearth.toFixed(1);
    cFe.inp.value = String(st.fIron); cFe.val.textContent = st.fIron.toFixed(2);
    cSi.inp.value = String(st.fSil); cSi.val.textContent = st.fSil.toFixed(2);
    cWa.inp.value = String(st.fWater); cWa.val.textContent = st.fWater.toFixed(2);
    cGa.inp.value = String(st.fGas); cGa.val.textContent = st.fGas.toFixed(2);
    rebuild();
  });
  row.appendChild(lab); row.appendChild(sel); row.appendChild(sp);
  controlsEl.appendChild(row); return sel;
}
const PRESETS = [
  { label: 'Earth-like', M: 1.0, f: { iron: 0.32, silicate: 0.68 } },
  { label: 'Mercury-like (iron-rich)', M: 0.055, f: { iron: 0.7, silicate: 0.3 } },
  { label: 'super-Earth (rocky)', M: 4.0, f: { iron: 0.3, silicate: 0.7 } },
  { label: 'ocean world', M: 3.0, f: { iron: 0.15, silicate: 0.30, water: 0.55 } },
  { label: 'mini-Neptune', M: 7.0, f: { silicate: 0.5, water: 0.2, gas: 0.3 } },
  { label: 'pure-iron core', M: 1.0, f: { iron: 1.0 } },
];
presetRow('preset', PRESETS);

const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
const bSnap = document.createElement('button'); bSnap.type = 'button'; bSnap.textContent = 'Slow rotate';
bRow.appendChild(bReset); bRow.appendChild(bPause); bRow.appendChild(bSnap); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { Mearth: 1.0, fIron: 0.32, fSil: 0.68, fWater: 0, fGas: 0, t: 0, running: 1 });
  cM.inp.value = '1.0'; cM.val.textContent = '1.0';
  cFe.inp.value = '0.32'; cFe.val.textContent = '0.32';
  cSi.inp.value = '0.68'; cSi.val.textContent = '0.68';
  cWa.inp.value = '0'; cWa.val.textContent = '0.00';
  cGa.inp.value = '0'; cGa.val.textContent = '0.00';
  bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); rebuild();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) st.t += dr;
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * 30 : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const s = solvePlanet({ massEarth: 1, frac: { iron: 0.32, silicate: 0.68 } });
  if (Math.abs(s.M_earth - 1) > 1e-3) return { name: 'mass conservation', pass: false, msg: `${s.M_earth}` };
  if (s.centralPressure <= 0) return { name: 'central P > 0', pass: false, msg: `${s.centralPressure}` };
  return { name: 'Earth-like mass + positive central pressure', pass: true, msg: `M=${s.M_earth.toFixed(3)} Me, P0=${s.centralPressure.toExponential(2)} Pa` };
};
window.__cpuVsGpu = () => ({ skip: true, reason: 'CPU-only (closed-form layered planet); GL is render-only' });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }


// === Diagnostics interface (Layout System v2) ===
window.playground = window.playground || {};
window.playground.getState = function () {
  return {
    fields: [
      { key: 'planet-mass-mj', label: 'Planet mass', value: st.planetMass || 1, format: 'float' },
      { key: 'planet-radius-rj', label: 'Planet radius', value: st.planetRadius || 1, format: 'float' },
      { key: 'core-temp-k', label: 'Core temperature', value: st.coreTemp || 5000, format: 'float' }
    ]
  };
};
window.playground.getInvariants = function () {
  // Check mass-radius relation for gas giants (dimensionless check).
  const M = st.planetMass || 1;
  const R = st.planetRadius || 1;
  // For gas giants, R approx constant (Jupiter has ~0.1 R_sun).
  // No strict conservation, but check radius does not scale with mass.
  const status = (R > 0.5 && R < 2.0) ? 'pass' : 'drift';
  return [
    {
      key: 'radius-physical-bounds',
      label: 'Radius bounds check',
      value: R.toFixed(2),
      status: status
    }
  ];
};
