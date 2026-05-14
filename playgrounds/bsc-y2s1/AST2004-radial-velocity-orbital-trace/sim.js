// Radial-velocity curve for a single-line spectroscopic binary.
// v_r(t) = K [cos(omega + nu(t)) + e cos(omega)], with
//   K = (2 pi a sin i / P) / sqrt(1 - e^2),
// where (a, e, i, omega) are the orbital elements of the visible star
// and P the orbital period. Source: Carroll-Ostlie Ch. 7 (`carroll-ostlie`).
export function solveKepler(M, e, tol = 1e-10) {
  let E = M;
  for (let i = 0; i < 50; i += 1) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE; if (Math.abs(dE) < tol) return E;
  }
  return E;
}
export function trueAnomaly(M, e) {
  const E = solveKepler(M, e);
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}
// Semi-amplitude with a in AU, P in years; sin i optional.
export function semiAmplitudeKMs(a, P, e, sin_i = 1) {
  const AU = 1.496e11, YR = 3.15576e7;
  return 2 * Math.PI * a * AU * sin_i / (P * YR * Math.sqrt(1 - e * e)) / 1000;
}
// Radial-velocity at orbital phase phi (0 to 1).
export function radialVelocityKMs(phi, K, omega, e) {
  const M = 2 * Math.PI * phi;
  const nu = trueAnomaly(M, e);
  return K * (Math.cos(omega + nu) + e * Math.cos(omega));
}
