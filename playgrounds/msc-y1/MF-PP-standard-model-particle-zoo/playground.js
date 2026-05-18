// Standard Model particle zoo. Panel A: the SM chart (quarks,
// leptons, gauge bosons, Higgs) coloured by type with a moving
// selection and a force filter. Panel B: the selected particle's PDG
// card. Panel C: a decay-chain conservation check (charge / baryon /
// lepton flavour) with the Q-value verdict. Gate-tested sim.js;
// deterministic. PDG 2024; Griffiths; Halzen and Martin.
import {
  PARTICLES, checkDecay, DECAYS, feelsForce,
} from './sim.js';
import { parseUrlState, mountShareButton } from '../../../shared/js/controls/share-state.js';

const qp = new URLSearchParams(location.search);
const DETERMINISTIC = qp.get('deterministic') === '1';
const CAPTURE_NAME = qp.get('capture');
const CAPTURE_FRAC = parseFloat(qp.get('captureFraction') ?? '0');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width, H = canvas.height;
const rP = document.getElementById('readout-p');
const rM = document.getElementById('readout-m');
const rQ = document.getElementById('readout-q');
const rD = document.getElementById('readout-d');
const selF = document.getElementById('select-force');
const selD = document.getElementById('select-decay');
const bR = document.getElementById('btn-reset'), bP = document.getElementById('btn-pause');

DECAYS.forEach((d, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = d.name; selD.appendChild(o); });

// chart layout: [col, row] -> particle id. cols 0-2 = generations,
// col 3 = gauge bosons; rows 0-3.
const GRID = [
  ['u', 'c', 't', 'g'],
  ['d', 's', 'b', 'gamma'],
  ['e', 'mu', 'tau', 'W'],
  ['nue', 'num', 'nut', 'Z'],
];
const ORDER = ['u', 'd', 'c', 's', 't', 'b', 'e', 'nue', 'mu', 'num', 'tau', 'nut', 'g', 'gamma', 'W', 'Z', 'H'];
const TYPE_COL = { quark: '#2f6ad6', lepton: '#3a9a6a', boson: '#9a6a3a', hadron: '#6a3a9a' };

const DEF_FORCE = 'none', DEF_DECAY = 0;
const st = { force: DEF_FORCE, decay: DEF_DECAY, running: true, ph: 0 };
function selId() { return ORDER[Math.min(ORDER.length - 1, Math.floor(st.ph * ORDER.length))]; }

function panel(x, y, w, h, title) {
  ctx.fillStyle = '#0a0b10'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px monospace';
  ctx.fillText(title, x + 8, y + 14);
}

function drawChart(x, y, w, h) {
  panel(x, y, w, h, 'Standard Model: 3 generations of quarks and leptons, gauge bosons, Higgs');
  const sel = selId();
  const gx = x + 30, gy = y + 34, cw = (w - 130) / 4, ch = (h - 70) / 4;
  for (let r = 0; r < 4; r += 1) for (let c = 0; c < 4; c += 1) {
    const id = GRID[r][c]; const P = PARTICLES[id];
    const px = gx + c * cw, py = gy + r * ch;
    const dim = st.force !== 'none' && !feelsForce(id, st.force);
    ctx.globalAlpha = dim ? 0.22 : 1;
    ctx.fillStyle = TYPE_COL[P.type] || '#444';
    ctx.fillRect(px + 3, py + 3, cw - 6, ch - 6);
    if (id === sel) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.strokeRect(px + 3, py + 3, cw - 6, ch - 6); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = '15px monospace';
    ctx.fillText(P.sym, px + 12, py + ch / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '9px monospace';
    ctx.fillText(`Q=${P.Q.toFixed(2)}`, px + 12, py + ch / 2 + 16);
  }
  // Higgs tile (right column, spanning)
  const hx = gx + 4 * cw + 8, hy = gy;
  ctx.fillStyle = TYPE_COL.boson; ctx.globalAlpha = st.force !== 'none' && !feelsForce('H', st.force) ? 0.22 : 1;
  ctx.fillRect(hx, hy, 80, 4 * ch - 6);
  if (sel === 'H') { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.strokeRect(hx, hy, 80, 4 * ch - 6); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff'; ctx.font = '15px monospace'; ctx.fillText('H', hx + 30, hy + 2 * ch);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '9px monospace'; ctx.fillText('Higgs', hx + 22, hy + 2 * ch + 16);
  // legend
  ctx.font = '10px monospace';
  let lx = gx;
  for (const [t, col] of Object.entries(TYPE_COL)) {
    if (t === 'hadron') continue;
    ctx.fillStyle = col; ctx.fillRect(lx, y + h - 18, 12, 10);
    ctx.fillStyle = 'rgba(220,230,250,0.75)'; ctx.fillText(t, lx + 16, y + h - 9);
    lx += 90;
  }
  if (st.force !== 'none') { ctx.fillStyle = 'rgba(255,209,102,0.85)'; ctx.fillText(`filter: ${st.force} (dimmed = does not feel it)`, lx + 10, y + h - 9); }
}

function drawCard(x, y, w, h) {
  const id = selId(), P = PARTICLES[id];
  panel(x, y, w, h, `particle card: ${P.name}`);
  const mass = P.m === 0 ? '0 (massless)' : P.m >= 1000 ? `${(P.m / 1000).toFixed(3)} GeV` : `${P.m.toPrecision(6)} MeV`;
  const rows = [
    ['symbol', P.sym], ['type', P.type], ['mass', mass],
    ['charge Q', `${P.Q.toFixed(3)} e`], ['spin J', String(P.J)],
    ['baryon B', P.B.toFixed(3)], ['lepton (e,mu,tau)', `${P.Le}, ${P.Lmu}, ${P.Ltau}`],
    ['forces', P.forces.join(', ')],
  ];
  ctx.font = '12px monospace';
  rows.forEach((rw, i) => {
    const yy = y + 40 + i * 22;
    ctx.fillStyle = 'rgba(160,180,220,0.8)'; ctx.fillText(rw[0], x + 16, yy);
    ctx.fillStyle = 'rgba(235,240,250,0.95)'; ctx.fillText(String(rw[1]), x + 170, yy);
  });
}

function drawDecay(x, y, w, h) {
  const D = DECAYS[st.decay];
  panel(x, y, w, h, `decay check: ${D.name}`);
  const r = checkDecay(D.parent, D.daughters);
  const pSym = PARTICLES[D.parent.id].sym;
  const dStr = D.daughters.map((l) => (l.anti ? 'anti-' : '') + PARTICLES[l.id].sym).join(' + ');
  ctx.fillStyle = 'rgba(235,240,250,0.95)'; ctx.font = '13px monospace';
  ctx.fillText(`${pSym}  ->  ${dStr}`, x + 16, y + 38);
  const laws = [['charge', r.laws.charge], ['baryon', r.laws.baryon], ['L_e', r.laws.Le], ['L_mu', r.laws.Lmu], ['L_tau', r.laws.Ltau]];
  ctx.font = '12px monospace';
  laws.forEach((lw, i) => {
    const yy = y + 64 + i * 22;
    ctx.fillStyle = 'rgba(160,180,220,0.8)'; ctx.fillText(lw[0], x + 20, yy);
    ctx.fillStyle = lw[1] ? '#8fe39b' : '#ff8f8f';
    ctx.fillText(lw[1] ? 'conserved  OK' : 'VIOLATED  X', x + 130, yy);
  });
  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(160,180,220,0.8)'; ctx.fillText('Q-value', x + 20, y + 64 + 5 * 22);
  ctx.fillStyle = r.kinematic ? '#8fe39b' : '#ff8f8f';
  ctx.fillText(`${r.Qvalue.toFixed(2)} MeV ${r.kinematic ? '(allowed)' : '(forbidden)'}`, x + 130, y + 64 + 5 * 22);
  ctx.font = '13px monospace';
  ctx.fillStyle = r.allowed ? '#8fe39b' : '#ff8f8f';
  ctx.fillText(r.allowed ? 'DECAY ALLOWED' : 'DECAY FORBIDDEN', x + 16, y + h - 12);
}

function draw() {
  ctx.fillStyle = '#07080c'; ctx.fillRect(0, 0, W, H);
  drawChart(20, 22, W - 40, 232);
  drawCard(20, 270, (W - 52) / 2, H - 270 - 16);
  drawDecay(20 + (W - 52) / 2 + 12, 270, (W - 52) / 2, H - 270 - 16);
  const P = PARTICLES[selId()];
  rP.textContent = P.name;
  rM.textContent = P.m === 0 ? '0' : P.m >= 1000 ? `${(P.m / 1000).toFixed(2)} GeV` : `${P.m.toPrecision(4)} MeV`;
  rQ.textContent = P.Q.toFixed(2);
  rD.textContent = checkDecay(DECAYS[st.decay].parent, DECAYS[st.decay].daughters).allowed ? 'allowed' : 'forbidden';
}

const LIVE = 1 / 360;
function tick() {
  if (st.running) { st.ph += LIVE; if (st.ph >= 1) st.ph = 0; }
  draw();
  requestAnimationFrame(tick);
}

selF.addEventListener('change', () => { st.force = selF.value; draw(); });
selD.addEventListener('change', () => { st.decay = parseInt(selD.value, 10); draw(); });
bR.addEventListener('click', () => {
  st.force = DEF_FORCE; st.decay = DEF_DECAY; st.ph = 0; st.running = true;
  selF.value = DEF_FORCE; selD.value = String(DEF_DECAY);
  bP.textContent = 'Pause'; bP.setAttribute('aria-pressed', 'false'); draw();
});
bP.addEventListener('click', () => {
  st.running = !st.running;
  bP.textContent = st.running ? 'Pause' : 'Play';
  bP.setAttribute('aria-pressed', String(!st.running));
});

function getState() { return { force: st.force, decay: String(st.decay) }; }
function restoreState() {
  const s = parseUrlState();
  if (!s) return;
  if (s.force) { st.force = s.force; selF.value = s.force; }
  if (s.decay) { st.decay = parseInt(s.decay, 10); selD.value = s.decay; }
}

function boot() {
  restoreState();
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
