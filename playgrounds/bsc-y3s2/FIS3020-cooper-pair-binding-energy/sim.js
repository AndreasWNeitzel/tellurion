// Cooper-pair binding energy from a delta-function attractive potential in a thin shell
// around the Fermi surface:
//   E_bind = 2 hbar omega_D exp(-2 / (N(0) V)).
// Reference: Ashcroft-Mermin Ch. 34 (`ashcroft-mermin`).
export function bindingEnergy(N0V, hbar_omega_D = 1) {
  return 2 * hbar_omega_D * Math.exp(-2 / N0V);
}

// Pair wavefunction amplitude g(xi) in the pairing shell, normalized roughly.
// g(xi) ~ 1 / (2*xi + E_b), where xi is the single-particle energy relative to Fermi level.
// Peak occurs at xi ~ 0 (Fermi surface), with width ~hbar_omega_D.
export function pairWavefunction(xi, E_bind) {
  return 1 / Math.max(Math.abs(2 * xi + E_bind), 1e-6);
}
