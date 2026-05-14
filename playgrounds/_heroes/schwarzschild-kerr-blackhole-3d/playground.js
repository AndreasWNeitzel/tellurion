import { iscoKerr, horizonOuter, bCritSchwarzschild } from './sim.js';
import { setupBHGL } from '../../../shared/js/engine-gl/schwarzschild-kerr.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const rR = document.getElementById('readout-r');
const sA = document.getElementById('slider-a'), vA = document.getElementById('value-a');
const sI = document.getElementById('slider-i'), vI = document.getElementById('value-i');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { aOverM: 0, incl: 20, t: 0 }; let running = true;
sA.addEventListener('input', () => { st.aOverM = parseFloat(sA.value); vA.textContent = st.aOverM.toFixed(2); });
sI.addEventListener('input', () => { st.incl = parseFloat(sI.value); vI.textContent = st.incl.toFixed(0); });
btnR.addEventListener('click', () => { st.aOverM = 0; sA.value = 0; vA.textContent = '0.00'; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let gl = null; try { gl = setupBHGL(canvas); } catch (e) { console.warn('webgl2 bh init failed', e); }
let last = performance.now();
function render() {
  if (gl) gl.render(st.t, st.aOverM, st.incl);
  const rH = horizonOuter(st.aOverM);
  const rISCO = iscoKerr(st.aOverM);
  rR.textContent = `${rISCO.toFixed(2)} M`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
