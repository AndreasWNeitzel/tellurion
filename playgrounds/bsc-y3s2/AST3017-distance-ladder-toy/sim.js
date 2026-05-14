// Cosmic distance ladder: parallax -> Cepheid -> Type Ia SN -> Hubble flow.
// For each rung, simulate a fractional error and how that propagates to the next.
// Reference: Carroll-Ostlie Ch. 24 (`carroll-ostlie`); Liddle Ch. 7 (`liddle-cosmology`).
import { makeRng } from '../../../shared/js/render/rng.js';
export const RUNGS = ['parallax', 'cepheid', 'snIa', 'hubble'];
export const RANGE_PC = {
  parallax: [1, 1e3],
  cepheid: [1e3, 1e8],
  snIa: [1e8, 5e9],
  hubble: [5e9, 1e11],
};
// Propagate calibration uncertainty rung-to-rung.
export function ladderUncertainty(sigmas) {
  let total = 0;
  for (const s of sigmas) total += s * s;
  return Math.sqrt(total);
}
// Distance modulus mu = 5 log10(d/pc) - 5.
export function distanceModulus(d_pc) { return 5 * Math.log10(d_pc) - 5; }
