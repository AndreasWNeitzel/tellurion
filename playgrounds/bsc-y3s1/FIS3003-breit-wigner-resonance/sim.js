// A Breit-Wigner resonance in quantum scattering. An isolated resonance at energy E_R
// with full width Gamma produces a Lorentzian peak in the cross-section while the
// scattering phase shift sweeps rapidly through pi/2:
//   sigma/sigma_max = (Gamma/2)^2 / ((E - E_R)^2 + (Gamma/2)^2),
//   delta(E) = pi/2 + arctan( 2(E - E_R)/Gamma ),
// and the Wigner time delay 2 hbar d(delta)/dE peaks at the resonance, longest for a
// narrow (long-lived) resonance. Reference: Sakurai and Napolitano, Modern Quantum
// Mechanics, 2nd ed., Ch. 6.

// Cross-section relative to the resonance peak (unitarity limit), a Lorentzian.
export function crossSection(E, ER, gamma) {
  const h = gamma / 2;
  return (h * h) / ((E - ER) * (E - ER) + h * h);
}

// Scattering phase shift, rising from 0 through pi/2 (at E_R) to pi.
export function phaseShift(E, ER, gamma) {
  return Math.PI / 2 + Math.atan((2 * (E - ER)) / gamma);
}

// Wigner time delay d(delta)/dE (units of 2 hbar), peaking at the resonance.
export function timeDelay(E, ER, gamma) {
  const u = (2 * (E - ER)) / gamma;
  return (2 / gamma) / (1 + u * u);
}

// sin^2(delta), equal to the relative cross-section; exposed for the invariant check.
export function sin2Delta(E, ER, gamma) {
  const s = Math.sin(phaseShift(E, ER, gamma));
  return s * s;
}
