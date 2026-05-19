// Toy CMB temperature power spectrum: D_l = l(l+1) C_l / 2 pi.
// Simple model with acoustic peaks: D_l ~ A_s exp(-l^2 / l_damp^2) (1 + sum_k B_k cos(l / l_k))
// Reference: Liddle Cosmology Ch. 12 (`liddle-cosmology`); Weinberg Cosmology Ch. 7
// (`weinberg-cosmology`).
export function Dl(l, ls = 220, damp = 2000, amps = [1, 0.4, 0.5, 0.25, 0.3]) {
  // Acoustic peaks at integer multiples of ls (~ 220).
  let s = 1;
  for (let k = 1; k <= amps.length; k += 1) {
    s += amps[k - 1] * Math.cos(Math.PI * l / (k * ls));
  }
  return 1.5 * Math.max(0.05, s) * Math.exp(-Math.pow(l / damp, 2)) * Math.pow(l / 200, 1.2);
}
export function firstPeakL(Omega_m) {
  // l_A roughly = pi (D_A / r_s). Slight shift with Omega_m.
  return 220 + 50 * (0.3 - Omega_m);
}

// Hero synthesis (appended; Dl / firstPeakL above are unchanged).
import { makeRng } from '../../../shared/js/render/rng.js';

// C_l from the toy D_l: D_l = l(l+1) C_l / 2 pi, so C_l is
// 2 pi D_l / (l(l+1)).
export function clFromDl(l, ls = 220, damp = 2000) {
  return 2 * Math.PI * Dl(l, ls, damp) / (l * (l + 1));
}

// A flat-sky CMB patch is an isotropic Gaussian random field whose
// angular power spectrum is C_l. Synthesize it as a sum of random
// plane waves: the multipole l is drawn (rejection) from the 2D power
// density l C_l, so the dominant ripple size is the acoustic-peak
// scale; direction and phase are random; equal amplitude, so by the
// central limit theorem the sum is a Gaussian field.
export function synthModes(n, ls = 220, damp = 2000, seed = 0xC0FFEE, lHi = 2600) {
  const rng = makeRng(seed);
  const w = (l) => l * clFromDl(l, ls, damp);
  let wMax = 1e-30;
  for (let l = 2; l <= lHi; l += 4) { const v = w(l); if (v > wMax) wMax = v; }
  wMax *= 1.05;
  const modes = [];
  let guard = 0;
  while (modes.length < n && guard < n * 250) {
    guard += 1;
    const l = 2 + rng() * (lHi - 2);
    if (rng() * wMax > w(l)) continue;
    const phi = rng() * 2 * Math.PI;
    modes.push({ l, kx: Math.cos(phi), ky: Math.sin(phi), psi: rng() * 2 * Math.PI });
  }
  return modes;
}

// Field value at normalized patch coordinate (u, v) in [0,1]^2 from
// the first `count` modes. The ripple count across the patch is
// l / lScale, so a larger acoustic-peak l gives finer mottling. The
// 1/sqrt(count) keeps the variance O(1) as modes accumulate.
export function fieldValue(modes, count, u, v, lScale = 90) {
  const m = Math.min(count, modes.length);
  if (m <= 0) return 0;
  let s = 0;
  for (let i = 0; i < m; i += 1) {
    const md = modes[i];
    const cyc = (md.l / lScale) * 2 * Math.PI;
    s += Math.cos(cyc * (md.kx * u + md.ky * v) + md.psi);
  }
  return s / Math.sqrt(m);
}
