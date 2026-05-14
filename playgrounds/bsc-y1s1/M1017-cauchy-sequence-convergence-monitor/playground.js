import { SEQUENCES, cauchyWidth } from './sim.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const readoutAn = document.getElementById('readout-an');
const readoutW = document.getElementById('readout-w');
const selectSeq = document.getElementById('select-seq');
const sliderN = document.getElementById('slider-n');
const valueSeq = document.getElementById('value-seq');
const valueN = document.getElementById('value-n');
let name = selectSeq.value; let N0 = parseInt(sliderN.value, 10);
selectSeq.addEventListener('change', () => { name = selectSeq.value; valueSeq.textContent = name; });
sliderN.addEventListener('input', () => { N0 = parseInt(sliderN.value, 10); valueN.textContent = String(N0); });
function colors() {
  const css = getComputedStyle(document.body);
  return { bg: css.getPropertyValue('--bg').trim() || '#060608', fg: css.getPropertyValue('--fg').trim() || '#e8e8e8', muted: css.getPropertyValue('--fg-muted').trim() || '#9aa0a6', accent: css.getPropertyValue('--accent').trim() || '#ffd166', blue: '#5bc0eb', red: '#ef476f', grid: '#23252a' };
}
function render() {
  const c = colors();
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const padL = 60, padR = 16, padT = 22, padB = 36;
  const plotW = canvas.width - padL - padR, plotH = canvas.height - padT - padB;
  const seq = SEQUENCES[name];
  const N = 300;
  const vals = [];
  for (let n = 1; n <= N; n += 1) vals.push(seq.fn(n));
  let vmin = Math.min(...vals), vmax = Math.max(...vals);
  if (vmin === vmax) { vmin -= 1; vmax += 1; }
  const pad = (vmax - vmin) * 0.1; vmin -= pad; vmax += pad;
  function xFor(n) { return padL + plotW * (n - 1) / (N - 1); }
  function yFor(v) { return padT + plotH * (1 - (v - vmin) / (vmax - vmin)); }
  ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) { const x = padL + plotW * i / 5; ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke(); }
  for (let i = 0; i <= 4; i += 1) { const y = padT + plotH * i / 4; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke(); }
  if (Number.isFinite(seq.limit)) {
    ctx.strokeStyle = c.red; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, yFor(seq.limit)); ctx.lineTo(padL + plotW, yFor(seq.limit)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = c.red; ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`limit = ${seq.limit.toFixed(4)}`, padL + plotW - 100, yFor(seq.limit) - 4);
  }
  ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let n = 1; n <= N; n += 1) { const x = xFor(n), y = yFor(vals[n - 1]); if (n === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.stroke();
  // Highlight points from N0 onwards.
  for (let n = N0; n <= N; n += 1) { ctx.fillStyle = c.blue; ctx.beginPath(); ctx.arc(xFor(n), yFor(vals[n - 1]), 2.5, 0, 2 * Math.PI); ctx.fill(); }
  const w = cauchyWidth(name, N0, Math.min(N, N0 + 500));
  // Cauchy-band drawn at the mean of vals[N0..N].
  const slice = vals.slice(N0 - 1);
  const mn = Math.min(...slice), mx = Math.max(...slice);
  ctx.fillStyle = 'rgba(91, 192, 235, 0.15)';
  ctx.fillRect(xFor(N0), yFor(mx), xFor(N) - xFor(N0), yFor(mn) - yFor(mx));
  ctx.strokeStyle = c.blue; ctx.lineWidth = 1; ctx.strokeRect(xFor(N0), yFor(mx), xFor(N) - xFor(N0), yFor(mn) - yFor(mx));
  ctx.fillStyle = c.muted; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`${seq.label}: w(N_0 = ${N0}) = ${w.toExponential(2)}`, padL + 8, padT + 14);
}
function updateReadout() {
  const seq = SEQUENCES[name];
  readoutAn.textContent = seq.fn(N0).toFixed(6);
  readoutW.textContent = cauchyWidth(name, N0, N0 + 500).toExponential(3);
}
function loop() { render(); updateReadout(); requestAnimationFrame(loop); }
function bootSync() {
  if (CAPTURE_NAME) { const names = ['geom', 'harm', 'arctan', 'zeta2']; name = names[Math.min(names.length - 1, Math.floor((CAPTURE_FRAC || 0) * names.length))]; selectSeq.value = name; }
  valueSeq.textContent = name; valueN.textContent = String(N0);
  render(); updateReadout();
  if (DETERMINISTIC) { requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null, name, N0 } })); })); }
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(loop); }
