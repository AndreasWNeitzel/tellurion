// sim.js
// Faraday induction on a sliding-bar (rail) circuit. A conducting bar of length
// L slides on two frictionless rails of separation L, in a uniform field B into
// the page, the loop closed by a resistance R. The enclosed flux Phi = B L x
// grows as the bar advances, so Faraday's law gives an EMF
//   e = -dPhi/dt = -B L v,
// driving a current I = e / R. That current, sitting in the field, feels a
// Lorentz force F = I L B that OPPOSES the motion (Lenz's law):
//   F_mag = -B^2 L^2 v / R.
// Under a constant applied force F_app the bar obeys
//   m dv/dt = F_app - B^2 L^2 v / R,
// rising to the terminal velocity v_t = F_app R / (B^2 L^2) where the magnetic
// drag balances the push. Energy is conserved: at terminal the mechanical input
// power F_app v_t equals the Ohmic dissipation I^2 R = e^2 / R; during the
// transient the surplus goes into kinetic energy.
//
// Everything here is closed form, no integrator engine required (the single
// linear-drag ODE has an exact and an unconditionally-stable discrete form).
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 7.1-7.2;
// Young and Freedman, University Physics, 14e, Ch. 29 (motional EMF).

export const MASS = 1.0;                 // kg (held fixed; B, L, R, F_app are the controls)

export function emf(B, L, v) { return B * L * v; }                      // magnitude |e| = B L v
export function current(B, L, v, R) { return B * L * v / R; }           // |I| = B L v / R
export function dragCoeff(B, L, R) { return B * B * L * L / R; }        // k in m dv/dt = F - k v
export function magneticForce(B, L, v, R) { return dragCoeff(B, L, R) * v; }  // retarding magnitude
export function terminalVelocity(Fapp, B, L, R) {
  const k = dragCoeff(B, L, R);
  return k > 0 ? Fapp / k : 0;
}
export function timeConstant(B, L, R, m = MASS) {
  const k = dragCoeff(B, L, R);
  return k > 0 ? m / k : Infinity;
}

export function createBar({ B = 1.0, L = 1.0, R = 2.0, Fapp = 1.0, m = MASS, v0 = 0 } = {}) {
  return { B, L, R, Fapp, m, x: 0, v: v0, t: 0 };
}

// Semi-implicit step (backward Euler on the linear drag term), unconditionally
// stable: v_{n+1} = (v_n + F_app dt / m) / (1 + k dt / m), k = B^2 L^2 / R.
export function stepBar(s, dt) {
  const k = dragCoeff(s.B, s.L, s.R);
  s.v = (s.v + s.Fapp * dt / s.m) / (1 + k * dt / s.m);
  s.x += s.v * dt;
  s.t += dt;
  return s;
}

// Live electrical and power quantities.
export function diagnostics(s) {
  const e = emf(s.B, s.L, s.v);
  const I = e / s.R;
  const Pdiss = I * I * s.R;                 // Ohmic dissipation = e^2 / R
  const Pin = s.Fapp * s.v;                  // mechanical power supplied
  const dKE = Pin - Pdiss;                   // = d(1/2 m v^2)/dt, the kinetic-energy rate
  return {
    emf: e, current: I, Pdiss, Pin, dKE,
    Fmag: magneticForce(s.B, s.L, s.v, s.R),
    vTerm: terminalVelocity(s.Fapp, s.B, s.L, s.R),
    flux: s.B * s.L * s.x,
  };
}
