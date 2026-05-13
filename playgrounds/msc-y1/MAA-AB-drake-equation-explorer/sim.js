// sim.js
// Drake equation: N = R_star * f_p * n_e * f_l * f_i * f_c * L
// where each factor is a probability or rate.
//   R_star: average rate of star formation in the galaxy (1/yr)
//   f_p:    fraction of stars with planets (0..1)
//   n_e:    average number of habitable planets per star with planets
//   f_l:    fraction of habitable planets that develop life (0..1)
//   f_i:    fraction of life-bearing planets that develop intelligence
//   f_c:    fraction of intelligences that develop detectable tech
//   L:      lifetime of detectable signal (yr)
//
// Reference: Carroll-Ostlie, An Introduction to Modern Astrophysics 2e
// Ch. 7 (`carroll-ostlie`).

export const DRAKE_LABELS = [
  { key: 'R_star', label: 'R_star (1/yr)' },
  { key: 'f_p',    label: 'f_p (planets fraction)' },
  { key: 'n_e',    label: 'n_e (habitable planets per system)' },
  { key: 'f_l',    label: 'f_l (life fraction)' },
  { key: 'f_i',    label: 'f_i (intelligence fraction)' },
  { key: 'f_c',    label: 'f_c (detectable fraction)' },
  { key: 'L',      label: 'L (signal lifetime yr)' },
];

export function drakeN({ R_star, f_p, n_e, f_l, f_i, f_c, L }) {
  return R_star * f_p * n_e * f_l * f_i * f_c * L;
}

// Default canonical values (Drake's original 1961 conservative estimate
// updated for modern Kepler-era f_p and n_e).
export const DEFAULTS = {
  R_star: 1.5,    // ~1.5 stars / yr (Robitaille and Whitney 2010)
  f_p:    1.0,    // Kepler: nearly every star has planets
  n_e:    0.4,    // ~0.4 habitable planets per system
  f_l:    0.5,    // unknown; Drake's optimistic
  f_i:    0.1,    // unknown
  f_c:    0.1,    // unknown
  L:      1e4,    // optimistic civilization lifetime
};

// Sample a value from a log-uniform distribution between low and high.
function logUniform(rng, low, high) {
  const ll = Math.log10(low), lh = Math.log10(high);
  return Math.pow(10, ll + (lh - ll) * rng());
}

// Monte Carlo over uncertain factors. Returns array of N values.
// Each factor takes a (low, high) range. Uses provided rng() in [0,1).
export function monteCarlo(rng, ranges, nTrials = 5000) {
  const out = new Float64Array(nTrials);
  for (let i = 0; i < nTrials; i += 1) {
    const params = {};
    for (const [k, [lo, hi]] of Object.entries(ranges)) {
      params[k] = logUniform(rng, lo, hi);
    }
    out[i] = drakeN(params);
  }
  return out;
}
