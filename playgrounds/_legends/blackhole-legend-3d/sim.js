// Headless physics for the Black-Hole Legend. A legend playground
// is a hero-of-heroes: full laboratory for a single object. This one
// covers Schwarzschild and Kerr black holes through five modes:
// overview (disk + photon sphere + ISCO), photons (impact-parameter
// scan), lensing (movable background source with Einstein ring),
// frame drag (Kerr ergosphere + ISCO retreat), and spacetime
// (embedding-diagram wireframe). All physics is closed-form.
//
// References:
//   Misner, Thorne, Wheeler, Gravitation, W. H. Freeman 1973.
//     `mtw-gravitation`.
//   Bardeen, Press, Teukolsky, ApJ 178 (1972) 347. `bardeen-press-teukolsky-1972`.
//   Luminet, Astron. Astrophys. 75 (1979) 228 (BH image). `luminet-1979`.
//   Refsdal, Mon. Not. R. Astron. Soc. 128 (1964) 295 (gravitational lensing). `refsdal-1964`.

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
