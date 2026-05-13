// sim.js
// Coherent state of the 1D quantum harmonic oscillator.
// Units: hbar = m = omega = 1.
// |alpha>(t) = e^{-i omega t / 2} D(alpha e^{-i omega t}) |0>
// Position-space wavefunction (Schrodinger picture):
//   psi(x, t) = (1/pi)^{1/4} exp(-(x - x0(t))^2 / 2 + i (p0(t) x - x0(t) p0(t) / 2) - i omega t / 2)
// with x0(t) = sqrt(2) Re(alpha e^{-i omega t}), p0(t) = sqrt(2) Im(alpha e^{-i omega t}).
// The density |psi(x, t)|^2 is a Gaussian of fixed width 1/sqrt(2) whose
// mean follows the classical orbit (x0(t), p0(t)).

export const DEFAULT_ALPHA = 2.0;        // real, so initial p0 = 0

export function classicalOrbit(alpha, t) {
  return {
    x0: Math.SQRT2 * (alpha * Math.cos(t)),
    p0: Math.SQRT2 * (-alpha * Math.sin(t)),
  };
}

// Probability density |psi(x, t)|^2 in 1D.
export function density(x, alpha, t) {
  const { x0 } = classicalOrbit(alpha, t);
  const dx = x - x0;
  return Math.exp(-dx * dx) / Math.sqrt(Math.PI);
}

// Real and imaginary parts of the wavefunction; used for an optional
// real-part-of-psi overlay.
export function psiRealImag(x, alpha, t) {
  const { x0, p0 } = classicalOrbit(alpha, t);
  const dx = x - x0;
  // Phase: p0 * x - x0 p0 / 2 - omega t / 2 with omega = 1.
  const phase = p0 * x - x0 * p0 / 2 - 0.5 * t;
  const amp = Math.pow(Math.PI, -0.25) * Math.exp(-dx * dx / 2);
  return { re: amp * Math.cos(phase), im: amp * Math.sin(phase) };
}

// <n> for a coherent state is |alpha|^2.
export function meanOccupation(alpha) { return alpha * alpha; }

// Energy expectation: <H> = (|alpha|^2 + 1/2) hbar omega.
export function meanEnergy(alpha) { return alpha * alpha + 0.5; }
