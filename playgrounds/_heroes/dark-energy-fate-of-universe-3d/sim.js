// Headless physics for the dark-energy-fate-of-universe-3d hero.
// Re-exports the shared Friedmann engine and adds presets that
// correspond to the three classic fates (Big Crunch, heat death,
// accelerating de Sitter). Reference: Ryden, Introduction to
// Cosmology, 2nd ed., CUP 2017, Ch. 5-6 (`ryden2017`); Dodelson,
// Modern Cosmology, 2nd ed., Academic 2020, Ch. 2.

export {
  curvature, friedmannE, hubble, integrateScaleFactor, scaleAt,
} from '../../../shared/js/engine/friedmann-cpu.js';

// Three canonical models, all with Om_r = 0 (radiation negligible
// today). Closed matter-dominated -> Big Crunch; flat matter-only ->
// indefinite power-law slowing -> "heat death" / cold expansion;
// concordance LCDM -> de Sitter exponential expansion.
export const PRESETS = {
  bigcrunch: { r: 0, m: 1.8, L: 0.0 },     // Om_k = -0.8 closed
  heatdeath: { r: 0, m: 1.0, L: 0.0 },     // flat matter-only
  lcdm:      { r: 0, m: 0.31, L: 0.69 },   // observed LCDM
  bigrip:    { r: 0, m: 0.20, L: 1.30 },   // phantom-ish DE (cartoon)
};

// Fate classifier for the readout.
export function fateOf(Om) {
  const Ok = 1 - (Om.r ?? 0) - (Om.m ?? 0) - (Om.L ?? 0);
  if (Ok < -0.01 && (Om.L ?? 0) < 1e-3) return 'Big Crunch';
  if ((Om.L ?? 0) > 1.0) return 'Big Rip (cartoon)';
  if ((Om.L ?? 0) > 0.5) return 'de Sitter / accelerating';
  if (Math.abs(Ok) < 0.05 && (Om.L ?? 0) < 0.05) return 'heat death';
  return 'open expansion';
}
