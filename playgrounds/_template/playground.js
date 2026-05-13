// __TITLE__ playground.
// Replace this stub with the real simulation. Keep the structure: import an engine,
// wire it to canvas, expose a `?seed=N&deterministic=1` URL contract for capture.

import { makeRng, DEFAULT_SEED } from '../../shared/js/render/rng.js';
// import * as engine from '../../shared/js/engine/<engine>.js';

const params = new URLSearchParams(location.search);
const SEED = parseInt(params.get('seed') ?? DEFAULT_SEED, 16) || DEFAULT_SEED;
const DETERMINISTIC = params.get('deterministic') === '1';

const canvas   = document.getElementById('stage');
const ctx      = canvas.getContext('2d', { alpha: false });
const readoutInv   = document.getElementById('readout-invariant');
const readoutFrame = document.getElementById('readout-frame');

const PHYSICS_DT = 1 / 240;
let simClock     = 0;
let accumulator  = 0;
let lastTime     = performance.now();
let frame        = 0;

const rng = makeRng(SEED);

// Replace this with engine.create({...})
const sim = {
  energy: 1.0,
  step(dt) {
    // placeholder: do something deterministic
    this.energy *= 1 - 1e-9 * dt;
  },
  diagnostics() {
    return { energyDrift: this.energy - 1.0 };
  }
};

function tick(now) {
  const frameDt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += DETERMINISTIC ? PHYSICS_DT : frameDt;

  while (accumulator >= PHYSICS_DT) {
    sim.step(PHYSICS_DT);
    simClock += PHYSICS_DT;
    accumulator -= PHYSICS_DT;
  }

  render(ctx, sim);
  updateReadout(sim, frame);
  frame += 1;

  if (DETERMINISTIC) {
    const detail = { frame, simClock };
    window.dispatchEvent(new CustomEvent('simulation-ready', { detail }));
    window.__simulationReady = true;
    window.__simulationReadyDetail = detail;
  }
  requestAnimationFrame(tick);
}

function render(ctx, sim) {
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#FBFBF9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // implementation goes here
}

let lastReadoutTime = 0;
function updateReadout(sim, frame) {
  const now = performance.now();
  if (now - lastReadoutTime < 100) return;       // 10 Hz throttle
  lastReadoutTime = now;
  const d = sim.diagnostics();
  readoutInv.textContent  = d.energyDrift.toExponential(2);
  readoutFrame.textContent = String(frame);
}

requestAnimationFrame(tick);
