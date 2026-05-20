// Headless physics for the Cosmology Legend. Four modes:
//   Expansion, Fate, CMB, Inflation.
// Wraps the shared Friedmann engine and the slow-roll inflation
// closed forms.
//
// References:
//   Ryden, Introduction to Cosmology, 2nd ed., CUP 2017, Ch. 5 - 6.
//   Mukhanov, Physical Foundations of Cosmology, CUP 2005.
//   Baumann, Cosmology, CUP 2022.
//   Planck Collaboration, A&A 641 (2020) A6.

export {
  curvature, friedmannE, hubble, integrateScaleFactor, scaleAt,
  redshift, recession,
} from '../../../shared/js/engine/friedmann-cpu.js';

// =========================================================================
// PRESETS: four classical fates of the universe.
// =========================================================================
export const FATE_PRESETS = {
  lcdm: { Om: 0.31, Ol: 0.69, label: 'LCDM (our universe)' },
  matter: { Om: 1.00, Ol: 0.00, label: 'matter-only (Einstein-de-Sitter)' },
  closed: { Om: 1.30, Ol: 0.00, label: 'closed (Big Crunch)' },
  empty:  { Om: 0.00, Ol: 0.00, label: 'empty (coasting)' },
};

// =========================================================================
// CMB sky: deterministic random temperature field at the Planck Delta T
// amplitude. We use a fast 2D pseudo-noise on the sphere (lat-lon grid)
// with multi-scale octaves to mimic the visual texture of the
// last-scattering surface.
// =========================================================================
export function cmbDeltaT(theta, phi, seed = 0xC0FFEE) {
  // Multi-octave value noise; magnitude scaled so RMS ~ 1.
  let s = seed >>> 0;
  function hash(x, y) {
    let h = (x * 374761393 ^ y * 668265263 ^ s) >>> 0;
    h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    return (h / 4294967295) * 2 - 1;
  }
  // Sample on lat-lon grid: x = phi (0..2pi), y = theta (0..pi).
  let total = 0;
  let amp = 1.0;
  let freq = 4;
  let norm = 0;
  for (let oct = 0; oct < 5; oct++) {
    const u = phi * freq / (2 * Math.PI);
    const v = theta * freq / Math.PI;
    const x = Math.floor(u), y = Math.floor(v);
    const fx = u - x, fy = v - y;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = hash(x, y), b = hash(x + 1, y), c = hash(x, y + 1), d = hash(x + 1, y + 1);
    const interp = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    total += interp * amp;
    norm += amp;
    amp *= 0.55;
    freq *= 2.1;
  }
  return (total / norm);   // in [-1, 1]
}

// =========================================================================
// SLOW-ROLL INFLATION: epsilon, eta, n_s, r, V(phi) for two potentials.
// (Adapted from MF-GR-inflation-quantum-fluctuations.)
// =========================================================================
const B_STAR = Math.sqrt(2 / 3);

export const POTENTIALS = {
  quadratic: {
    V: (p) => 0.5 * p * p,
    Vp: (p) => p,
    Vpp: () => 1,
    phiStart: 16,
    label: 'phi^2 (excluded by Planck)',
  },
  starobinsky: {
    V: (p) => { const e = 1 - Math.exp(-B_STAR * p); return e * e; },
    Vp: (p) => 2 * (1 - Math.exp(-B_STAR * p)) * B_STAR * Math.exp(-B_STAR * p),
    Vpp: (p) => {
      const x = Math.exp(-B_STAR * p);
      return 2 * B_STAR * B_STAR * x * (2 * x - (1 - x));
    },
    phiStart: 5.5,
    label: 'Starobinsky R^2 (favoured)',
  },
};

export function epsilon(p, pot) {
  const P = POTENTIALS[pot]; const v = P.V(p);
  return 0.5 * (P.Vp(p) / v) ** 2;
}
export function eta(p, pot) {
  const P = POTENTIALS[pot];
  return P.Vpp(p) / P.V(p);
}
export function nsOf(p, pot) { return 1 - 6 * epsilon(p, pot) + 2 * eta(p, pot); }
export function rOf(p, pot) { return 16 * epsilon(p, pot); }

// e-fold count: N(phi) = integral V/V' dphi from phi_end to phi.
// For visualization we use closed forms for the two potentials.
export function efolds_quadratic(p) {
  // For V = phi^2/2: N = (phi^2 - phi_end^2) / 4, with phi_end = sqrt(2).
  const phiEnd2 = 2;
  return Math.max(0, (p * p - phiEnd2) / 4);
}
export function efolds_starobinsky(p) {
  // For V = (1 - e^(-B p))^2: N ~ (3/4) e^(B p) for large p.
  return 0.75 * Math.exp(B_STAR * p) - 1.5;
}

// =========================================================================
// CMB-temperature blackbody scaling (informational).
// =========================================================================
export const T_CMB_NOW = 2.725;       // K
export const Z_LAST_SCATTERING = 1089;
export const T_LAST_SCATTERING = T_CMB_NOW * (1 + Z_LAST_SCATTERING);
// 2.725 * 1090 = 2970 K (about 3000 K, the textbook surface-of-last-scattering temperature).

// =========================================================================
// DETERMINISTIC RNG.
// =========================================================================
export function makeRng(seed = 0xC0FFEE) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
