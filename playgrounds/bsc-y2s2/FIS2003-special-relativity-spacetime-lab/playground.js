// Special relativity lab. The primary scene is physical: a rod-train
// that Lorentz-contracts against its dashed rest length while two twin
// clocks tick, the travelling one accumulating less proper time on a
// round trip. The side panel is the Minkowski diagram with the light
// cone, the boosted simultaneity grid and the twin worldline. Numerics
// in sim.js (c = 1). Reference: Taylor and Wheeler, Spacetime Physics
// (2nd ed.), Ch. 3-4.

import { gamma, contractedLength, twinTrip, boost, dopplerFactor } from './sim.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutEl = document.getElementById('readout');
const controlsEl = document.getElementById('controls');

const READOUTS = ['beta', 'gamma', 'L/L0', 'home clock', 'twin clock', 'phase'];
const rEls = {};
for (const kk of READOUTS) {
  const a = document.createElement('span'); a.className = 'label'; a.textContent = kk;
  const b = document.createElement('span'); b.className = 'value'; b.textContent = '--';
  readoutEl.appendChild(a); readoutEl.appendChild(b); rEls[kk] = b;
}

const st = { beta: 0.8, L: 8, frame: 'lab', t: 0, running: 1 };
const L0_REST = 2.4;                  // rod rest length (spacetime units)
const CYCLE = 9;                      // seconds for one out-and-back

function tripPhase() { return ((st.t / CYCLE) % 1 + 1) % 1; }
// train coordinate position x(phase) in [0, L] and back; plus the
// elapsed home/traveller clocks at this phase
function trainState() {
  const ph = tripPhase(), tp = twinTrip(st.L, st.beta);
  const homeNow = ph * tp.home;
  let x, travelNow;
  if (ph < 0.5) { x = st.beta * homeNow; travelNow = homeNow / gamma(st.beta); }
  else { x = st.beta * (tp.home - homeNow); travelNow = homeNow / gamma(st.beta); }
  return { x, homeNow, travelNow, tp, ph };
}

// geometry
const SX = 28, SY = 36, SW = 844, SH = 168;            // lab scene (track + rod)
const CKcy = 296;                                      // twin-clock band centre
const PX = 280, PW = 420, PY = 356, PH = 318;          // Minkowski panel

function clockFace(cx, cy, r, frac, label, col) {
  ctx.strokeStyle = 'rgba(210,215,225,0.6)'; ctx.fillStyle = '#0c0f16';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill(); ctx.stroke();
  for (let h = 0; h < 12; h += 1) { const a = h * Math.PI / 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4)); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke(); }
  const ang = -Math.PI / 2 + frac * 2 * Math.PI;
  ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * (r - 6), cy + Math.sin(ang) * (r - 6)); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy + r + 14);
  ctx.textAlign = 'left';
}

function render() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const g = gamma(st.beta), ts = trainState();

  // lab scene: track, contracted rod-train, rest-length ghost
  ctx.fillStyle = '#0a0c12'; ctx.fillRect(SX, SY, SW, SH);
  ctx.strokeStyle = 'rgba(220,225,235,0.5)'; ctx.strokeRect(SX, SY, SW, SH);
  const trackY = SY + SH * 0.42, x0 = SX + 60, xPerL = (SW - 160) / Math.max(1, st.L);
  ctx.strokeStyle = 'rgba(150,160,180,0.45)'; ctx.beginPath(); ctx.moveTo(x0, trackY + 26); ctx.lineTo(x0 + st.L * xPerL, trackY + 26); ctx.stroke();
  for (let mk = 0; mk <= st.L; mk += 1) { const xm = x0 + mk * xPerL; ctx.beginPath(); ctx.moveTo(xm, trackY + 22); ctx.lineTo(xm, trackY + 30); ctx.stroke(); }
  ctx.fillStyle = '#7f8696'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('x = 0', x0, trackY + 46); ctx.fillText('x = L', x0 + st.L * xPerL, trackY + 46);
  // station at x=0
  ctx.fillStyle = '#3a3f4b'; ctx.fillRect(x0 - 14, trackY - 14, 10, 40);
  // rod-train, drawn contracted; the dashed ghost is the rest length
  const cxTrain = x0 + ts.x * xPerL;
  const Lpx = L0_REST * xPerL, Lc = contractedLength(L0_REST, st.beta) * xPerL;
  const dir = ts.ph < 0.5 ? 1 : -1;            // leading edge at cxTrain
  const ghostX = dir > 0 ? cxTrain - Lpx : cxTrain;
  const rodX = dir > 0 ? cxTrain - Lc : cxTrain;
  ctx.strokeStyle = 'rgba(200,205,215,0.35)'; ctx.setLineDash([5, 4]);
  ctx.strokeRect(ghostX, trackY - 18, Lpx, 34); ctx.setLineDash([]);
  const grad = ctx.createLinearGradient(rodX, 0, rodX + Lc, 0);
  grad.addColorStop(0, '#7fd6ff'); grad.addColorStop(1, '#3a86b5');
  ctx.fillStyle = grad;
  ctx.fillRect(rodX, trackY - 16, Lc, 30);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.strokeRect(rodX, trackY - 16, Lc, 30);
  // motion arrow + Doppler tint hint
  ctx.fillStyle = '#ffe46b'; ctx.beginPath();
  const ax = cxTrain + dir * 16;
  ctx.moveTo(ax, trackY - 1); ctx.lineTo(ax - dir * 10, trackY - 7); ctx.lineTo(ax - dir * 10, trackY + 5); ctx.closePath(); ctx.fill();

  // scene caption (just below the track box)
  ctx.fillStyle = '#9aa0ad'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('Lorentz-contracted rod (solid) vs its rest length (dashed); the twin clocks desynchronise', SX + SW / 2, SY + SH + 22);
  ctx.textAlign = 'left';
  // twin-clock band
  clockFace(SX + 70, CKcy, 27, (ts.homeNow % 12) / 12, 'home twin', '#ffcf5d');
  clockFace(SX + 168, CKcy, 27, (ts.travelNow % 12) / 12, 'travelling twin', '#7fd6ff');
  const approaching = ts.ph >= 0.5;          // inbound leg approaches the home station at x = 0
  const dop = dopplerFactor(st.beta, approaching);
  ctx.fillStyle = '#c8ccd6'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText(`home elapsed ${ts.homeNow.toFixed(2)}   |   traveller ${ts.travelNow.toFixed(2)}   (gamma = ${g.toFixed(3)})`, SX + 240, CKcy - 14);
  ctx.fillText(`rod: rest L0 = ${L0_REST.toFixed(2)}, measured ${contractedLength(L0_REST, st.beta).toFixed(2)} = L0 / gamma`, SX + 240, CKcy + 6);
  ctx.fillText(`Doppler f_obs/f_src = ${dop.toFixed(3)} (${approaching ? 'approaching, blueshift' : 'receding, redshift'})`, SX + 240, CKcy + 26);
  ctx.textAlign = 'left';

  // Minkowski panel
  ctx.fillStyle = '#0b0d13'; ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = 'rgba(200,205,215,0.32)'; ctx.strokeRect(PX, PY, PW, PH);
  ctx.fillStyle = '#c8ccd6'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
  ctx.fillText('Minkowski diagram (lab frame; x right, ct up)', PX + PW / 2, PY - 6);
  const oy = PY + PH - 20, ox = PX + PW / 2;
  // scale so the round-trip worldline (up to ct = 2L) fits the panel
  const sc = Math.min((PW * 0.46) / Math.max(1, st.L), (PH - 44) / (2 * Math.max(1, st.L)));
  const MX = (x) => ox + x * sc, MT = (t) => oy - t * sc;
  // light cone
  ctx.strokeStyle = 'rgba(255,210,90,0.5)'; ctx.beginPath();
  ctx.moveTo(MX(-st.L), MT(st.L)); ctx.lineTo(MX(st.L), MT(-st.L)); ctx.moveTo(MX(st.L), MT(st.L)); ctx.lineTo(MX(-st.L), MT(-st.L)); ctx.stroke();
  // boosted simultaneity (slope beta) and worldline (slope 1/beta) grid
  ctx.strokeStyle = 'rgba(127,214,255,0.5)'; ctx.lineWidth = 1.4;
  for (const tp0 of [-st.L, 0, st.L]) { ctx.beginPath(); ctx.moveTo(MX(-st.L), MT(st.beta * -st.L + tp0)); ctx.lineTo(MX(st.L), MT(st.beta * st.L + tp0)); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,140,120,0.5)';
  for (const xp0 of [-st.L / 2, 0, st.L / 2]) { ctx.beginPath(); ctx.moveTo(MX(xp0), MT(0)); ctx.lineTo(MX(xp0 + st.beta * st.L), MT(st.L)); ctx.stroke(); }
  ctx.lineWidth = 1;
  // twin worldline: out then back
  ctx.strokeStyle = '#ffcf5d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(MX(0), MT(0)); ctx.lineTo(MX(st.L), MT(st.L)); ctx.lineTo(MX(0), MT(2 * st.L)); ctx.stroke(); ctx.lineWidth = 1;
  // home worldline (ct axis)
  ctx.strokeStyle = 'rgba(200,205,215,0.5)'; ctx.beginPath(); ctx.moveTo(MX(0), MT(0)); ctx.lineTo(MX(0), MT(2 * st.L)); ctx.stroke();
  // current event marker
  const evT = ts.ph * 2 * st.L;
  ctx.fillStyle = '#ff5d5d'; ctx.beginPath(); ctx.arc(MX(ts.x), MT(evT), 4, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#c8ccd6'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillText('yellow: twin worldline   cyan: lines of simultaneity', PX + 8, PY + PH - 4);
  ctx.textAlign = 'left';

  rEls['beta'].textContent = st.beta.toFixed(3);
  rEls['gamma'].textContent = g.toFixed(3);
  rEls['L/L0'].textContent = (1 / g).toFixed(3);
  rEls['home clock'].textContent = ts.homeNow.toFixed(2);
  rEls['twin clock'].textContent = ts.travelNow.toFixed(2);
  rEls['phase'].textContent = ts.ph.toFixed(2);
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
const cB = buildSlider('speed beta (v/c)', 0.05, 0.99, 0.01, st.beta, 'beta', v => v.toFixed(2));
const cL = buildSlider('trip distance L', 3, 16, 1, st.L, 'L', v => v.toFixed(0));
const bRow = document.createElement('div'); bRow.className = 'row buttons';
const bReset = document.createElement('button'); bReset.type = 'button'; bReset.textContent = 'Reset';
const bPause = document.createElement('button'); bPause.type = 'button'; bPause.id = 'btn-pause'; bPause.textContent = 'Pause'; bPause.setAttribute('aria-pressed', 'false');
bRow.appendChild(bReset); bRow.appendChild(bPause); controlsEl.appendChild(bRow);
bReset.addEventListener('click', () => {
  Object.assign(st, { beta: 0.6, L: 8, frame: 'lab', t: 0, running: 1 });
  cB.inp.value = '0.6'; cB.val.textContent = '0.60'; cL.inp.value = '8'; cL.val.textContent = '8';
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
  st.t = CAPTURE_NAME ? CAPTURE_FRAC * CYCLE : 0;
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__simulationReady = true;
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } }));
  }));
}

window.__physicsCheck = async () => {
  const b = Math.sqrt(3) / 2;                    // gamma = 2
  if (Math.abs(gamma(b) - 2) > 1e-9) return { name: 'gamma', pass: false, msg: `${gamma(b)}` };
  const e = boost(3, 1, 0.5);
  if (Math.abs((e[0] * e[0] - e[1] * e[1]) - (9 - 1)) > 1e-10) return { name: 'interval', pass: false, msg: 'not invariant' };
  const tp = twinTrip(6, b);
  if (Math.abs(tp.travel / tp.home - 0.5) > 1e-4) return { name: 'twin', pass: false, msg: `${tp.travel / tp.home}` };
  return { name: 'gamma + interval + twin paradox', pass: true, msg: 's^2 invariant; traveller ages half at beta=0.866' };
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true });
else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
