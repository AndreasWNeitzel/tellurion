// Thin wrapper around the shared Friedmann engine for the
// expanding-universe-3d hero. Renderer and invariants both consume
// this; the cosmology and its conservation are tested via these
// exports in invariants.test.mjs.
export {
  curvature, friedmannE, hubble, integrateScaleFactor, scaleAt,
  redshift, recession,
} from '../../../shared/js/engine/friedmann-cpu.js';

// Density fractions Omega_r(a), Omega_m(a), Omega_Lambda(a) for a
// flat FLRW with a radiation component (default Or = 9e-5, Planck).
// Inline-defined here so the merged hero plot doesn't need a second
// engine import. Lifted from the multicomponent playground.
export function densityFractions(a, { Om, OL, Or = 9e-5 }) {
  const ar = Or * Math.pow(a, -4);
  const am = Om * Math.pow(a, -3);
  const al = OL;
  const tot = ar + am + al;
  return { r: ar / tot, m: am / tot, l: al / tot };
}
export function aEqMatterRadiation({ Om, Or = 9e-5 }) { return Or / Om; }
export function aEqMatterLambda({ Om, OL }) { return Math.cbrt(Om / OL); }
