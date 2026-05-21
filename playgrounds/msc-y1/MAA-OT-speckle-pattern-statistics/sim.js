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

// Boiling speckle. The field is a sum of n random plane-wave modes,
// each one GLOBAL (it spans the whole grid), so every pixel is a sum
// of n random phasors. By the central limit theorem the real and
// imaginary parts are then Gaussian and the intensity |sum|^2 is
// negative-exponential, i.e. fully developed speckle with contrast
// V = sigma/mean -> 1. (The earlier localised-Gaussian-blob field
// left most pixels covered by 0-1 modes, which is not a phasor sum
// and gave V ~ 2.) Each mode's phase advances at its own seeded rate
// so the pattern boils. The k-vectors fill a disk whose radius sets
// ~(D/r0)^2 speckles across N_x. The unused w argument is kept for
// call-signature compatibility. Goodman, Speckle Phenomena, Ch. 3.
export function boilField(N_x, D_r0, w, t, seed = 0xC0FFEE) {
  void w;
  const rng = makeRng(seed);
  const n = Math.max(1, Math.round(D_r0 * D_r0));
  const kMax = Math.PI * Math.max(1, D_r0) / N_x;
  const re = new Float32Array(N_x * N_x);
  const im = new Float32Array(N_x * N_x);
  for (let k = 0; k < n; k += 1) {
    const ang = rng() * 2 * Math.PI;
    const kr = kMax * Math.sqrt(rng());           // uniform over the k-disk
    const kx = kr * Math.cos(ang), ky = kr * Math.sin(ang);
    const om = 0.4 + 1.6 * rng();                 // per-mode boil rate
    const ph0 = rng() * 2 * Math.PI + om * t;
    for (let py = 0; py < N_x; py += 1) {
      for (let px = 0; px < N_x; px += 1) {
        const phase = kx * px + ky * py + ph0;
        re[py * N_x + px] += Math.cos(phase);
        im[py * N_x + px] += Math.sin(phase);
      }
    }
  }
  const I = new Float32Array(N_x * N_x);
  for (let i = 0; i < I.length; i += 1) I[i] = (re[i] * re[i] + im[i] * im[i]) / n;
  return I;
}

// Fully developed speckle has negative-exponential intensity
// statistics: p(I) = exp(-I / Ibar) / Ibar  (Ibar = mean intensity).
export function negExpPdf(I, Ibar) {
  if (Ibar <= 0) return 0;
  return Math.exp(-I / Ibar) / Ibar;
}
