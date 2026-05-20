// Gravity in n spatial dimensions: the Ehrenfest stability argument.
// In d spatial dimensions, the gravitational potential of a point mass
// goes like 1/r^{d-2} (d > 2) or log(r) (d = 2), so the force is
//   F(r) = -k / r^{d-1}     for d > 2,
// and Bertrand's theorem fails for d != 3: only the inverse-square law
// (d = 3) gives closed bound orbits. For d = 4 the system is on the
// edge of stability; for d > 4 every bound orbit either decays into
// the centre or escapes. For d = 2 the long-range log potential gives
// closed precessing orbits (no escape, no centre fall).
//
// Reference: Ehrenfest, Proc. Amst. Acad. 20 (1917) 200; Tangherlini,
// Nuovo Cim. 27 (1963) 636 (`tangherlini1963`); Whitrow, Brit. J. Phil.
// Sci. 6 (1955) 13. Working in 2D projection (orbit plane is the same
// in any number of ambient spatial dimensions for a central force).

// Generalized inverse-power central force in 2D. The d parameter is
// the assumed number of ambient spatial dimensions.
//   d > 2 :  F = -k r / r^d
//   d = 2 :  F = -k r / r^2      (log potential)
export function centralForce(x, y, d, k = 1.0, eps = 0.01) {
  const r2 = x * x + y * y + eps * eps;
  const r = Math.sqrt(r2);
  const exponent = d - 1;
  // F vector = -k * (x, y) / r^d
  const inv = k / Math.pow(r, exponent + 1);
  return [-inv * x, -inv * y];
}

// Closed-form effective-potential turning radii are not used; we
// integrate the orbit numerically with velocity-Verlet (good enough
// since the qualitative goal is just to show stability vs decay).

// One-step velocity-Verlet under the central force.
export function step(state, dt) {
  const { d, k, eps } = state;
  const [ax, ay] = centralForce(state.x, state.y, d, k, eps);
  state.vx += 0.5 * dt * ax;
  state.vy += 0.5 * dt * ay;
  state.x += dt * state.vx;
  state.y += dt * state.vy;
  const [ax2, ay2] = centralForce(state.x, state.y, d, k, eps);
  state.vx += 0.5 * dt * ax2;
  state.vy += 0.5 * dt * ay2;
  state.t += dt;
}

// Generalized angular momentum L = x*vy - y*vx (conserved for any
// central force in any d, by symmetry of rotation in the orbital
// plane).
export function angularMomentum(state) {
  return state.x * state.vy - state.y * state.vx;
}

// Total energy (kinetic + potential). For d > 2 the potential is
// V = -k / ((d-2) r^{d-2}); for d = 2 it is V = k log(r). Mass = 1
// in code units.
export function energy(state) {
  const { d, x, y, vx, vy, k, eps } = state;
  const r = Math.sqrt(x * x + y * y + eps * eps);
  const T = 0.5 * (vx * vx + vy * vy);
  let V;
  if (Math.abs(d - 2) < 1e-9) V = k * Math.log(r);
  else V = -k / ((d - 2) * Math.pow(r, d - 2));
  return T + V;
}

// Initial conditions for a circular orbit at radius r0 in dimension d.
// For circular motion: v_circ^2 = k / r^{d-2} (for d > 2). For d = 2
// the log potential gives v_circ^2 = k.
export function circularIC(r0, d, k = 1.0, eps = 0.01) {
  const r = r0;
  let v2;
  if (Math.abs(d - 2) < 1e-9) v2 = k;
  else v2 = k / Math.pow(r, d - 2);
  const v = Math.sqrt(Math.max(0, v2));
  return { x: r, y: 0, vx: 0, vy: v, t: 0, d, k, eps };
}

// Slightly eccentric IC (perturbation factor f about a circular orbit
// at r0). Useful for visualizing precession in d = 2 and decay in
// d > 3.
export function eccentricIC(r0, d, f = 1.05, k = 1.0, eps = 0.01) {
  const ic = circularIC(r0, d, k, eps);
  ic.vy *= f;
  return ic;
}
