// 1D radiative transfer through a slab, shown as the physical scene:
// a source of brightness I_in shines through a tinted medium of
// optical depth tau and source function S, and the beam's brightness
// relaxes exponentially toward S along the path,
// I(s) = I_in e^-tau_s + S(1 - e^-tau_s). Thin slab -> the source
// passes through; thick slab -> you only see the slab's own glow S.
// If S < I_in the emergent beam is darkened (an absorption line); if
// S > I_in it is brightened (an emission line) -- the spectrum strip
// shows this. The I(tau) curve is the demoted diagnostic. sim.js
// (transmitOptical, profileVsTau) is unchanged. Reference: Rybicki
// and Lightman, Radiative Processes in Astrophysics, Ch. 1.
import { transmitOptical, profileVsTau } from './sim.js';
import { prefersReducedMotion } from '../../../shared/js/controls/motion-preference.js';

const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const rI = document.getElementById('readout-i');
const sI = document.getElementById('slider-Iin'), vI = document.getElementById('value-Iin');
const sS = document.getElementById('slider-S'), vS = document.getElementById('value-S');
const sT = document.getElementById('slider-tau'), vT = document.getElementById('value-tau');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
const W = canvas.width, H = canvas.height;

const st = { Iin: 1, S: 3, tau: 2, t: 0 };
let running = !prefersReducedMotion();

sI.addEventListener('input', () => { st.Iin = parseFloat(sI.value); vI.textContent = st.Iin.toFixed(2); });
sS.addEventListener('input', () => { st.S = parseFloat(sS.value); vS.textContent = st.S.toFixed(2); });
sT.addEventListener('input', () => { st.tau = parseFloat(sT.value); vT.textContent = st.tau.toFixed(2); });
btnR.addEventListener('click', () => { st.Iin = 1; st.S = 3; st.tau = 2; sI.value = '1'; vI.textContent = '1.00'; sS.value = '3'; vS.textContent = '3.00'; sT.value = '2'; vT.textContent = '2.00'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed', 'false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });

function intColor(v, vmax) {
  const u = Math.max(0, Math.min(1, v / (vmax + 1e-9)));
  // warm ramp: dark ember -> orange -> yellow -> white
  let r, g, b;
  if (u < 0.5) { const k = u / 0.5; r = 60 + 195 * k; g = 20 + 120 * k; b = 15 + 25 * k; }
  else { const k = (u - 0.5) / 0.5; r = 255; g = 140 + 115 * k; b = 40 + 200 * k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function render() {
  if (!CAPTURE_NAME && running) st.t += 1;
  ctx.fillStyle = '#070810'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '16px sans-serif';
  ctx.fillText('Shine a light through a cloud: thin lets it through, thick shows only the cloud', 18, 26);

  const vmax = Math.max(st.Iin, st.S, 1);
  const SX0 = 210, SX1 = 560, SY = 150, BH = 30;          // slab x-range, beam centre

  // source on the left, brightness ~ I_in
  const srcA = 0.25 + 0.75 * st.Iin / vmax;
  const sg = ctx.createRadialGradient(120, SY, 0, 120, SY, 60);
  sg.addColorStop(0, intColor(st.Iin, vmax)); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = srcA; ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(120, SY, 60, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = intColor(st.Iin, vmax); ctx.beginPath(); ctx.arc(120, SY, 16, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#94a3b8'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`source  I_in = ${st.Iin.toFixed(2)}`, 70, SY + 78);

  // the slab: opacity grows with tau, tinted by its own emission S
  const opac = 0.06 + 0.42 * (1 - Math.exp(-st.tau));
  ctx.fillStyle = `rgba(${120 + 26 * st.S | 0},${90 + 20 * st.S | 0},${70},${opac.toFixed(3)})`;
  ctx.fillRect(SX0, SY - 120, SX1 - SX0, 240);
  ctx.strokeStyle = 'rgba(226,232,240,0.25)'; ctx.strokeRect(SX0 + 0.5, SY - 119.5, SX1 - SX0 - 1, 239);
  ctx.fillStyle = '#64748b'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`slab:  tau = ${st.tau.toFixed(2)}    S = ${st.S.toFixed(2)}`, SX0 + 8, SY - 100);

  // beam: I(s) relaxes from I_in toward S across the slab
  const segs = 90;
  for (let i = 0; i < segs; i += 1) {
    const f0 = i / segs, f1 = (i + 1) / segs;
    const Iv = transmitOptical(st.Iin, st.S, st.tau * (f0 + f1) / 2);
    const x = SX0 + f0 * (SX1 - SX0);
    ctx.fillStyle = intColor(Iv, vmax);
    ctx.fillRect(x, SY - BH / 2, (SX1 - SX0) / segs + 1, BH);
  }
  // incoming + emergent beam stubs
  ctx.fillStyle = intColor(st.Iin, vmax); ctx.fillRect(136, SY - BH / 2, SX0 - 136, BH);
  const Iout = transmitOptical(st.Iin, st.S, st.tau);
  ctx.fillStyle = intColor(Iout, vmax); ctx.fillRect(SX1, SY - BH / 2, 70, BH);
  // streaming photons sampling the local intensity
  for (let q = 0; q < 7; q += 1) {
    const f = ((st.t * 0.01) + q / 7) % 1;
    const x = 136 + f * (SX1 + 70 - 136);
    let Iv = st.Iin;
    if (x > SX0 && x < SX1) Iv = transmitOptical(st.Iin, st.S, st.tau * (x - SX0) / (SX1 - SX0));
    else if (x >= SX1) Iv = Iout;
    ctx.fillStyle = intColor(Iv, vmax);
    ctx.beginPath(); ctx.arc(x, SY, 3, 0, 6.2832); ctx.fill();
  }
  // observer + emergent value + regime
  ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(660, SY, 10, 0, 6.2832); ctx.stroke();
  ctx.fillStyle = '#e2e8f0'; ctx.font = '13px ui-monospace, monospace';
  ctx.fillText(`I_out = ${Iout.toFixed(3)}`, 612, SY + 40);
  const regime = st.tau < 0.4 ? 'optically thin: I_out ~ I_in (slab transparent)'
    : st.tau > 3 ? 'optically thick: I_out ~ S (only the slab is seen)'
      : 'intermediate: I_out between I_in and S';
  ctx.fillStyle = '#ffd166'; ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(regime, SX0, SY + 132);

  // spectrum strip: continuum at I_in with the slab's line
  const spY = 320, spH = 70;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(40, spY, W - 80, spH);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(40.5, spY + 0.5, W - 81, spH - 1);
  const contY = spY + spH - 14 - (st.Iin / vmax) * (spH - 26);
  const lineY = spY + spH - 14 - (Iout / vmax) * (spH - 26);
  ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(50, contY); ctx.lineTo(360, contY);
  ctx.lineTo(380, lineY); ctx.lineTo(420, lineY); ctx.lineTo(440, contY);
  ctx.lineTo(W - 50, contY); ctx.stroke();
  ctx.fillStyle = '#64748b'; ctx.font = '11px ui-monospace, monospace';
  const lab = Math.abs(st.S - st.Iin) < 0.03 ? 'no line (S = I_in)' : st.S < st.Iin ? 'absorption line (S < I_in): the slab darkens the source' : 'emission line (S > I_in): the slab brightens it';
  ctx.fillText('observed spectrum:  ' + lab, 50, spY + 14);

  // diagnostic: I vs tau curve with S / I_in references
  const dx0 = 40, dx1 = W - 40, dy0 = 414, dy1 = H - 22;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  ctx.strokeStyle = 'rgba(226,232,240,0.14)'; ctx.strokeRect(dx0 + 0.5, dy0 + 0.5, dx1 - dx0 - 1, dy1 - dy0 - 1);
  ctx.fillStyle = '#64748b'; ctx.font = '10px ui-monospace, monospace';
  ctx.fillText('diagnostic: I(tau) relaxes exponentially toward S', dx0 + 8, dy0 + 13);
  const r = profileVsTau(st.Iin, st.S, st.tau, 160);
  const xP = (tt) => dx0 + 10 + tt / st.tau * (dx1 - dx0 - 20);
  const yP = (iv) => dy1 - 8 - iv / vmax * (dy1 - dy0 - 26);
  ctx.strokeStyle = '#5bc0eb'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(xP(0), yP(st.S)); ctx.lineTo(xP(st.tau), yP(st.S)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < r.I.length; i += 1) { const p = { x: xP(r.taus[i]), y: yP(r.I[i]) }; if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
  ctx.stroke();
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(xP(st.tau), yP(Iout), 4, 0, 6.2832); ctx.fill();

  rI.textContent = Iout.toFixed(3);
}

function tick() { render(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
function bootSync() {
  if (CAPTURE_NAME && DETERMINISTIC) {
    const cases = [
      { Iin: 1, S: 0.2, tau: 0.3 },     // thin: passes through
      { Iin: 4, S: 0.4, tau: 3.5 },     // thick absorption
      { Iin: 0.5, S: 4, tau: 3.5 },     // thick emission
      { Iin: 2, S: 2, tau: 5 },         // S = I_in: no line
      { Iin: 1.5, S: 4.5, tau: 8 },     // strong emission, very thick
    ];
    const frac = Number.isFinite(CAPTURE_FRAC) ? Math.max(0, Math.min(1, CAPTURE_FRAC)) : 0;
    const c = cases[Math.min(cases.length - 1, Math.round(frac * (cases.length - 1)))];
    st.Iin = c.Iin; st.S = c.S; st.tau = c.tau;
    sI.value = String(st.Iin); vI.textContent = st.Iin.toFixed(2);
    sS.value = String(st.S); vS.textContent = st.S.toFixed(2);
    sT.value = String(st.tau); vT.textContent = st.tau.toFixed(2);
  }
  render();
  if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); }));
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
