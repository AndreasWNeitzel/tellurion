// Atmospheric speckle: a short-exposure image of an unresolved star through atmospheric
// turbulence shows a speckle pattern of approximately N = (D / r_0)^2 speckles, each
// of size ~ lambda / D. The pattern statistics follow negative-exponential intensity:
//   p(I) dI = exp(-I / <I>) / <I> dI.
// Reference: Roddier, Adaptive Optics in Astronomy (`hardy-ao`); Goodman, Speckle Phenomena
// in Optics (`goodman-speckle`).
import { makeRng } from '../../../shared/js/render/rng.js';
export function speckleField(N_x, D_r0, lambda_per_D_px, seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  const N_speckles = Math.round(D_r0 * D_r0);
  const field = new Float32Array(N_x * N_x);
  let maxI = 0;
  for (let k = 0; k < N_speckles; k += 1) {
    const x0 = rng() * N_x, y0 = rng() * N_x;
    const phase = rng() * 2 * Math.PI;
    const w = lambda_per_D_px;
    for (let py = 0; py < N_x; py += 1) for (let px = 0; px < N_x; px += 1) {
      const dx = (px - x0), dy = (py - y0);
      const v = Math.exp(-(dx * dx + dy * dy) / (w * w)) * Math.cos(phase);
      field[py * N_x + px] += v;
    }
  }
  // Intensity = |field|^2.
  const I = new Float32Array(N_x * N_x);
  for (let i = 0; i < field.length; i += 1) { I[i] = field[i] * field[i]; if (I[i] > maxI) maxI = I[i]; }
  return I;
}
export function expectedSpeckleCount(D, r0) { return (D / r0) ** 2; }
