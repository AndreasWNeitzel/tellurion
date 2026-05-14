// BCS gap equation (weak-coupling, isotropic):
//   1 = N(0) V integral_0^{hbar omega_D} dxi / sqrt(xi^2 + Delta^2) * tanh(sqrt(xi^2 + Delta^2)/(2 kT))
// At T = 0: Delta(0) = 2 hbar omega_D exp(-1/(N(0) V)).
// At T = Tc: Delta = 0, and kTc = 1.13 hbar omega_D exp(-1/(N(0) V)).
// Universal ratio: 2 Delta(0) / kTc = 3.528.
// Reference: Ashcroft-Mermin Ch. 34 (`ashcroft-mermin`); de Gennes Superconductivity
// (`degennes-superconductivity`).
export function gapZero(N0V, hbar_omega_D = 1) {
  return 2 * hbar_omega_D * Math.exp(-1 / N0V);
}
export function Tc(N0V, hbar_omega_D = 1, kB = 1) {
  return 1.13 * hbar_omega_D * Math.exp(-1 / N0V) / kB;
}
// Self-consistent gap at temperature T.
export function gapAtT(T, N0V, hbar_omega_D = 1, kB = 1, tol = 1e-6) {
  const Tc_v = Tc(N0V, hbar_omega_D, kB);
  if (T >= Tc_v) return 0;
  let Delta = gapZero(N0V, hbar_omega_D);
  for (let it = 0; it < 200; it += 1) {
    const N = 400; let s = 0;
    const dx = hbar_omega_D / N;
    for (let i = 0; i < N; i += 1) {
      const xi = (i + 0.5) * dx;
      const E = Math.sqrt(xi * xi + Delta * Delta);
      s += dx / E * Math.tanh(E / (2 * kB * T + 1e-30));
    }
    const lhs = N0V * s;
    const dDelta = Delta * (lhs - 1) * 0.5;
    Delta += dDelta;
    if (Delta < 0) Delta = 0;
    if (Math.abs(dDelta) < tol) break;
  }
  return Delta;
}
