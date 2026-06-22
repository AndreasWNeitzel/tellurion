// sim.js
// The quantum harmonic oscillator. In the parabolic well V(x) = x^2/2 (natural
// units hbar = m = omega = 1) the energy eigenstates are the Hermite-Gauss
// functions psi_n(x) = N_n H_n(x) exp(-x^2/2), with equally spaced energies
//   E_n = (n + 1/2) hbar omega,
// the ground state carrying the zero-point energy hbar omega / 2. The n-th state
// has n nodes and reaches out to the classical turning points x_t = sqrt(2 E_n);
// at large n the probability |psi_n|^2 oscillates about the classical density,
// which piles up at the turning points (the correspondence principle).
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.3;
// Shankar, Principles of Quantum Mechanics, 2nd ed., Ch. 7.

// normalized eigenstate psi_n(x) by the stable recurrence (avoids n! overflow).
export function psi(n, x) {
  const g = Math.pow(Math.PI, -0.25) * Math.exp(-x * x / 2);
  if (n === 0) return g; let pm = g, p = Math.SQRT2 * x * g;
  for (let k = 1; k < n; k += 1) { const pn = Math.sqrt(2 / (k + 1)) * x * p - Math.sqrt(k / (k + 1)) * pm; pm = p; p = pn; }
  return p;
}
export function prob(n, x) { const v = psi(n, x); return v * v; }
export function energy(n) { return n + 0.5; }
export function turningPoint(n) { return Math.sqrt(2 * energy(n)); }
export function potential(x) { return x * x / 2; }

// classical probability density of a 1D oscillator of energy E_n: P(x) =
// 1 / (pi sqrt(x_t^2 - x^2)), diverging at the turning points.
export function classicalProb(n, x) { const xt = turningPoint(n); if (Math.abs(x) >= xt) return 0; return 1 / (Math.PI * Math.sqrt(xt * xt - x * x)); }

// number of nodes (interior zeros) of psi_n.
export function nodeCount(n, X = null, N = 4000) {
  // even N with cell-midpoint sampling so no point lands exactly on x = 0.
  const xt = X || turningPoint(n) + 2; let nodes = 0, prev = psi(n, -xt + 2 * xt * 0.5 / N);
  for (let i = 1; i < N; i += 1) { const x = -xt + 2 * xt * (i + 0.5) / N; const v = psi(n, x); if (prev * v < 0) nodes += 1; prev = v; }
  return nodes;
}

// numeric inner product for normalization / orthogonality checks.
export function inner(m, n, N = 6000) { let s = 0; const X = turningPoint(Math.max(m, n)) + 4, dx = 2 * X / N; for (let i = 0; i < N; i += 1) { const x = -X + (i + 0.5) * dx; s += psi(m, x) * psi(n, x) * dx; } return s; }
