// Thin wrapper around the shared Friedmann engine for the
// expanding-universe-3d hero. Renderer and invariants both consume
// this; the cosmology and its conservation are tested via these
// exports in invariants.test.mjs.
export {
  curvature, friedmannE, hubble, integrateScaleFactor, scaleAt,
  redshift, recession,
} from '../../../shared/js/engine/friedmann-cpu.js';
