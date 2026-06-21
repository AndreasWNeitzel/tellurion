// sim.js
// Heavy symmetrical top (gyroscope) under gravity, leading-order precession.
//
// In the limit omega_spin >> Omega_p, the body precesses uniformly:
//   Omega_p = M g r / (I_s omega_s)
//
// where M is the mass, r is the distance from pivot to center of mass,
// I_s is the spin moment of inertia, and omega_s is the spin angular
// velocity.
//
// We model the top with fixed tilt angle theta (no nutation in this
// leading-order model) precessing at Omega_p about the vertical.
//
// Reference: Marion and Thornton, Classical Dynamics 5e Ch. 11
// (`marion-thornton`).

export const M_TOP = 1.0;
export const G_GRAV = 9.81;
export const R_COM = 0.5;        // distance from pivot to center of mass
export const I_SPIN = 0.1;       // moment of inertia about spin axis

// Constant part of the precession rate, Mgr/I_s (so Omega_p = precConst/omega_s).
// Exposed so the diagnostic can sweep the spin rate at fixed M, g, r, I_s.
export function precConst(s) { return s.M * s.g * s.r / s.I_s; }

// Leading-order precession Omega_p = M g r / (I_s omega_s). Accepts the state
// (preferred) or, for back-compat, a bare omega_spin number with default M,g,r.
export function precessionRate(s) {
  if (typeof s === 'number') return M_TOP * G_GRAV * R_COM / (I_SPIN * s);
  return precConst(s) / s.omega_spin;
}

// Spinup state: theta (tilt from vertical), phi (azimuth around vertical),
// psi (spin angle around the body axis), and the physical parameters the user
// can vary: mass M, gravity g, pivot-to-COM arm r, spin inertia I_s.
export function createTop({
  theta = 0.6, omega_spin = 50, phi = 0,
  M = M_TOP, g = G_GRAV, r = R_COM, I_s = I_SPIN,
} = {}) {
  return { theta, phi, psi: 0, omega_spin, M, g, r, I_s, t: 0, nSteps: 0 };
}

// In the leading-order precession approximation, theta is constant,
// phi advances at Omega_p, and psi advances at omega_spin.
export function stepTop(s, dt = 0.005) {
  const Omega_p = precessionRate(s);
  s.phi += Omega_p * dt;
  s.psi += s.omega_spin * dt;
  s.t += dt;
  s.nSteps += 1;
}

// Position of the spin axis tip (top end of the top) for visualization.
// Pivot at origin; spin axis is along the direction (sin(theta) cos(phi),
// sin(theta) sin(phi), cos(theta)). Tip of axis at distance L = 1 (visual
// scale).
export const L_VIS = 1.2;
export function tipPosition(s) {
  return {
    x: L_VIS * Math.sin(s.theta) * Math.cos(s.phi),
    y: L_VIS * Math.sin(s.theta) * Math.sin(s.phi),
    z: L_VIS * Math.cos(s.theta),
  };
}
