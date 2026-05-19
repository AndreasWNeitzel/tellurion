// Thin wrapper around the shared special-relativity optics engine for
// the starship hero. Renderer and invariants both consume this; the
// same exact Lorentz transforms are exercised by invariants.test.mjs.
export {
  gamma, aberrateCos, deaberrateCos, dopplerFactor, beamingFactor,
  contractedLength, properTime, boostEvent, interval2, shiftedWavelength,
  wavelengthRGB,
} from '../../../shared/js/engine/special-relativity-cpu.js';
