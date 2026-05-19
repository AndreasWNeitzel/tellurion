// Thin wrapper around the shared Meissner engine for the
// superconductor-meissner-3d hero. Renderer and invariants both
// consume this exact image-dipole electromagnetism.
export {
  lambdaL, criticalField, isSuperconducting, dipoleField, fieldAt,
  divergence, levitationForce, levitationHeight, penetrationProfile,
} from '../../../shared/js/engine/meissner-cpu.js';
