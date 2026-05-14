// CKM matrix in Wolfenstein parameterization:
//   V_ud ≈ 1 - λ²/2, V_us ≈ λ, V_ub ≈ A λ³ (ρ - i η)
//   V_cd ≈ -λ, V_cs ≈ 1 - λ²/2, V_cb ≈ A λ²
//   V_td ≈ A λ³ (1 - ρ̄ - i η̄), V_ts ≈ -A λ², V_tb ≈ 1
// Unitarity triangle vertices: (0, 0), (1, 0), (ρ̄, η̄).
// Reference: Griffiths-Particles Ch. 10 (`griffiths-particles`); PDG (2024).
export const CKM_DEFAULT = { lambda: 0.2255, A: 0.811, rho: 0.157, eta: 0.355 };
export function ckmModulus({ lambda: L, A, rho, eta }) {
  return [
    [1 - L * L / 2, L, A * L * L * L * Math.hypot(rho, eta)],
    [L, 1 - L * L / 2, A * L * L],
    [A * L * L * L * Math.hypot(1 - rho, eta), A * L * L, 1],
  ];
}
export function trianglePoints({ rho, eta }) {
  return { A: [rho, eta], B: [1, 0], C: [0, 0] };
}
export function angleAlpha(rho, eta) {
  // alpha = arg(- V_td V*_tb / (V_ud V*_ub)); equivalent to angle at vertex A.
  const num = Math.atan2(-eta, rho - 1);
  const denom = Math.atan2(-eta, rho);
  return num - denom;
}
export function angleBeta(rho, eta) {
  // beta = arg(- V_cd V*_cb / (V_td V*_tb)); angle at vertex C.
  return Math.atan2(eta, 1 - rho);
}
export function angleGamma(rho, eta) {
  // gamma = arg(- V_ud V*_ub / (V_cd V*_cb)).
  return Math.atan2(eta, rho);
}
