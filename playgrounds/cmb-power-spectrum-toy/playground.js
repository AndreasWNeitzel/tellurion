// Cmb Power Spectrum Toy playground.
// Replace this stub with the real simulation. Keep the structure: import an engine,
// wire it to canvas, expose a ?seed=N&deterministic=1 URL contract for capture.

import { makeRng, DEFAULT_SEED } from '../../shared/js/render/rng.js';
// import * as engine from '../../shared/js/engine/<engine>.js';

const params         = new URLSearchParams(location.search);
const SEED           = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC  = params.get('deterministic') === '1';
const CAPTURE_NAME   = params.get('capture');
const CAPTURE_FRAC   = parseFloat(params.get('captureFraction') ?? '0');

const canvas       = document.getElementById('stage');
const ctx          = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant');
const readoutFrame = document.getElementById('readout-frame');

const PHYSICS_DT = 1 / 240;
let simClock     = 0;
let accumulator  = 0;
let lastTime     = (typeof performance !== 'undefined' ? performance.now() : Date.now());
let frame        = 0;

const _rng = makeRng(SEED);

// Replace this with engine.create({...})
const sim = {
  energy: 1.0,
  step(dt) {
    this.energy *= 1 - 1e-9 * dt;
  },
  diagnostics() {
    return { energyDrift: this.energy - 1.0 };
  },
};

function render() {
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#FBFBF9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // implementation goes here
}

let lastReadoutTime = 0;
function updateReadout() {
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (now - lastReadoutTime < 100) return;       // 10 Hz throttle
  lastReadoutTime = now;
  const d = sim.diagnostics();
  readoutInv.textContent   = d.energyDrift.toExponential(2);
  readoutFrame.textContent = String(frame);
}

function tick(now) {
  const frameDt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += frameDt;

  while (accumulator >= PHYSICS_DT) {
    sim.step(PHYSICS_DT);
    simClock += PHYSICS_DT;
    accumulator -= PHYSICS_DT;
  }

  render();
  updateReadout();
  frame += 1;
  requestAnimationFrame(tick);
}

function bootSync() {
  // Capture mode: step the simulation to the captured fraction of its total
  // run time, render once, then signal readiness through the simulation-ready
  // flag below. Live mode: kick off the rAF loop.
  if (CAPTURE_NAME) {
    const frac = Number.isFinite(CAPTURE_FRAC) ? CAPTURE_FRAC : 0;
    const TOTAL_T = 1.0;     // edit per playground
    const stepsNeeded = Math.round(frac * TOTAL_T / PHYSICS_DT);
    for (let i = 0; i < stepsNeeded; i += 1) {
      sim.step(PHYSICS_DT);
      simClock += PHYSICS_DT;
    }
    render();
    updateReadout();
  } else {
    render();
    updateReadout();
  }

  if (DETERMINISTIC) {
    // Two rAFs: first lets the browser flush the synchronous render, second
    // marks the page ready. visual.test.mjs and capture-reference.mjs both
    // poll window.__simulationReady.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const detail = { capture: CAPTURE_NAME ?? null, seed: SEED, simClock };
        window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
        window.__simulationReady = true;
        window.__simulationReadyDetail = detail;
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootSync();
    if (!CAPTURE_NAME) requestAnimationFrame(tick);
  }, { once: true });
} else {
  bootSync();
  if (!CAPTURE_NAME) requestAnimationFrame(tick);
}
