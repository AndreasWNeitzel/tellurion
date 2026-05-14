// Aharonov-Bohm: a thin solenoid carries flux Phi enclosed by a closed loop.
// Even though B = 0 outside, the vector potential A is nonzero and the wavefunction
// picks up a phase exp(i e Phi / hbar) around the loop.
// In a double-slit, the interference fringes shift by delta = (e Phi / hbar) / (2 pi)
// fringes (Phi / Phi_0 fringes, with Phi_0 = h/e).
// Reference: Sakurai QM Ch. 2 (`sakurai-qm`); Aharonov-Bohm 1959 (`aharonov-bohm1959`).
export const FLUX_QUANTUM_e = 4.14e-15; // h / e in T m^2
export function phaseShift(flux_Wb) {
  // Returns shift in cycles (Phi / Phi_0).
  return flux_Wb / FLUX_QUANTUM_e;
}
// Two-slit intensity with shift phi (radians):
//   I(x) = 1 + cos(k d x / D + phi).
export function intensity(x, d, D, k, phi) {
  return 1 + Math.cos(k * d * x / D + phi);
}
