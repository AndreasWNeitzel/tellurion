// Headless physics for the Black-Hole Legend. A legend playground
// is a hero-of-heroes: full laboratory for a single object. This one
// covers Schwarzschild and Kerr black holes through eight modes:
// overview (disk + photon sphere + ISCO), photons (impact-parameter
// scan), lensing (movable background source with Einstein ring),
// frame drag (Kerr ergosphere + ISCO retreat), spacetime
// (embedding-diagram wireframe), ringdown (Kerr quasinormal modes),
// hawking (T_H, evaporation timescale), and TDE (tidal disruption
// event lightcurve). All physics is closed-form.
//
// References:
//   Misner, Thorne, Wheeler, Gravitation, W. H. Freeman 1973.
//     `mtw-gravitation`.
//   Bardeen, Press, Teukolsky, ApJ 178 (1972) 347. `bardeen-press-teukolsky-1972`.
//   Luminet, Astron. Astrophys. 75 (1979) 228 (BH image). `luminet-1979`.
//   Refsdal, Mon. Not. R. Astron. Soc. 128 (1964) 295 (gravitational lensing). `refsdal-1964`.
//   Berti, Cardoso, Will, Phys. Rev. D 73 (2006) 064030 (QNM). `berti-cardoso-will-qnm`.
//   Hawking, Commun. Math. Phys. 43 (1975) 199 (Hawking radiation). `hawking-1975`.
//   Rees, Nature 333 (1988) 523 (TDE). `rees-1988-tde`.

const G = 6.6743e-11;            // m^3 kg^-1 s^-2
const C = 2.998e8;                // m/s
const M_SUN = 1.989e30;           // kg
const PC_M = 3.086e16;            // 1 pc in meters
const KPC_M = 1000 * PC_M;
const AU = 1.496e11;              // m

// Schwarzschild radius in meters.
export function schwarzschildRadius_m(M_solar) {
  return 2 * G * M_solar * M_SUN / (C * C);
}

// Photon-sphere radius (Schwarzschild): r_ph = 3 GM / c^2 = 1.5 R_s.
export function photonSphereRadius_m(M_solar) {
  return 1.5 * schwarzschildRadius_m(M_solar);
}

// Critical impact parameter for photon capture (Schwarzschild):
//   b_c = 3 sqrt(3) GM / c^2 = (3 sqrt 3 / 2) R_s ~ 2.598 R_s.
export function criticalImpactParameter_m(M_solar) {
  return (3 * Math.sqrt(3) / 2) * schwarzschildRadius_m(M_solar);
}

// Innermost stable circular orbit for prograde equatorial Kerr.
// (a = spin parameter J / (M c), dimensionless chi = a/M.)
// Bardeen, Press, Teukolsky 1972, eqs. 2.16-2.18.
export function iscoRadius_m(M_solar, chi = 0) {
  const a = Math.max(0, Math.min(0.999, chi));
  const M = G * M_solar * M_SUN / (C * C);   // in meters
  const Z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const Z2 = Math.sqrt(3 * a * a + Z1 * Z1);
  const r_ISCO = M * (3 + Z2 - Math.sqrt((3 - Z1) * (3 + Z1 + 2 * Z2)));
  return r_ISCO;
}

// Kerr horizon radius (outer): r_+ = M + sqrt(M^2 - a^2) (in G=c=1).
export function kerrHorizonRadius_m(M_solar, chi = 0) {
  const a = Math.max(0, Math.min(0.999, chi));
  const M = G * M_solar * M_SUN / (C * C);
  return M * (1 + Math.sqrt(1 - a * a));
}

// Ergosphere outer boundary in the equatorial plane:
//   r_e(theta = pi/2) = 2 M.
// At pole r_e -> r_+.
export function ergosphereEquator_m(M_solar) {
  // chi-independent at the equator: r_e = 2 M = R_s.
  return schwarzschildRadius_m(M_solar);
}

// Light-bending angle for a photon with impact parameter b
// (Schwarzschild, weak-field limit): delta_phi = 4 GM / (b c^2).
// Strong-field exact: delta_phi diverges logarithmically as b -> b_c.
export function lightBendingAngle_rad(M_solar, b_m) {
  const Rs = schwarzschildRadius_m(M_solar);
  const bc = criticalImpactParameter_m(M_solar);
  if (b_m <= bc) return Infinity;       // captured
  // Beloborodov approximation for the bending angle:
  //   cos alpha = 1 - 2M/r_emit + 2 M/b * ... (use simplified weak + correction)
  // We use the practical "exact" form by integration; here use a
  // simple smooth interpolation: delta = 2 Rs / b * (1 + (b/bc)^(-2))/2.
  const weak = 2 * Rs / b_m;
  const u = bc / b_m;       // <= 1
  return weak * (1 + 0.5 * u * u + 0.4 * Math.pow(u, 4));
}

// Einstein-ring angular radius for a point mass lens at distance D_L,
// source at D_S, with D_LS = D_S - D_L (for low-z, flat-space sums):
//   theta_E = sqrt(4 G M / c^2 * D_LS / (D_L D_S)).
export function einsteinRingRadius_rad(M_solar, D_L_m, D_S_m) {
  const D_LS = Math.max(1, D_S_m - D_L_m);
  return Math.sqrt(4 * G * M_solar * M_SUN / (C * C) * D_LS / (D_L_m * D_S_m));
}

// Image positions for a point mass lens with source at angular
// position beta from the lens: x^2 - beta x - theta_E^2 = 0.
// Two roots: +/- image with magnifications mu_+/- = (1/2)(beta/u +/- 1)
// where u = sqrt(beta^2 + 4 theta_E^2).
export function lensImagePositions_rad(M_solar, beta_rad, D_L_m, D_S_m) {
  const tE = einsteinRingRadius_rad(M_solar, D_L_m, D_S_m);
  const u = Math.sqrt(beta_rad * beta_rad + 4 * tE * tE);
  const x_plus = 0.5 * (beta_rad + u);
  const x_minus = 0.5 * (beta_rad - u);
  return { theta_E: tE, x_plus, x_minus, u };
}

// Total magnification (Refsdal 1964):
//   mu = (u^2 + 2) / (u sqrt(u^2 + 4))
// where u = beta / theta_E.
export function lensMagnification(beta_rad, theta_E_rad) {
  const u = Math.abs(beta_rad) / Math.max(1e-30, theta_E_rad);
  return (u * u + 2) / (u * Math.sqrt(u * u + 4));
}

// Hawking temperature (legendary completeness).
export function hawkingTemperature_K(M_solar) {
  return 6.17e-8 / M_solar;
}

// Gravitational redshift at radius r (Schwarzschild):
//   1 + z = (1 - R_s / r)^(-1/2).
export function gravRedshift(M_solar, r_m) {
  const Rs = schwarzschildRadius_m(M_solar);
  if (r_m <= Rs) return Infinity;
  return Math.pow(1 - Rs / r_m, -0.5) - 1;
}

// Doppler factor for a thin disk: the approaching side at radius r
// has Doppler factor delta = sqrt(1 - 3 R_s / (2 r)) / (1 - v cos
// theta / c), evaluated for circular orbit v = sqrt(R_s c^2 / (2 r))
// at viewing angle theta (radians).
// Returns the apparent flux multiplier delta^4 (for monochromatic
// source moving relative to observer).
export function diskDopplerFactor(M_solar, r_m, viewer_inclination_rad, phi_rad) {
  const Rs = schwarzschildRadius_m(M_solar);
  if (r_m <= 1.5 * Rs) return 0;
  const beta = Math.sqrt(Rs / (2 * r_m));   // Newtonian; circular orbit at r
  // Velocity along the line of sight: v * sin(i) * cos(phi - pi/2).
  const cos_los = Math.sin(viewer_inclination_rad) * Math.cos(phi_rad);
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const delta = 1 / (gamma * (1 - beta * cos_los));
  return Math.pow(delta, 4);
}

// Deterministic RNG.
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

// Trace a photon path in Schwarzschild spacetime via the orbit
// equation in u = 1/r:
//   d^2 u / dphi^2 + u = (3 GM / c^2) u^2 = 1.5 R_s u^2.
// Returns array of (r, phi) sample points. Initial condition: at
// some large r0, photon comes in with impact parameter b. We set up
// from infinity to closest approach and back out using a 4th-order
// Runge-Kutta on the orbit equation.
export function tracePhoton(M_solar, b_m, n_steps = 1200, dphi = 0.005) {
  const Rs = schwarzschildRadius_m(M_solar);
  // u'(0) = sqrt(1/b^2 - u(0)^2 + 1.5 Rs u(0)^3 / 3) ... simpler:
  // start at u = 0 (infinity) with u' = 1/b (geometric: tangent at infinity).
  let u = 0;
  let up = 1 / b_m;       // du/dphi at infinity
  const out = [];
  let phi = 0;
  let captured = false;
  for (let i = 0; i < n_steps; i++) {
    // RK4 on (u, u') with up' = -u + 1.5 Rs u^2
    const f = (uu, uup) => -uu + 1.5 * Rs * uu * uu;
    const k1u = up;
    const k1up = f(u, up);
    const k2u = up + 0.5 * dphi * k1up;
    const k2up = f(u + 0.5 * dphi * k1u, up + 0.5 * dphi * k1up);
    const k3u = up + 0.5 * dphi * k2up;
    const k3up = f(u + 0.5 * dphi * k2u, up + 0.5 * dphi * k2up);
    const k4u = up + dphi * k3up;
    const k4up = f(u + dphi * k3u, up + dphi * k3up);
    u += dphi * (k1u + 2 * k2u + 2 * k3u + k4u) / 6;
    up += dphi * (k1up + 2 * k2up + 2 * k3up + k4up) / 6;
    phi += dphi;
    if (u <= 0) break;
    if (u > 1 / Rs) {       // u > 1/Rs means r < R_s, captured
      captured = true;
      break;
    }
    out.push({ r: 1 / u, phi });
    // Stop after a max angle, to avoid spiraling forever for orbits
    // near b_c.
    if (phi > 8 * Math.PI) break;
  }
  return { path: out, captured };
}

// Convenience: classify a photon trajectory at impact parameter b.
export function classifyPhoton(M_solar, b_m) {
  const bc = criticalImpactParameter_m(M_solar);
  if (b_m < bc) return 'capture';
  if (b_m < 1.02 * bc) return 'orbit';
  return 'escape';
}

// Convenience: schwarzschild radius in convenient units (km).
export function rsKm(M_solar) { return schwarzschildRadius_m(M_solar) / 1000; }

// =========================================================================
// QUASINORMAL MODE (Kerr) ringdown frequency table from Berti-Cardoso-Will
// 2006 PRD 73 064030, dominant (l, m, n) = (2, 2, 0). M omega in geometric
// units; multiply by c^3 / (G M_sun) * (M_sun / M) to get Hz.
// =========================================================================
const QNM_TABLE = [
  [0.00, 0.37367, -0.08896],
  [0.10, 0.38716, -0.08899],
  [0.30, 0.41912, -0.08879],
  [0.50, 0.46044, -0.08775],
  [0.70, 0.51746, -0.08446],
  [0.90, 0.61554, -0.07408],
  [0.99, 0.71988, -0.04540],
];

export function qnmFrequency(chi) {
  const c = Math.max(0, Math.min(0.99, chi));
  for (let k = 0; k < QNM_TABLE.length - 1; k++) {
    if (c <= QNM_TABLE[k + 1][0]) {
      const t = (c - QNM_TABLE[k][0]) / (QNM_TABLE[k + 1][0] - QNM_TABLE[k][0]);
      return {
        omegaR_M: QNM_TABLE[k][1] * (1 - t) + QNM_TABLE[k + 1][1] * t,
        omegaI_M: QNM_TABLE[k][2] * (1 - t) + QNM_TABLE[k + 1][2] * t,
      };
    }
  }
  return { omegaR_M: QNM_TABLE.at(-1)[1], omegaI_M: QNM_TABLE.at(-1)[2] };
}

export function ringdownProperties(M_solar, chi) {
  const { omegaR_M, omegaI_M } = qnmFrequency(chi);
  const M_SUN_SEC = G * M_SUN / Math.pow(C, 3);   // ~ 4.925e-6 s per M_sun
  const M_sec = M_solar * M_SUN_SEC;
  return {
    f_Hz: omegaR_M / (2 * Math.PI * M_sec),
    tau_s: -1 / omegaI_M * M_sec,
    Q: -omegaR_M / (2 * omegaI_M),
  };
}

// =========================================================================
// HAWKING RADIATION evaporation timescale (T_H is already exported above).
// =========================================================================
const HBAR = 1.0546e-34;
const SECONDS_PER_YEAR = 3.156e7;

export function hawkingEvaporationTime_yr(M_solar) {
  // t_evap = 5120 pi G^2 M^3 / (hbar c^4); approx 2.1e67 yr per (M/M_sun)^3.
  const M_kg = M_solar * M_SUN;
  const t_s = (5120 * Math.PI * G * G * Math.pow(M_kg, 3)) / (HBAR * Math.pow(C, 4));
  return t_s / SECONDS_PER_YEAR;
}

// =========================================================================
// TIDAL DISRUPTION EVENT.
// =========================================================================
export function tdeTidalRadius_m(M_BH_solar, M_star_solar = 1, R_star_solar = 1) {
  // R_T = R_star * (M_BH / M_star)^(1/3).
  return R_star_solar * 6.957e8 * Math.pow(M_BH_solar / M_star_solar, 1 / 3);
}

export function tdePeakTime_days(M_BH_solar, M_star_solar = 1, R_star_solar = 1) {
  const R_T = tdeTidalRadius_m(M_BH_solar, M_star_solar, R_star_solar);
  // t_peak = pi R_T^(3/2) / sqrt(2 G M_star)
  const t_s = Math.PI * Math.pow(R_T, 1.5) / Math.sqrt(2 * G * M_star_solar * M_SUN);
  return t_s / 86400;
}

// Phenomenological lightcurve: t^2 rise -> t^(-5/3) decay (Rees 1988).
export function tdeLightcurve(t_days, t_peak_days) {
  if (t_days < 0) return 0;
  if (t_days < t_peak_days) return Math.pow(t_days / t_peak_days, 4);
  return Math.pow(t_days / t_peak_days, -5 / 3);
}

// Whether the SMBH swallows the star whole (Hills mass cutoff).
export function tdeIsDisrupted(M_BH_solar) {
  // R_T > R_S requires M_BH < ~ 10^8 M_sun for a sun-like star.
  return tdeTidalRadius_m(M_BH_solar, 1, 1) > schwarzschildRadius_m(M_BH_solar);
}

// =========================================================================
// KERR STRUCTURE: inner horizon, ergosphere at any latitude, ZAMO angular
// velocity, frame-dragging at horizon.
// =========================================================================

// Inner (Cauchy) horizon r_- = M (1 - sqrt(1 - chi^2)) in geometric units.
// Returns metres.
export function kerrInnerHorizon_m(M_solar, chi = 0) {
  const a = Math.max(0, Math.min(0.999, chi));
  const M = G * M_solar * M_SUN / (C * C);
  return M * (1 - Math.sqrt(1 - a * a));
}

// Ergosphere outer surface at polar angle theta (radians from spin axis).
//   r_e(theta) = M (1 + sqrt(1 - chi^2 cos^2 theta)).
// Equator (theta = pi/2) gives 2M = R_s; poles give r_+. Returns metres.
export function kerrErgosphere_m(M_solar, chi, theta_rad) {
  const a = Math.max(0, Math.min(0.999, chi));
  const M = G * M_solar * M_SUN / (C * C);
  const ct = Math.cos(theta_rad);
  return M * (1 + Math.sqrt(Math.max(0, 1 - a * a * ct * ct)));
}

// Angular velocity of the horizon (frame-dragging rate of a ZAMO at r_+):
//   Omega_H = a / (2 M r_+) in geometric units (c = G = 1).
// Convert to rad/s by multiplying by c^3 / (G M_kg).
export function kerrHorizonAngularVel_radps(M_solar, chi = 0) {
  const a = Math.max(0, Math.min(0.999, chi));
  const M_geo = 1;
  const r_plus_geo = M_geo * (1 + Math.sqrt(1 - a * a));
  const Omega_H_geo = a / (2 * M_geo * r_plus_geo);
  const M_kg = M_solar * M_SUN;
  return Omega_H_geo * Math.pow(C, 3) / (G * M_kg);
}

// ZAMO (zero-angular-momentum observer) angular velocity outside the
// horizon. To leading order in a/r (valid outside the ergosphere):
//   omega(r) ~ 2 a M / r^3 in geometric units.
// Returns the dimensionless ratio omega(r) * M (in geometric units), so
// you can plot it directly against r / M.
export function zamoAngVelGeometric(chi, r_over_M) {
  const a = Math.max(0, Math.min(0.999, chi));
  return 2 * a / (r_over_M * r_over_M * r_over_M);
}

// Tidal acceleration at radius r: a perfectly radial test rod of length L
// resting at radius r in Schwarzschild geometry experiences a stretching
// tidal acceleration delta-a = 2 G M L / r^3 along the radial direction
// (Misner Thorne Wheeler eq. 31.5). Returns m/s^2 per metre of rod length.
export function tidalAccelPerMetre_per_s2(M_solar, r_m) {
  const M_kg = M_solar * M_SUN;
  return 2 * G * M_kg / Math.pow(r_m, 3);
}

// Apparent angular diameter of the BH shadow as seen from far away.
// For Schwarzschild the shadow boundary at infinity is the critical
// impact parameter b_c = 3 sqrt(3) M = 2.598 R_s. The observed angular
// radius is theta_sh = b_c / D for distance D. Returns radians (use
// 1 microarcsec = 4.848e-12 rad to convert).
export function shadowAngularRadius_rad(M_solar, D_m) {
  return criticalImpactParameter_m(M_solar) / D_m;
}

// =========================================================================
// NAMED BH PRESETS. Each preset is a real astrophysical object the user
// can jump to. Spin chi values are best-fit literature estimates.
// =========================================================================
export const BH_PRESETS = [
  {
    id: 'sgrA',
    label: 'Sgr A* (Milky Way nucleus)',
    M_solar: 4.297e6,
    chi: 0.50,
    D_kpc: 8.27,
    note: 'EHT 2022. Distance from GRAVITY; spin loosely constrained.',
  },
  {
    id: 'm87',
    label: 'M87* (Virgo A nucleus)',
    M_solar: 6.5e9,
    chi: 0.94,
    D_kpc: 16800,
    note: 'EHT 2019. Spin from jet power; D from surface-brightness fluctuations.',
  },
  {
    id: 'gw150914',
    label: 'GW150914 merger remnant',
    M_solar: 62,
    chi: 0.69,
    D_kpc: 410_000,
    note: 'LIGO 2016 dominant ringdown fit; first GW detection.',
  },
  {
    id: 'cygx1',
    label: 'Cygnus X-1 (stellar BH)',
    M_solar: 21.2,
    chi: 0.95,
    D_kpc: 2.22,
    note: 'Miller-Jones et al. 2021; X-ray reflection spin.',
  },
  {
    id: 'imbh',
    label: 'IMBH candidate ~ 1e4 Msun',
    M_solar: 1e4,
    chi: 0.30,
    D_kpc: 50_000,
    note: 'Hypothetical intermediate-mass BH; few good candidates known.',
  },
  {
    id: 'primordial',
    label: 'Primordial (1e11 kg)',
    M_solar: 1e11 / M_SUN,
    chi: 0.0,
    D_kpc: 0.001,
    note: 'PBH evaporating today via Hawking radiation (Hawking 1974).',
  },
];

// =========================================================================
// ORBITAL PERIOD AND KEPLERIAN VELOCITY at the equatorial plane (Kerr,
// prograde). For Kerr equatorial circular geodesics the period in
// coordinate time t is
//   T = 2 pi (r^(3/2) + a M^(1/2)) / sqrt(M).
// Returns seconds.
// =========================================================================
export function orbitalPeriod_s(M_solar, chi, r_over_M) {
  const a = Math.max(0, Math.min(0.999, chi));
  const M_geo = 1;
  const T_geo = 2 * Math.PI * (Math.pow(r_over_M, 1.5) + a * Math.sqrt(M_geo));
  const M_sec = G * M_solar * M_SUN / Math.pow(C, 3);
  return T_geo * M_sec;
}
