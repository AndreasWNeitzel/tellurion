// Linear matter density perturbation growth in a flat LambdaCDM universe.
//   delta'' + 2 H delta' - (3/2) Omega_m H^2 delta = 0.
// In matter era (a^3 = Omega_m/H^2, ignoring radiation): delta proportional to a.
// In Lambda era: delta saturates (logarithmic).
// Growing-mode growth factor f(a) = d ln delta / d ln a ≈ Omega_m(a)^0.55.
// Reference: Liddle Cosmology Ch. 12 (`liddle-cosmology`); Weinberg Ch. 8 (`weinberg-cosmology`).
export function Omega_m_at(a, Omega_m0 = 0.315, Omega_L = 0.685) {
  const E2 = Omega_m0 / Math.pow(a, 3) + Omega_L;
  return (Omega_m0 / Math.pow(a, 3)) / E2;
}
export function growthFactor(a, Omega_m0 = 0.315) {
  // Linder fit f(a) = Omega_m(a)^0.55.
  return Math.pow(Omega_m_at(a, Omega_m0), 0.55);
}
export function deltaGrowth(a, Omega_m0 = 0.315) {
  // Integrate d delta / da = f delta / a from a_init.
  const a_init = 1e-3;
  if (a < a_init) return a;
  const N = 1000; const da = (a - a_init) / N;
  let d = a_init;
  for (let i = 0; i < N; i += 1) {
    const a_i = a_init + i * da;
    const f = growthFactor(a_i, Omega_m0);
    d += f * d / a_i * da;
  }
  return d;
}
