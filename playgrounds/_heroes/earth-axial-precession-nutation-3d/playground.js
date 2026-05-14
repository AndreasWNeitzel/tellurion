import { precessionLongitude, nutation, obliquity, EPS0_DEG, PREC_RATE_ARCSEC_YR } from './sim.js';
import { setupEarthGL } from '../../../shared/js/engine-gl/earth-rotation.js';
const params = new URLSearchParams(location.search);
const DETERMINISTIC = params.get('deterministic') === '1';
const CAPTURE_NAME = params.get('capture');
const CAPTURE_FRAC = parseFloat(params.get('captureFraction') ?? '0');
const canvas = document.getElementById('stage');
const rE = document.getElementById('readout-e');
const sS = document.getElementById('slider-s'), vS = document.getElementById('value-s');
const sY = document.getElementById('slider-y'), vY = document.getElementById('value-y');
const btnR = document.getElementById('btn-reset'), btnP = document.getElementById('btn-pause');
let st = { scale: 2, year0: 0, t: 0 }; let running = true;
sS.addEventListener('input', () => { st.scale = parseFloat(sS.value); vS.textContent = st.scale.toFixed(1); });
sY.addEventListener('input', () => { st.year0 = parseFloat(sY.value); vY.textContent = st.year0.toFixed(0); });
btnR.addEventListener('click', () => { st.t = 0; running = true; btnP.textContent = 'Pause'; btnP.setAttribute('aria-pressed','false'); });
btnP.addEventListener('click', () => { running = !running; btnP.textContent = running ? 'Pause' : 'Play'; btnP.setAttribute('aria-pressed', String(!running)); });
let gl = null; try { gl = setupEarthGL(canvas); } catch (e) { console.warn('webgl2 earth init failed', e); }
let last = performance.now();
function render() {
  const yearsTotal = Math.pow(10, st.scale) * 100;
  const phase = ((running ? st.t * 0.5 : 0) % 1);
  const year_now = st.year0 + phase * yearsTotal;
  const eps = obliquity(year_now);
  const psi = precessionLongitude(year_now) / 3600;
  if (gl) gl.render(st.t, eps, psi);
  rE.textContent = `${eps.toFixed(3)}°`;
}
function tick(now) { const dt = (now - last) / 1000; last = now; if (running) st.t += dt; render(); requestAnimationFrame(tick); }
function bootSync() { st.t = CAPTURE_FRAC * 2; render(); if (DETERMINISTIC) requestAnimationFrame(() => requestAnimationFrame(() => { window.__simulationReady = true; window.dispatchEvent(new CustomEvent('simulation-ready', { detail: { capture: CAPTURE_NAME ?? null } })); })); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', () => { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }, { once: true }); } else { bootSync(); if (!CAPTURE_NAME) requestAnimationFrame(tick); }
