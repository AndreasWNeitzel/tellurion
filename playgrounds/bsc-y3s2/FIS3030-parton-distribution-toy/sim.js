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

// Hero (appended; everything above is byte-identical). Unnormalised
// shape of each species, used only to sample where in x a parton
// sits. The swarm COMPOSITION (how many of each) comes from the
// physical momentum budget in playground.js, so the displayed proton
// matches the measured fact that the gluon carries the most; these
// shapes only say at which x each parton appears.
export function partonShape(kind, x) {
  if (kind === 'u') return u_v(x);
  if (kind === 'd') return d_v(x);
  if (kind === 'g') return gluon(x);
  return sea(x);
}

// Deterministic rejection sample of x from a species' shape. The
// gluon and sea shapes diverge as x -> 0 but are integrable; xmin
// (matching the slider floor) bounds the sampler.
export function sampleX(kind, rng, xmin = 1e-3) {
  const fmax = 1.05 * Math.max(
    partonShape(kind, xmin),
    partonShape(kind, 0.02), partonShape(kind, 0.1),
    partonShape(kind, 0.25), partonShape(kind, 0.5),
  );
  for (let g = 0; g < 400; g += 1) {
    const x = xmin + rng() * (1 - xmin);
    if (rng() * fmax <= partonShape(kind, x)) return x;
  }
  return 0.15;
}
