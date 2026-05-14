// Toy parton distribution functions for the proton.
// Valence-only model: u_v(x) ~ x^a (1-x)^b with normalization int dx u_v = 2 (two up quarks),
// d_v(x) similarly with int = 1.
// Sea quarks: light s, c, b parameterized as -1/sqrt(x) (small x).
// Gluon: g(x) ~ x^{-c} (1-x)^d carries most momentum at small x.
// Reference: Griffiths-Particles Ch. 9 (`griffiths-particles`); PDG.
export function u_v(x, a = 0.5, b = 3) {
  return 2.0 * Math.pow(x, a) * Math.pow(1 - x, b) / betaIntegral(a, b);
}
export function d_v(x, a = 0.5, b = 4) {
  return 1.0 * Math.pow(x, a) * Math.pow(1 - x, b) / betaIntegral(a, b);
}
export function gluon(x) {
  return 5 * Math.pow(x, -0.3) * Math.pow(1 - x, 5);
}
export function sea(x) {
  return 0.5 * Math.pow(x, -0.4) * Math.pow(1 - x, 7);
}
// Simple beta-function approximation B(a+1, b+1).
export function betaIntegral(a, b) {
  // Numerically.
  const N = 1000; let s = 0; const dx = 1 / N;
  for (let i = 0; i < N; i += 1) {
    const x = (i + 0.5) * dx;
    s += Math.pow(x, a) * Math.pow(1 - x, b);
  }
  return s * dx;
}
