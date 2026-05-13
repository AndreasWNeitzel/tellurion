// sim.js
// Rotation curve explorer headless core. Analytic mass-component profiles for
// a spiral galaxy: Hernquist bulge, Miyamoto-Nagai disk (z=0), NFW halo.
//
// Units: R in kpc; v in km/s. Masses in 10^10 M_sun for bulge and disk;
// halo M_200 in 10^12 M_sun (the slider works in this larger unit).
// G in (kpc) (km/s)^2 per 10^10 M_sun is 4.302e-6 * 1e10 = 4.302e4.

import { makeRng, gaussian } from '../../shared/js/render/rng.js';

export const G_KPC_KMS_PER_1E10 = 4.302e-6 * 1e10;     // = 43020 in our unit system. Wait actually unit math:
// G in (kpc) (km/s)^2 / M_sun = 4.302e-6.
// So G * (10^10 M_sun) = 4.302e-6 * 1e10 = 4.302e4 in (kpc) (km/s)^2.
export const G = 4.302e4;

// Hernquist bulge: v_b^2(R) = G M_b R / (R + a_b)^2, with M_b in 10^10 M_sun and R, a_b in kpc.
export function vBulge2(R, Mb, ab) {
  return G * Mb * R / ((R + ab) * (R + ab));
}

// Miyamoto-Nagai disk evaluated at z = 0: v_d^2(R) = G M_d R^2 / (R^2 + (a + b)^2)^{3/2}.
export function vDisk2(R, Md, ad, bd) {
  const denom = R * R + (ad + bd) * (ad + bd);
  return G * Md * R * R / Math.pow(denom, 1.5);
}

// NFW halo with M_200 in 10^12 M_sun. R_200 follows from M_200 via mean overdensity 200.
// rho_crit ~ 1.4e-7 M_sun / pc^3 at z=0; we adopt the common approximation
//   R_200 [kpc] = 206 * (M_200 / 10^12 M_sun)^{1/3}
// which makes R_200 in kpc when M_200 is in 10^12. Then r_s = R_200 / c.
export function r200OfM200(M200_1e12) {
  return 206 * Math.cbrt(M200_1e12);
}

export function vHalo2(R, M200_1e12, c) {
  const R200 = r200OfM200(M200_1e12);
  const rs = R200 / c;
  const x = R / rs;
  const gOfC = Math.log(1 + c) - c / (1 + c);
  const fOfX = Math.log(1 + x) - x / (1 + x);
  // The factor 100 here converts M_200 from 10^12 to 10^10 M_sun.
  return G * (M200_1e12 * 100) * fOfX / (R * gOfC);
}

export function vTotal(R, params) {
  const vb2 = vBulge2(R, params.Mb, params.ab);
  const vd2 = vDisk2(R, params.Md, params.ad, params.bd);
  const vh2 = vHalo2(R, params.M200, params.c);
  return Math.sqrt(Math.max(vb2 + vd2 + vh2, 0));
}

// True ("ground-truth") parameters used by the synthetic data set.
export const TRUE_PARAMS = {
  Mb: 1.0,         // 1e10 M_sun
  ab: 0.5,         // kpc
  Md: 6.0,         // 1e10 M_sun
  ad: 4.0,         // kpc
  bd: 0.3,         // kpc
  M200: 1.5,       // 1e12 M_sun
  c: 12,           // dimensionless
};

export const DATA_RADII = (() => {
  const out = [];
  for (let i = 0; i < 18; i += 1) {
    const t = i / 17;
    out.push(Math.exp(Math.log(1) + t * (Math.log(50) - Math.log(1))));
  }
  return out;
})();

export const DATA_SIGMA = 4;   // km/s noise floor

// Build the synthetic data set. Deterministic at seed 0xC0FFEE.
export function syntheticData(seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  return DATA_RADII.map(R => ({
    R,
    v: vTotal(R, TRUE_PARAMS) + gaussian(rng, 0, DATA_SIGMA),
  }));
}

// Chi-squared of model parameters against the synthetic data.
export function chiSquared(params, data) {
  let chi2 = 0;
  // Fold the fixed scale-length parameters into params if missing.
  const p = Object.assign({}, TRUE_PARAMS, params);
  for (const { R, v } of data) {
    const model = vTotal(R, p);
    const r = (v - model) / DATA_SIGMA;
    chi2 += r * r;
  }
  return chi2;
}
