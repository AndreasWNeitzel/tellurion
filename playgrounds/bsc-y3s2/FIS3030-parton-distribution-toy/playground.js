import { u_v, d_v, gluon, sea } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const canvas = document.getElementById('stage'); const ctx = canvas.getContext('2d', { alpha: false });
const rX = document.getElementById('readout-x');
const sX = document.getElementById('slider-x'), vX = document.getElementById('value-x');
const selS = document.getElementById('select-s');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { x: 0.2, scale: 'lin' }; let running = true;
sX.addEventListener('input', () => { st.x = parseFloat(sX.value); vX.textContent = st.x.toFixed(3); });
selS.addEventListener('change', () => { st.scale = selS.value; });
btnR.addEventListener('click', () => { running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
function render() {
  ctx.fillStyle = '#060608'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height, pad = { l: 60, r: 30, t: 30, b: 50 };
  ctx.strokeStyle = '#9aa0a6'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
  ctx.fillStyle = '#9aa0a6'; ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('x f(x)', 12, pad.t + 10); ctx.fillText('x', W - 20, H - pad.b + 14);
  const xToPx = (x) => {
    if (st.scale === 'lin') return pad.l + x * (W - pad.l - pad.r);
    return pad.l + (Math.log10(x) + 3) / 3 * (W - pad.l - pad.r);
  };
  let yMax = 0;
  for (let i = 1; i < 200; i += 1) {
    const x = i / 200;
    const v = Math.max(x * u_v(x), x * d_v(x), x * gluon(x), x * sea(x));
    if (v > yMax) yMax = v;
  }
  const yToPx = (v) => H - pad.b - v / yMax * (H - pad.t - pad.b);
  const labels = [
    { fn: (x) => x * u_v(x), color: '#ffd166', label: 'x u_v' },
    { fn: (x) => x * d_v(x), color: '#5bc0eb', label: 'x d_v' },
    { fn: (x) => x * gluon(x), color: '#06d6a0', label: 'x g' },
    { fn: (x) => x * sea(x), color: '#ef476f', label: 'x sea' },
  ];
  labels.forEach((L, idx) => {
    ctx.strokeStyle = L.color; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 1; i < 400; i += 1) {
      const x = st.scale === 'lin' ? i / 400 : Math.pow(10, -3 + 3 * i / 400);
      const v = L.fn(x);
      const px = xToPx(x), py = yToPx(v);
      if (i === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = L.color; ctx.fillText(L.label, pad.l + 10, pad.t + 26 + idx * 14);
  });
  ctx.strokeStyle = '#9aa0a6'; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(xToPx(st.x), pad.t); ctx.lineTo(xToPx(st.x), H - pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#9aa0a6'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`x = ${st.x.toFixed(3)}, x u_v = ${(st.x * u_v(st.x)).toFixed(3)}, x g = ${(st.x * gluon(st.x)).toFixed(3)}`, 12, H - 14);
  rX.textContent = st.x.toFixed(3);
}
function tick() { render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
