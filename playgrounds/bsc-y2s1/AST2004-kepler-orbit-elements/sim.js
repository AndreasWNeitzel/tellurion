// Keplerian orbit elements: (a, e, i, Omega, omega, nu).
// Compute the orbital position from elements (perifocal -> ecliptic transform).
// Reference: Carroll-Ostlie 2e Sec. 2.3 (`carroll-ostlie`).
export function solveKepler(M, e, tol = 1e-10, maxIter = 50) {
  let E = M;
  for (let i = 0; i < maxIter; i += 1) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE; if (Math.abs(dE) < tol) return E;
  }
  return E;
}
export function trueAnomaly(E, e) {
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}
export function elementsToPos(a, e, i, Omega, omega, nu) {
  const r = a * (1 - e * e) / (1 + e * Math.cos(nu));
  const xp = r * Math.cos(nu), yp = r * Math.sin(nu);
  const cO = Math.cos(Omega), sO = Math.sin(Omega);
  const ci = Math.cos(i), si = Math.sin(i);
  const cw = Math.cos(omega), sw = Math.sin(omega);
  const x = (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp;
  const y = (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp;
  const z = (sw * si) * xp + (cw * si) * yp;
  return { x, y, z, r };
}
