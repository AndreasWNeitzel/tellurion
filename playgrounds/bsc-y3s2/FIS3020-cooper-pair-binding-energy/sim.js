// Cooper-pair binding energy from a delta-function attractive potential in a thin shell
// around the Fermi surface:
//   E_bind = 2 hbar omega_D exp(-2 / (N(0) V)).
// Reference: Ashcroft-Mermin Ch. 34 (`ashcroft-mermin`).
export function bindingEnergy(N0V, hbar_omega_D = 1) {
  return 2 * hbar_omega_D * Math.exp(-2 / N0V);
}
