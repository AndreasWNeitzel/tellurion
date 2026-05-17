// Headless physics for the navier-stokes-2d-gpu-fullscreen
// playground. The numerics live in the gate-tested shared MAC
// Chorin engine (shared/js/engine/chorin-2d-cpu.js, tested in
// tests/engines/chorin-2d-cpu.test.mjs); this module only re-exports
// it so invariants.test.mjs validates the exact code the WebGL2
// renderer mirrors. No DOM, deterministic.

export {
  createState, setBlockObstacle, step, project, divergenceMax,
  vorticity, cellVelocity, advectScalar, strouhal,
} from '../../../shared/js/engine/chorin-2d-cpu.js';
