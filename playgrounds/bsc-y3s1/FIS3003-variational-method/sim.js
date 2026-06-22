// The variational principle, applied to the hydrogen atom with a Gaussian trial
// wavefunction. For any normalized trial state, <H> = <T> + <V> is an upper bound on
// the true ground-state energy E0. Using a 3D Gaussian psi_a(r) = (2a/pi)^(3/4) e^{-a r^2}
// for H = -1/2 grad^2 - 1/r (atomic units), the energy functional is
//   <H>(a) = (3/2) a - 2 sqrt(2a/pi),
// minimized at a* = 8/(9 pi) with <H> = -4/(3 pi) = -0.4244 Ha, above the exact -0.5 Ha:
// a Gaussian cannot reproduce the cusp of the true e^{-r} ground state. Reference:
// Griffiths, Introduction to Quantum Mechanics, 3rd ed., Ch. 7.

export const E0_EXACT = -0.5;                  // Hartree, hydrogen ground state
export const ALPHA_OPT = 8 / (9 * Math.PI);    // optimal Gaussian width parameter

export function kinetic(a) { return 1.5 * a; }                  // <T>
export function potential(a) { return -2 * Math.sqrt((2 * a) / Math.PI); }  // <V>
export function energy(a) { return kinetic(a) + potential(a); } // <H>(a)

// Normalized trial radial wavefunction psi_a(r) (3D Gaussian, s-state).
export function trialPsi(r, a) { return Math.pow((2 * a) / Math.PI, 0.75) * Math.exp(-a * r * r); }
// Exact hydrogen 1s wavefunction psi(r) = e^{-r} / sqrt(pi) (has a cusp at r=0).
export function exactPsi(r) { return Math.exp(-r) / Math.sqrt(Math.PI); }

// Radial probability density P(r) = 4 pi r^2 |psi|^2.
export function trialRadial(r, a) { const p = trialPsi(r, a); return 4 * Math.PI * r * r * p * p; }
export function exactRadial(r) { const p = exactPsi(r); return 4 * Math.PI * r * r * p * p; }
