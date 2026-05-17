// Headless physics for the Rayleigh-Benard playground. The numerics
// live in the gate-tested shared Boussinesq engine
// (shared/js/engine/boussinesq-2d-cpu.js, tested in
// tests/engines/boussinesq-2d-cpu.test.mjs); this re-exports it so
// invariants.test.mjs validates the exact linear-onset code the
// playground renders. No DOM, deterministic.
export {
  createState, step, nusselt, project, divergenceMax,
  RA_C, K_C, LAMBDA_C, discreteRaC, linearSigma,
} from '../../../shared/js/engine/boussinesq-2d-cpu.js';
