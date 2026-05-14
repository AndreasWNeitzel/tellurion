import { SERIES, partialSum, ratioTest, rootTest } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutS = document.getElementById('readout-s');
const readoutR = document.getElementById('readout-r');
const selectS = document.getElementById('select-s');
const sliderN = document.getElementById('slider-N');
const valueS = document.getElementById('value-s'); const valueN = document.getElementById('value-N');
let name = selectS.value; let N = parseInt(sliderN.value, 10);
selectS.addEventListener('change', () => { name = selectS.value; valueS.textContent = name; });
sliderN.addEventListener('input', () => { N = parseInt(sliderN.value, 10); valueN.textContent = String(N); });
function colors() { const css = getComputedStyle(document.body); return { bg: css.getPropertyValue('--bg').trim() || '#060608', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', accent: css.getPropertyValue('--accent').trim() || '#ffd166', blue: '#5bc0eb', red: '#ef476f', grid: '#23252a' }; }
function render() {
  const c = colors(); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const padL = 60, padR = 16, padT = 22, padB = 36;
  const plotW = canvas.width - padL - padR, plotH = canvas.height - padT - padB;
  const Nmax = 200; const vals = []; for (let n = 1; n <= Nmax; n += 1) vals.push(partialSum(name, n));
  let vmin = Math.min(...vals), vmax = Math.max(...vals);
  if (Number.isFinite(SERIES[name].limit)) { vmin = Math.min(vmin, SERIES[name].limit); vmax = Math.max(vmax, SERIES[name].limit); }
  if (vmin === vmax) { vmin -= 1; vmax += 1; }
  const pad = (vmax - vmin) * 0.1; vmin -= pad; vmax += pad;
  function xFor(n) { return padL + plotW * (n - 1) / (Nmax - 1); }
  function yFor(v) { return padT + plotH * (1 - (v - vmin) / (vmax - vmin)); }
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) { const x = padL + plotW * i / 5; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke(); }
  for (let i = 0; i <= 4; i += 1) { const y = padT + plotH * i / 4; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke(); }
  if (Number.isFinite(SERIES[name].limit)) {
    ctx.strokeStyle = c.red; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, yFor(SERIES[name].limit)); ctx.lineTo(padL + plotW, yFor(SERIES[name].limit)); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = c.red; ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`limit = ${SERIES[name].limit.toFixed(4)}`, padL + plotW - 100, yFor(SERIES[name].limit) - 4);
  }
  ctx.strokeStyle = c.accent; ctx.lineWidth = 2; ctx.beginPath();
  for (let n = 1; n <= Nmax; n += 1) { const x = xFor(n), y = yFor(vals[n - 1]); if (n === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.stroke();
  ctx.fillStyle = c.blue; ctx.beginPath(); ctx.arc(xFor(N), yFor(partialSum(name, N)), 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = c.fg; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`${SERIES[name].label}`, padL + 8, padT + 14);
}
function updateReadout() {
  readoutS.textContent = partialSum(name, N).toFixed(6);
  readoutR.textContent = ratioTest(name, N).toFixed(4);
}
function loop() { render(); updateReadout(); requestAnimationFrame(loop); }
function bootSync() {
  if (CAPTURE_NAME) { const names = ['geom_half', 'pseries_2', 'pseries_1', 'alt_log2']; name = names[Math.min(names.length - 1, Math.floor((CAPTURE_FRAC || 0) * names.length))]; selectS.value = name; }
  valueS.textContent = name; valueN.textContent = String(N);
  render(); updateReadout();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }
