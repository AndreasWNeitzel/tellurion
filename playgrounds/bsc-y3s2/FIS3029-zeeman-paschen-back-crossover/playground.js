import { weakFieldEnergy, strongFieldEnergy, BOHR_MAGNETON_eV_T, FS_2P_eV } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rB = document.getElementById('readout-b');
const sB = document.getElementById('slider-B'), vB = document.getElementById('value-B');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { B: 2 }; let running = true;
sB.addEventListener('input', () => { st.B = parseFloat(sB.value); vB.textContent = st.B.toFixed(2); });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('ΔE (μeV)', 12, pad.t + 10); ctx.fillText('B (T)', W - 50, H - pad.b + 14);
  const Bmax = 20;
  const eMin = -1500, eMax = 1500;
  const xToPx = (b) => pad.l + b / Bmax * (W - pad.l - pad.r);
  const yToPx = (e) => H - pad.b - (e - eMin) / (eMax - eMin) * (H - pad.t - pad.b);
  // Weak: 2p_{3/2}: m_j = 3/2, 1/2, -1/2, -3/2 with g = 4/3. 2p_{1/2}: m_j = 1/2, -1/2 with g = 2/3.
  const weakLevels = [
    { j: 1.5, mj: 1.5, l: 1, s: 0.5, color: '#ffd166', label: '2p_{3/2} m=3/2', E0: 0.5 * FS_2P_eV },
    { j: 1.5, mj: 0.5, l: 1, s: 0.5, color: '#ffd166', label: '2p_{3/2} m=1/2', E0: 0.5 * FS_2P_eV },
    { j: 1.5, mj: -0.5, l: 1, s: 0.5, color: '#ffd166', label: '2p_{3/2} m=-1/2', E0: 0.5 * FS_2P_eV },
    { j: 1.5, mj: -1.5, l: 1, s: 0.5, color: '#ffd166', label: '2p_{3/2} m=-3/2', E0: 0.5 * FS_2P_eV },
    { j: 0.5, mj: 0.5, l: 1, s: 0.5, color: '#5bc0eb', label: '2p_{1/2} m=1/2', E0: -0.5 * FS_2P_eV },
    { j: 0.5, mj: -0.5, l: 1, s: 0.5, color: '#5bc0eb', label: '2p_{1/2} m=-1/2', E0: -0.5 * FS_2P_eV },
  ];
  const strongLevels = [];
  for (const mL of [-1, 0, 1]) for (const mS of [-0.5, 0.5]) {
    strongLevels.push({ mL, mS, color: '#06d6a0' });
  }
  // Plot weak-field curves on left half.
  weakLevels.forEach(L => {
    ctx.strokeStyle = L.color; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const b = i / 100 * Bmax;
      const E = weakFieldEnergy(L.j, L.mj, L.l, L.s, b, L.E0) * 1e6;
      const blend = Math.min(1, b / 3);
      const strong = strongFieldEnergy(0, L.mj > 0 ? 0.5 : -0.5, b, 0) * 1e6;
      const Ec = (1 - blend) * E + blend * strong;
      const px = xToPx(b), py = yToPx(Ec);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  });
  ctx.strokeStyle = '#ef476f'; ctx.setLineDash([3, 3]);
  // Critical field: g mu_B B ~ FS
  const Bc = FS_2P_eV / BOHR_MAGNETON_eV_T;
  ctx.beginPath(); ctx.moveTo(xToPx(Bc), pad.t); ctx.lineTo(xToPx(Bc), H - pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ef476f'; ctx.fillText(`B_c ≈ ${Bc.toFixed(2)} T`, xToPx(Bc) + 4, pad.t + 14);
  ctx.fillStyle = '#5bc0eb'; ctx.fillText('cyan = 2p_{1/2}', pad.l + 10, pad.t + 28);
  ctx.fillStyle = '#ffd166'; ctx.fillText('orange = 2p_{3/2}', pad.l + 10, pad.t + 44);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`B = ${st.B.toFixed(2)} T (${st.B < Bc ? 'Zeeman' : 'Paschen-Back'} regime)`, 12, H - 14);
  rB.textContent = `${st.B.toFixed(2)} T`;
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
