// Radioactive decay chain. The primary scene is the physical nucleus
// (protons red, neutrons blue) shedding alpha clusters and beta
// particles as it walks a decay series; the side panel is the Segre
// chart (N horizontal, Z vertical) with the chain path and a panel of
// the current isotope, decay mode, Q value and Geiger-Nuttall
// half-life. Numerics in sim.js. Reference: Krane, Introductory
// Nuclear Physics, Ch. 3, 6-8.

import { chainOf, qValue, log10HalfLifeAlpha, ELEMENT } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['series', 'isotope', 'mode', 'Q (MeV)', 'log10 t', 'step'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const st = { series: 'uranium', step: 0, auto: 1, t: 0, running: 1 };
let path = chainOf(st.series);
function rebuild() { path = chainOf(st.series); st.step = Math.min(st.step, path.length - 1); }
rebuild();

// deterministic per-nucleon offsets so the cluster is stable
function nucleonLayout(n) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const r = Math.sqrt(i + 0.5), a = i * 2.399963;            // sunflower packing
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return pts;
}

// geometry
const NX = 40, NY = 70, NR = 250;                              // nucleus area centre box
const cx = NX + NR, cy = NY + NR / 2 + 40;
const CHX = 556, CHY = 190, CHW = 326, CHH = 356;              // Segre chart (below the HUD)

function isoLabel(node) { return `${ELEMENT[node.Z] || 'Z' + node.Z}-${node.Z + node.N}`; }

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  st.step = Math.max(0, Math.min(st.step, path.length - 1));     // guard stale slider range
  const node = path[st.step], A = node.Z + node.N;
  const phase = (st.t % 1.4) / 1.4;                              // emission animation 0..1

  // nucleus area
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(NX, NY, 2 * NR, 2 * NR - 80);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(NX, NY, 2 * NR, 2 * NR - 80);
  const lay = nucleonLayout(A), scale = Math.min(7.2, 150 / Math.sqrt(A));
  // protons first (red), neutrons (blue); count Z protons
  for (let i = 0; i < A; i += 1) {
    // distribute Z protons evenly through the cluster (not a core)
    const isP = Math.floor((i + 1) * node.Z / A) !== Math.floor(i * node.Z / A);
    ctx.fillStyle = isP ? 'rgba(255,120,110,0.92)' : 'rgba(120,170,255,0.88)';
    ctx.beginPath(); ctx.arc(cx + lay[i][0] * scale, cy + lay[i][1] * scale, scale * 0.62, 0, 6.2832); ctx.fill();
  }
  // emitted particle for the decay that PRODUCED this node
  if (st.step > 0) {
    const m = node.mode, ej = 90 + phase * 150, ang = -0.5;
    const ex = cx + Math.cos(ang) * ej, ey = cy + Math.sin(ang) * ej;
    if (m === 'alpha') {
      ctx.fillStyle = '#ffd24a';
      for (const [dx, dy] of [[-5, -5], [6, -4], [-4, 6], [6, 6]]) { ctx.beginPath(); ctx.arc(ex + dx, ey + dy, 5, 0, 6.2832); ctx.fill(); }
      ctx.fillStyle = '#c8ccd6'; ctx.font = '12px ui-monospace, monospace'; ctx.fillText('alpha (He-4)', ex - 6, ey - 16);
    } else if (m === 'beta-minus' || m === 'beta-plus') {
      ctx.strokeStyle = '#7fd6ff'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = '#7fd6ff'; ctx.beginPath(); ctx.arc(ex, ey, 4, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#c8ccd6'; ctx.font = '12px ui-monospace, monospace'; ctx.fillText(m === 'beta-minus' ? 'beta- (e-, nu)' : 'beta+ (e+, nu)', ex - 6, ey - 14);
    }
  }
  ctx.fillStyle = '#e8ecf4'; ctx.font = '15px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${isoLabel(node)}   (Z=${node.Z}, N=${node.N})`, cx, NY + 2 * NR - 100);
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('protons (red) + neutrons (blue); the nucleus transmutes each decay', cx, NY + 2 * NR - 64);
  ctx.textAlign = 'left';

  // Segre chart: N (x) vs Z (y), with the chain path
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(CHX, CHY, CHW, CHH);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(CHX, CHY, CHW, CHH);
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('Segre chart: decay path (N right, Z up)', CHX + CHW / 2, CHY - 6);
  let nMin = 1e9, nMax = -1e9, zMin = 1e9, zMax = -1e9;
  for (const p of path) { nMin = Math.min(nMin, p.N); nMax = Math.max(nMax, p.N); zMin = Math.min(zMin, p.Z); zMax = Math.max(zMax, p.Z); }
  const pad = 18;
  const gx = (N) => CHX + pad + ((N - nMin) / Math.max(1, nMax - nMin)) * (CHW - 2 * pad);
  const gy = (Z) => CHY + CHH - pad - ((Z - zMin) / Math.max(1, zMax - zMin)) * (CHH - 2 * pad);
  ctx.strokeStyle = 'rgba(180,190,210,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
  path.forEach((p, k) => { const X = gx(p.N), Y = gy(p.Z); k === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); });
  ctx.stroke(); ctx.lineWidth = 1;
  for (let k = 0; k < path.length; k += 1) {
    const p = path[k], done = k <= st.step;
    ctx.fillStyle = k === st.step ? '#ffd24a' : done ? 'rgba(255,120,110,0.8)' : 'rgba(140,150,170,0.5)';
    ctx.beginPath(); ctx.arc(gx(p.N), gy(p.Z), k === st.step ? 6 : 4, 0, 6.2832); ctx.fill();
  }
  const last = path[path.length - 1];
  ctx.fillStyle = '#7fd6ff'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`stable ${isoLabel(last)}`, gx(last.N), gy(last.Z) + 18);
  ctx.fillText(isoLabel(path[0]), gx(path[0].N), gy(path[0].Z) - 12);
  ctx.fillStyle = '#c8ccd6'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('N', CHX + CHW - 10, CHY + CHH + 13); ctx.fillText('Z', CHX + 6, CHY + 12);
  ctx.textAlign = 'left';

  const m = node.mode === 'start' ? '-' : node.mode;
  const Q = node.mode === 'start' ? 0 : qValue(node.mode, path[st.step - 1].Z, path[st.step - 1].N);
  rEls['series'].textContent = st.series;
  rEls['isotope'].textContent = isoLabel(node);
  rEls['mode'].textContent = m;
  rEls['Q (MeV)'].textContent = node.mode === 'start' ? '-' : Q.toFixed(2);
  rEls['log10 t'].textContent = node.mode === 'alpha' ? log10HalfLifeAlpha(path[st.step - 1].Z, path[st.step - 1].N).toFixed(1) : '-';
  rEls['step'].textContent = `${st.step}/${path.length - 1}`;
}

// controls
function buildSelect(label, opts, key, after) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const sel = document.createElement('select'); sel.setAttribute('aria-label', label);
  for (const [v, t] of opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
  sel.value = String(st[key]);
  sel.addEventListener('change', () => { st[key] = isNaN(+sel.value) ? sel.value : +sel.value; if (after) after(); render(); });
  const sp = document.createElement('span'); sp.className = 'value';
  row.appendChild(lab); row.appendChild(sel); row.appendChild(sp);
  controlsEl.appendChild(row); return sel;
}
function buildSlider(label, min, max, stp, value, key, fmt) {
  const row = document.createElement('div'); row.className = 'row';
  const lab = document.createElement('span'); lab.className = 'label'; lab.textContent = label;
  const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(stp); inp.value = String(value); inp.setAttribute('aria-label', label);
  const val = document.createElement('span'); val.className = 'value'; val.textContent = fmt(+value);
  inp.addEventListener('input', () => { st[key] = parseFloat(inp.value); val.textContent = fmt(+inp.value); st.auto = 0; render(); });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(val);
  controlsEl.appendChild(row); return { inp, val };
}
const sSer = buildSelect('decay series', [['uranium', 'U-238 series'], ['thorium', 'Th-232 series']], 'series', () => { st.step = 0; st.t = 0; rebuild(); cStep.inp.value = '0'; cStep.val.textContent = '0'; });
const cStep = buildSlider('decay step', 0, 14, 1, st.step, 'step', v => v.toFixed(0));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { series: 'uranium', step: 0, auto: 1, t: 0, running: 1 });
  sSer.value = 'uranium'; cStep.inp.value = '0'; cStep.val.textContent = '0';
  rebuild(); bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false'); render();
});
bPause.addEventListener('click', () => { st.running = st.running ? 0 : 1; bPause.textContent = st.running ? 'Pause' : 'Play'; bPause.setAttribute('aria-pressed', String(!st.running)); });

let lastT = performance.now();
function tick(now) {
  const dr = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  if (st.running) {
    st.t += dr;
    if (st.auto && st.t > 3.2) { st.t = 0; st.step = st.step + 1 > path.length - 1 ? 0 : st.step + 1; cStep.inp.value = String(st.step); cStep.val.textContent = String(st.step); }
  }
  render(); requestAnimationFrame(tick);
}
function bootSync() {
  if (CAPTURE_NAME) { st.auto = 0; st.step = Math.round(CAPTURE_FRAC * (path.length - 1)); st.t = 0.6; }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const u = chainOf('uranium'), th = chainOf('thorium');
  const ue = u[u.length - 1], te = th[th.length - 1];
  if (ue.Z !== 82 || ue.N !== 124) return { name: 'U-238 endpoint', pass: false, msg: `${ue.Z},${ue.N}` };
  if (te.Z !== 82 || te.N !== 126) return { name: 'Th-232 endpoint', pass: false, msg: `${te.Z},${te.N}` };
  return { name: 'series end on stable lead (Pb-206, Pb-208)', pass: true, msg: 'Z,N arithmetic exact' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
