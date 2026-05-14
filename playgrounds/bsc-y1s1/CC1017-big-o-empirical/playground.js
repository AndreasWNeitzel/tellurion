import { counts, approxSeconds } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutN = document.getElementById('readout-n');
const readoutTc = document.getElementById('readout-tc');
const sliderN = document.getElementById('slider-N');
const valueN = document.getElementById('value-N');
let logN = parseFloat(sliderN.value);
sliderN.addEventListener('input', () => { logN = parseFloat(sliderN.value); valueN.textContent = logN.toFixed(2); });
function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#060608', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', accent: css.getPropertyValue('--accent').trim() || '#ffd166', blue: '#5bc0eb', orange: '#f4a261', red: '#ef476f', grid: '#23252a' };
}
function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const padL = 64, padR = 16, padT = 30, padB = 40;
  const plotW = canvas.width - padL - padR, plotH = canvas.height - padT - padB;
  const xMin = 1, xMax = 7, yMin = 0, yMax = 22;
  function xFor(lx) { return padL + plotW * (lx - xMin) / (xMax - xMin); }
  function yFor(ly) { return padT + plotH * (1 - (ly - yMin) / (yMax - yMin)); }
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) { const x = padL + plotW * i / 6; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke(); ctx.fillStyle = c.muted; ctx.font = '10px ui-monospace, monospace'; ctx.fillText(`1e${xMin + i}`, x - 14, padT + plotH + 14); }
  for (let i = 0; i <= 11; i += 1) { const y = padT + plotH * i / 11; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke(); ctx.fillStyle = c.muted; ctx.fillText(`1e${22 - 2 * i}`, padL - 30, y + 3); }
  const series = [
    { label: 'N', color: c.muted, fn: (N) => N },
    { label: 'N log N', color: c.blue, fn: (N) => N * Math.log2(Math.max(N, 2)) },
    { label: 'N^2', color: c.accent, fn: (N) => N * N },
    { label: 'N^3', color: c.red, fn: (N) => N * N * N },
  ];
  for (const s of series) {
    ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 200; i += 1) {
      const lx = xMin + (xMax - xMin) * i / 200; const N = Math.pow(10, lx);
      const ly = Math.log10(s.fn(N));
      const xx = xFor(lx), yy = yFor(ly);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  const xc = xFor(logN);
  ctx.strokeStyle = c.fg; ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xc, padT); ctx.lineTo(xc, padT + plotH); ctx.stroke(); ctx.setLineDash([]);
  let ly = padT + 10; for (const s of series) { ctx.fillStyle = s.color; ctx.fillRect(padL + plotW - 100, ly - 8, 12, 3); ctx.fillStyle = c.muted; ctx.fillText(s.label, padL + plotW - 80, ly); ly += 14; }
  ctx.fillStyle = c.muted; ctx.fillText('input size N', padL + plotW - 80, padT + plotH + 28);
  ctx.save(); ctx.translate(16, padT + plotH / 2 + 20); ctx.rotate(-Math.PI / 2); ctx.fillText('operation count (log)', 0, 0); ctx.restore();
}
function updateReadout() {
  const N = Math.pow(10, logN); const c = counts(N);
  readoutN.textContent = N.toExponential(2);
  const t = approxSeconds(c.cubic);
  readoutTc.textContent = t > 1 ? `${t.toFixed(1)} s` : t > 1e-3 ? `${(t * 1e3).toFixed(1)} ms` : `${(t * 1e6).toFixed(1)} us`;
}
function loop() { render(); updateReadout(); requestAnimationFrame(loop); }
function bootSync() {
  if (CAPTURE_NAME) { logN = 1 + (CAPTURE_FRAC || 0) * 6; sliderN.value = String(logN); valueN.textContent = logN.toFixed(2); }
  valueN.textContent = logN.toFixed(2);
  render(); updateReadout();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null, logN } })); })); }
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }
