// sim.js
// Steady-state response of a driven series RLC circuit to V(t) = V0 cos(omega t).
// The complex impedance is Z = R + i(omega L - 1/(omega C)) = R + iX, so the
// current amplitude is I0 = V0/|Z| and it lags the source voltage by the phase
//   phi = atan2(X, R),  X = omega L - 1/(omega C).
// Resonance is at omega_0 = 1/sqrt(L C), where X = 0, |Z| = R is minimal, the
// current is maximal (V0/R) and phi = 0. The sharpness is the quality factor
//   Q = omega_0 L / R = 1/(omega_0 R C) = (1/R) sqrt(L/C),
// and the half-power (3 dB) bandwidth is Delta omega = omega_0 / Q = R / L.
// The component voltage amplitudes are V_R = I0 R (in phase with the current),
// V_L = I0 omega L (leads by 90 deg) and V_C = I0/(omega C) (lags by 90 deg);
// they add as phasors to the source: V_R^2 + (V_L - V_C)^2 = V0^2.
//
// All closed form (steady-state AC), no integrator engine.
//
// Reference: Griffiths, Introduction to Electrodynamics, 5e, Sec. 7.2.4;
// Young and Freedman, University Physics, 14e, Ch. 31 (AC circuits).

export function omega0(L, C) { return 1 / Math.sqrt(L * C); }
export function reactance(w, L, C) { return w * L - 1 / (w * C); }
export function impedance(w, R, L, C) { return Math.hypot(R, reactance(w, L, C)); }
export function currentAmp(V0, w, R, L, C) { return V0 / impedance(w, R, L, C); }
export function phase(w, R, L, C) { return Math.atan2(reactance(w, L, C), R); }   // current lags V by phi
export function qFactor(R, L, C) { return (1 / R) * Math.sqrt(L / C); }
export function bandwidth(R, L) { return R / L; }                                  // Delta omega (FWHM in power)

// Component voltage amplitudes at angular frequency w.
export function voltages(V0, w, R, L, C) {
  const I = currentAmp(V0, w, R, L, C);
  return { I, VR: I * R, VL: I * w * L, VC: I / (w * C), Vsrc: V0, phi: phase(w, R, L, C) };
}

// Default circuit: R = 50 Ohm, L = 10 mH, C = 1 uF -> omega_0 = 1e4 rad/s
// (f_0 ~ 1592 Hz), Q = 2.
export function createCircuit({ V0 = 5, R = 50, L = 0.01, C = 1e-6 } = {}) {
  return { V0, R, L, C, w: omega0(L, C) };
}
