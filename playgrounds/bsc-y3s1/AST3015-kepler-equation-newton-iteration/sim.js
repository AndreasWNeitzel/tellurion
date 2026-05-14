// sim.js
// Newton solver for the Kepler equation
//   M = E - e sin E
// where M is mean anomaly, E is eccentric anomaly, e is eccentricity.
//
// Newton iteration: E_{n+1} = E_n - (E_n - e sin E_n - M) / (1 - e cos E_n).
// Quadratic convergence from E_0 = M for moderate eccentricity. For
// near-parabolic orbits (e -> 1) the initial guess E_0 = M + e sign(sin M)
// is more robust.
//
// Reference: Carroll-Ostlie, An Introduction to Modern Astrophysics 2e
// Ch. 2 (`carroll-ostlie`). Curtis, Orbital Mechanics Ch. 3 for the
// numerical implementation.

export function residual(E, e, M) {
  return E - e * Math.sin(E) - M;
}

// Solve Kepler equation. Returns { E, iterations, history } where
// history is the sequence of E values for visualization.
export function solveKepler(M, e, tol = 1e-12, maxIter = 50) {
  // Wrap M into [-pi, pi] for stability.
  let Mw = M;
  while (Mw > Math.PI)  Mw -= 2 * Math.PI;
  while (Mw < -Math.PI) Mw += 2 * Math.PI;
  let E = Mw + e * Math.sin(Mw);
  const history = [E];
  let iter = 0;
  for (let i = 0; i < maxIter; i += 1) {
    iter = i + 1;
    const f = E - e * Math.sin(E) - Mw;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    history.push(E);
    if (Math.abs(dE) < tol) break;
  }
  // Unwrap back to the M range.
  E += M - Mw;
  return { E, iterations: iter, history };
}

// Generate Kepler orbit positions from elements (a, e) and a mean anomaly.
export function orbitXY(a, e, M) {
  const { E } = solveKepler(M, e);
  const cosE = Math.cos(E), sinE = Math.sin(E);
  return {
    x: a * (cosE - e),
    y: a * Math.sqrt(1 - e * e) * sinE,
    E,
  };
}
