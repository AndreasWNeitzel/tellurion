// sim.js
// Top-down rotating spiral galaxy. Three rotation-curve models share the
// same visible-matter inventory but differ in how the unseen mass is
// distributed: a pure point mass (Keplerian outer fall-off), visible matter
// only (bulge + Miyamoto-Nagai disk, no halo), and visible + NFW dark-matter
// halo. The tracer-star set is the same across models; what changes is the
// angular speed at each radius.
//
// Units: R in kpc, v in km/s, time in Gyr. The conversion 1 km/s =
// 1.022e-3 kpc/Myr = 1.022 kpc/Gyr lets us express omega(R) in rad/Gyr as
//   omega(R) = v(R) * 1.022 / R.

import { makeRng, gaussian } from '../../shared/js/render/rng.js';

export const G = 4.302e4;                         // (kpc)(km/s)^2 per 1e10 M_sun
export const KMS_TO_KPC_GYR = 1.022;              // conversion factor (Vallee 2017)

// Hernquist bulge:    v_b^2(R) = G M_b R / (R + a_b)^2.
export function vBulge2(R, Mb, ab) {
  return G * Mb * R / ((R + ab) * (R + ab));
}

// Miyamoto-Nagai disk at z = 0: v_d^2 = G M_d R^2 / (R^2 + (a + b)^2)^{3/2}.
export function vDisk2(R, Md, ad, bd) {
  const denom = R * R + (ad + bd) * (ad + bd);
  return G * Md * R * R / Math.pow(denom, 1.5);
}

// NFW halo: M_200 in 1e12 M_sun, R_200 [kpc] = 206 * (M_200)^{1/3}, r_s = R_200/c.
export function r200OfM200(M200_1e12) {
  return 206 * Math.cbrt(M200_1e12);
}

export function vHalo2(R, M200_1e12, c) {
  const R200 = r200OfM200(M200_1e12);
  const rs = R200 / c;
  const x = R / rs;
  const gOfC = Math.log(1 + c) - c / (1 + c);
  const fOfX = Math.log(1 + x) - x / (1 + x);
  return G * (M200_1e12 * 100) * fOfX / (R * gOfC);
}

// Keplerian (all visible mass concentrated at the centre, no halo): v(R) =
// sqrt(G * M_tot / R) with M_tot = M_b + M_d. Diverges at small R; we cap
// at R = 0.5 kpc to keep tracer stars finite-omega in the bulge.
export function vKepler2(R, Mb, Md) {
  const Reff = Math.max(R, 0.5);
  return G * (Mb + Md) / Reff;
}

// Rigid-body rotation: v(R) = k R, which makes omega = v/R = k constant.
// Pedagogically useful because it is the unique rotation law that does NOT
// wind a material spiral pattern. We pick k so that v(R = 8 kpc) = 220 km/s
// matches the solar-circle benchmark.
export const RIGID_BODY_K = 220 / 8;       // (km/s) / kpc -> 27.5
export function vRigid2(R) {
  const v = RIGID_BODY_K * R;
  return v * v;
}

// Default visible-matter inventory matching a Milky-Way-ish galaxy.
export const VISIBLE_PARAMS = {
  Mb: 1.0,
  ab: 0.5,
  Md: 6.0,
  ad: 4.0,
  bd: 0.3,
};

// Default dark-matter inventory for the DM model.
export const DM_PARAMS = {
  M200: 1.5,
  c: 12,
};

export const MODELS = {
  rigid:    { label: 'Rigid-body (v proportional R)', hasDisk: false, hasHalo: false },
  kepler:   { label: 'Keplerian (point mass)',        hasDisk: false, hasHalo: false },
  visible:  { label: 'Visible matter only',           hasDisk: true,  hasHalo: false },
  dm:       { label: 'Visible + dark matter',         hasDisk: true,  hasHalo: true  },
};

// Circular velocity squared for a given model. R in kpc, returns (km/s)^2.
export function vModel2(R, model) {
  switch (model) {
    case 'rigid':
      return vRigid2(R);
    case 'kepler':
      return vKepler2(R, VISIBLE_PARAMS.Mb, VISIBLE_PARAMS.Md);
    case 'visible':
      return vBulge2(R, VISIBLE_PARAMS.Mb, VISIBLE_PARAMS.ab)
           + vDisk2(R, VISIBLE_PARAMS.Md, VISIBLE_PARAMS.ad, VISIBLE_PARAMS.bd);
    case 'dm':
      return vBulge2(R, VISIBLE_PARAMS.Mb, VISIBLE_PARAMS.ab)
           + vDisk2(R, VISIBLE_PARAMS.Md, VISIBLE_PARAMS.ad, VISIBLE_PARAMS.bd)
           + vHalo2(R, DM_PARAMS.M200, DM_PARAMS.c);
    default:
      throw new Error(`unknown model ${model}`);
  }
}

export function vModel(R, model) {
  return Math.sqrt(Math.max(vModel2(R, model), 0));
}

// Angular speed in rad/Gyr.
export function omegaModel(R, model) {
  if (R <= 0) return 0;
  return vModel(R, model) * KMS_TO_KPC_GYR / R;
}

// Synthetic "observed" rotation curve from the DM model (the truth).
export const DATA_RADII = (() => {
  const out = [];
  for (let i = 0; i < 16; i += 1) {
    const t = i / 15;
    out.push(Math.exp(Math.log(1) + t * (Math.log(28) - Math.log(1))));
  }
  return out;
})();
export const DATA_SIGMA = 6;     // km/s noise floor

export function syntheticObservations(seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  return DATA_RADII.map(R => ({
    R,
    v: vModel(R, 'dm') + gaussian(rng, 0, DATA_SIGMA),
  }));
}

// Sum of squared residuals between a model and the data, in units of sigma^2.
export function chiSquared(model, data) {
  let chi2 = 0;
  for (const { R, v } of data) {
    const r = (v - vModel(R, model)) / DATA_SIGMA;
    chi2 += r * r;
  }
  return chi2;
}

// Tracer-star population for the top-down view. Stars are arranged into N_arm
// logarithmic spiral arms with stars at log-spaced radii from R_min to R_max;
// a separate bulge population fills the central region. The seed is the
// project default 0xC0FFEE so the visual is deterministic.
export const GALAXY_DEFAULTS = {
  Rmin:      1.0,                  // kpc, innermost arm tracer
  Rmax:      25.0,                 // kpc, outermost arm tracer
  N_arms:    4,
  N_per_arm: 80,
  pitch:     0.55,                 // log-spiral pitch parameter alpha; phi = alpha * ln(R/Rmin)
  sigmaPhi:  0.07,                 // azimuthal scatter (rad)
  sigmaR:    0.18,                 // radial scatter (kpc)
  N_bulge:   140,
  R_bulge:   1.5,                  // kpc, FWHM of the bulge population
};

export function buildGalaxy(seed = 0xC0FFEE, opts = {}) {
  const cfg = Object.assign({}, GALAXY_DEFAULTS, opts);
  const rng = makeRng(seed);

  const stars = [];

  // Spiral arm stars
  for (let arm = 0; arm < cfg.N_arms; arm += 1) {
    const phiArm = (2 * Math.PI * arm) / cfg.N_arms;
    for (let i = 0; i < cfg.N_per_arm; i += 1) {
      const t = i / (cfg.N_per_arm - 1);
      const R = Math.exp(Math.log(cfg.Rmin) + t * (Math.log(cfg.Rmax) - Math.log(cfg.Rmin)));
      const phi = phiArm + cfg.pitch * Math.log(R / cfg.Rmin) + gaussian(rng, 0, cfg.sigmaPhi);
      const Rj  = Math.max(0.3, R + gaussian(rng, 0, cfg.sigmaR));
      stars.push({ R: Rj, phi0: phi, kind: 'arm' });
    }
  }

  // Bulge stars: Gaussian cloud at origin, fast inner rotation.
  for (let i = 0; i < cfg.N_bulge; i += 1) {
    const Rj  = Math.abs(gaussian(rng, 0, cfg.R_bulge));
    const phi = 2 * Math.PI * (i / cfg.N_bulge);   // deterministic angular spread
    stars.push({ R: Math.max(0.1, Rj), phi0: phi, kind: 'bulge' });
  }

  return stars;
}

// Advance the galaxy in time to t (Gyr) under the chosen model. Pure
// function of (stars, t, model); no internal state.
export function galaxyAt(stars, t, model) {
  const out = new Array(stars.length);
  for (let i = 0; i < stars.length; i += 1) {
    const s = stars[i];
    const omega = omegaModel(s.R, model);
    const phi   = s.phi0 + omega * t;
    out[i] = { x: s.R * Math.cos(phi), y: s.R * Math.sin(phi), R: s.R, kind: s.kind };
  }
  return out;
}
