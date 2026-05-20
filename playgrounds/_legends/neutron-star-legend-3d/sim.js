// Headless physics for the Neutron Star Legend. Five modes:
//   Overview, Lighthouse, Magnetar, Structure (TOV M-R), Spindown.
// All closed form or 1D ODE integration; no global state.
//
// References:
//   Shapiro and Teukolsky, Black Holes, White Dwarfs and Neutron Stars,
//     Wiley 1983, Ch. 9 - 10. `shapiro-teukolsky-bh-wd-ns`.
//   Lattimer and Prakash, ApJ 550 (2001) 426. `lattimer-prakash-mass-radius`.
//   Lorimer and Kramer, Handbook of Pulsar Astronomy, 2005.
//     `lorimer-kramer-pulsar-handbook`.
//   Hurley et al., Nature 434 (2005) 1098 (SGR 1806-20 giant flare).

const G = 6.6743e-11;
const C = 2.998e8;
const M_SUN = 1.989e30;

// =========================================================================
// NS geometry
// =========================================================================

export function schwarzschildRadius_m(M_solar) {
  return 2 * G * M_solar * M_SUN / (C * C);
}

export function compactness(M_solar, R_m) {
  return schwarzschildRadius_m(M_solar) / R_m;
}

// =========================================================================
// Pulsar lighthouse: pulse profile P(t) as the beam sweeps past the
// observer.
//
// Geometry: spin axis is z; magnetic axis is tilted by alpha from z.
// The line of sight makes angle beta with the spin axis. The angle
// between the line of sight and the magnetic axis at rotation phase
// phi is given by the spherical-law-of-cosines:
//   cos(theta_los) = cos(alpha)cos(beta) + sin(alpha)sin(beta)cos(phi).
// The magnetic-pole emission cone has half-angle rho_beam. A Gaussian
// pulse profile is generated when the line of sight enters the cone.
// =========================================================================
export function pulsePhase(alpha_rad, beta_rad, phi_rad) {
  return Math.cos(alpha_rad) * Math.cos(beta_rad)
       + Math.sin(alpha_rad) * Math.sin(beta_rad) * Math.cos(phi_rad);
}

// Pulse intensity at phase phi (radians); peaks when theta_los = 0
// (line of sight on the magnetic pole). rho_beam is the beam half-width
// in radians. Two beams (poles); the second is at phi + pi.
export function pulseIntensity(alpha_rad, beta_rad, phi_rad, rho_beam_rad) {
  const c1 = pulsePhase(alpha_rad, beta_rad, phi_rad);
  const c2 = pulsePhase(alpha_rad, beta_rad, phi_rad + Math.PI);
  const theta1 = Math.acos(Math.max(-1, Math.min(1, c1)));
  const theta2 = Math.acos(Math.max(-1, Math.min(1, c2)));
  const sigma2 = rho_beam_rad * rho_beam_rad;
  const I = Math.exp(-(theta1 * theta1) / (2 * sigma2))
          + 0.4 * Math.exp(-(theta2 * theta2) / (2 * sigma2));   // second pole weaker
  return I;
}

// Empirical beam-opening angle scaling (Rankin 1993): rho ~ 6 deg * sqrt(P/1s).
// The visualization floor is bumped to 6 deg so the cones read clearly on
// short-period pulsars (millisecond regime); the physics floor in real
// data is ~ 1 deg.
export function beamHalfAngle_rad(P_s) {
  const deg = 6 * Math.sqrt(Math.max(P_s, 1.0));   // floor at 1 s in arg
  return Math.max(6, Math.min(45, deg)) * Math.PI / 180;
}

// =========================================================================
// Magnetic-dipole spindown.
//   In SI: dE/dt = (B^2 R^6 omega^4 sin^2 alpha) / (6 mu_0 c^3).
//   I approximated as (2/5) M R^2 (uniform-density approx).
//   Omega_dot = -dE/dt / (I Omega).
// =========================================================================
export function spindownPower_W(B_T, R_m, P_s, alpha_rad) {
  const MU_0 = 4 * Math.PI * 1e-7;
  const omega = 2 * Math.PI / P_s;
  return Math.pow(B_T, 2) * Math.pow(R_m, 6) * Math.pow(omega, 4) * Math.pow(Math.sin(alpha_rad), 2)
       / (6 * MU_0 * Math.pow(C, 3));
}

export function spindownPdot_SperS(M_solar, R_m, B_T, P_s, alpha_rad) {
  const I = 0.4 * M_solar * M_SUN * R_m * R_m;
  const omega = 2 * Math.PI / P_s;
  const dOmega_dt = -spindownPower_W(B_T, R_m, P_s, alpha_rad) / (I * omega);
  return -2 * Math.PI * dOmega_dt / (omega * omega);
}

export function characteristicAge_yr(P_s, P_dot_SperS) {
  const SEC_PER_YR = 3.156e7;
  if (P_dot_SperS <= 0) return Infinity;
  return P_s / (2 * P_dot_SperS) / SEC_PER_YR;
}

// =========================================================================
// TOV mass-radius. We use a polynomial fit to several EOS curves that
// captures the qualitative shape: M(R) rising from R = 16 km to a peak
// of ~ 2 M_sun near R = 11 km, then turning over to the unstable branch.
//
// Lattimer and Prakash 2001 ApJ 550 426 give M(R) tables for several EOSs;
// here we use parametric fits good enough for visualisation.
// =========================================================================
function interpMR(pts, N) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const k = t * (pts.length - 1);
    const k0 = Math.floor(k); const k1 = Math.min(pts.length - 1, k0 + 1);
    const f = k - k0;
    out.push({ R: pts[k0].R * (1 - f) + pts[k1].R * f, M: pts[k0].M * (1 - f) + pts[k1].M * f });
  }
  return out;
}

export function massRadiusCurve_SLy(N = 60) {
  const pts = [
    { R: 16.0, M: 0.30 },
    { R: 14.5, M: 0.80 },
    { R: 13.0, M: 1.20 },
    { R: 12.0, M: 1.50 },
    { R: 11.5, M: 1.80 },
    { R: 11.0, M: 2.05 },
    { R: 10.5, M: 2.08 },
    { R: 10.0, M: 2.00 },
    { R: 9.0,  M: 1.70 },
    { R: 8.0,  M: 1.20 },
    { R: 7.0,  M: 0.70 },
  ];
  return interpMR(pts, N);
}

export function massRadiusCurve_APR(N = 60) {
  const pts = [
    { R: 15.5, M: 0.30 },
    { R: 13.5, M: 1.10 },
    { R: 12.0, M: 1.70 },
    { R: 11.5, M: 2.00 },
    { R: 11.0, M: 2.20 },
    { R: 10.5, M: 2.30 },
    { R: 10.0, M: 2.25 },
    { R: 9.5,  M: 2.10 },
    { R: 8.5,  M: 1.50 },
    { R: 7.5,  M: 0.90 },
  ];
  return interpMR(pts, N);
}

export function massRadiusCurve_FPS(N = 60) {
  const pts = [
    { R: 15.0, M: 0.20 },
    { R: 13.0, M: 0.70 },
    { R: 11.5, M: 1.10 },
    { R: 10.5, M: 1.40 },
    { R: 9.5,  M: 1.55 },
    { R: 9.0,  M: 1.60 },
    { R: 8.5,  M: 1.55 },
    { R: 7.5,  M: 1.30 },
    { R: 6.5,  M: 0.80 },
  ];
  return interpMR(pts, N);
}

// Pick the radius corresponding to a given mass on the chosen EOS curve.
export function radiusFromMass_km(M_target_solar, curve) {
  let best = curve[0];
  let bestDelta = Math.abs(curve[0].M - M_target_solar);
  for (const p of curve) {
    const d = Math.abs(p.M - M_target_solar);
    if (d < bestDelta) { best = p; bestDelta = d; }
  }
  return best.R;
}

// =========================================================================
// Interior layer radii (fractional R) for the cross-section visualisation.
//   outer crust:   0.985 .. 1.000  R     (rho < 4e11 g/cc)
//   inner crust:   0.940 .. 0.985  R     (4e11 .. 1.5e14 g/cc, pasta)
//   outer core:    0.500 .. 0.940  R     (n, p, e, mu matter)
//   inner core:    0.000 .. 0.500  R     (exotic phases)
// =========================================================================
export const NS_LAYERS = [
  { name: 'outer crust',  r0: 0.985, r1: 1.000, color: '#8a98c8' },
  { name: 'inner crust',  r0: 0.940, r1: 0.985, color: '#5e7099' },
  { name: 'outer core',   r0: 0.500, r1: 0.940, color: '#3a4b7c' },
  { name: 'inner core',   r0: 0.000, r1: 0.500, color: '#1b2752' },
];

// =========================================================================
// Magnetar flare lightcurve.
// Empirical phenomenology (Hurley et al. 2005): a sharp rise to peak in
// tens of ms, a near-exponential decay over 0.2 to 10 s. We model:
//   L(t) = L_peak * (1 - exp(-t/t_rise)) * exp(-t/t_decay).
// Peak luminosity scales like B^2 from magnetic energy budget.
// =========================================================================
export function magnetarLightcurve(t_s, t_rise_s, t_decay_s) {
  if (t_s < 0) return 0;
  return (1 - Math.exp(-t_s / t_rise_s)) * Math.exp(-t_s / t_decay_s);
}

export function magnetarPeakLuminosity_ergS(B_T) {
  // Empirical: SGR 1806-20 (B = 8e14 G = 8e10 T) peaked at ~ 2e47 erg/s. Scale as B^2.
  const B_ref = 8e10;
  const L_ref = 2e47;
  return L_ref * Math.pow(B_T / B_ref, 2);
}

// =========================================================================
// Glitch model. A glitch is a sudden Delta Omega / Omega ~ 10^-6 spin-up
// that interrupts the secular spindown. After the glitch, partial
// exponential recovery toward the pre-glitch trend with timescale tau_g.
// =========================================================================
export function applyGlitch(P_pre_s, dOmegaOverOmega, t_since_s, tau_g_s) {
  if (t_since_s < 0) return P_pre_s;
  const Q = 0.4;       // recovery fraction
  const dPoverP_eff = -dOmegaOverOmega * (1 - Q * (1 - Math.exp(-t_since_s / tau_g_s)));
  return P_pre_s * (1 + dPoverP_eff);
}

// =========================================================================
// Convenience.
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

export function escapeFraction(M_solar, R_m) {
  return Math.sqrt(2 * G * M_solar * M_SUN / (R_m * C * C));
}
