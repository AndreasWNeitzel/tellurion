// Headless physics for the Kelvin-Helmholtz instability hero.
// We use the Stuart-vortex closed-form solution to the 2D Euler
// equations as the kinematic mature state (Stuart 1967):
//
//   psi(x, y) = -ln(cosh(y) + A cos(x))
//
// The velocity field is u = dpsi/dy, v = -dpsi/dx. Parameter
// A in [0, 1) controls the vortex strength: A = 0 is a plain shear
// layer, A = 1 is the limiting cat's-eye with isolated vortices.
//
// For tracer advection we use RK4 on (x, y) in the doubly-periodic
// box [0, 2 pi] x [-pi, pi]. The instability growth from a small
// perturbation is conveyed by sweeping A from 0 to ~ 0.6 with the
// time slider.
//
// References:
//   Stuart, J. Fluid Mech. 29 (1967) 417. `stuart-1967`.
//   Chandrasekhar, Hydrodynamic and Hydromagnetic Stability,
//   Oxford 1961, Ch. 11 (`chandrasekhar-hydro`).
//   Drazin and Reid, Hydrodynamic Stability, 2nd ed. CUP 2004.

export const BOX_X = 2 * Math.PI;
export const BOX_Y_HALF = Math.PI;

// Stream function (negative of standard, sign chosen so u, v are
// straightforward).
export function streamFunction(x, y, A) {
  const denom = Math.cosh(y) + A * Math.cos(x);
  if (denom <= 1e-12) return Infinity;
  return -Math.log(denom);
}

// Velocity from stream function.
//   u = d psi / d y, v = -d psi / d x.
// psi = -ln(cosh y + A cos x), so
//   d psi / d y = -sinh(y) / (cosh y + A cos x)
//   d psi / d x =  A sin(x) / (cosh y + A cos x)
// Hence
//   u = -sinh y / D,    v = -A sin x / D,    D = cosh y + A cos x.
export function velocity(x, y, A) {
  const D = Math.cosh(y) + A * Math.cos(x);
  if (Math.abs(D) < 1e-12) return { u: 0, v: 0 };
  return {
    u: -Math.sinh(y) / D,
    v: -A * Math.sin(x) / D,
  };
}

// Vorticity omega = du/dy - dv/dx (analytic).
//   u(x,y) = -sinh y / D, with D = cosh y + A cos x.
//   v(x,y) = -A sin x / D.
//   Both yield omega via standard Stuart-vortex identity:
//     omega = (1 - A^2) / D^2.
export function vorticity(x, y, A) {
  const D = Math.cosh(y) + A * Math.cos(x);
  return (1 - A * A) / (D * D);
}

// RK4 step for tracer.
export function rk4Step(x, y, A, dt) {
  const k1 = velocity(x, y, A);
  const k2 = velocity(x + 0.5 * dt * k1.u, y + 0.5 * dt * k1.v, A);
  const k3 = velocity(x + 0.5 * dt * k2.u, y + 0.5 * dt * k2.v, A);
  const k4 = velocity(x + dt * k3.u, y + dt * k3.v, A);
  let nx = x + (dt / 6) * (k1.u + 2 * k2.u + 2 * k3.u + k4.u);
  let ny = y + (dt / 6) * (k1.v + 2 * k2.v + 2 * k3.v + k4.v);
  // Periodic in x.
  while (nx < 0) nx += BOX_X;
  while (nx >= BOX_X) nx -= BOX_X;
  // Clamp y to the box (rarely needed; tracers near y = 0 stay there).
  if (ny > BOX_Y_HALF) ny = BOX_Y_HALF;
  if (ny < -BOX_Y_HALF) ny = -BOX_Y_HALF;
  return { x: nx, y: ny };
}

// Linear KH dispersion relation for a vortex sheet between two
// incompressible fluids of density rho_1, rho_2 with velocities U_1,
// U_2 (in opposite directions) and reduced gravity g_red:
//
//   omega = k (rho_1 U_1 + rho_2 U_2) / (rho_1 + rho_2)
//           +/- sqrt(rho_1 rho_2 (U_1 - U_2)^2 / (rho_1 + rho_2)^2
//                  - g_red k / (rho_1 + rho_2)).
//
// For equal density and opposite velocities (the canonical setup),
// omega^2 = - k^2 U^2 < 0 always, so omega is purely imaginary
// (everywhere unstable; sigma = k U).
//
// Surface tension stabilizes high-k modes; gravity (g > 0 with light
// fluid on top) stabilizes high-k as well.
export function dispersion_sigma(k, U_shear, rho_ratio = 1, g_red = 0, surface_tension = 0) {
  const term_kinematic = rho_ratio * U_shear * U_shear / Math.pow(1 + rho_ratio, 2);
  const term_grav = g_red * (rho_ratio - 1) / (k * (1 + rho_ratio));
  const term_T = surface_tension * k / (1 + rho_ratio);
  const inner = k * k * term_kinematic - k * (term_grav + term_T);
  return inner > 0 ? Math.sqrt(inner) : 0;
}

// Generate N tracer particles distributed in two horizontal bands.
export function makeTracers(N, A, rng) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const band = (i < N / 2) ? 1 : -1;
    const x = (i / N) * BOX_X * 2 % BOX_X;
    const y = band * (0.3 + 0.5 * rng());
    out.push({ x, y, band });
  }
  return out;
}

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
