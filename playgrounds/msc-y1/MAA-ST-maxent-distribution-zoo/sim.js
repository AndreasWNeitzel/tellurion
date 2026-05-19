// sim.js
// Maximum-entropy distributions under different constraints, in 1D.
//
// Given a set of moment constraints on a probability density p(x), the
// distribution that has the largest differential entropy
//   h(p) = -integral p(x) log p(x) dx
// is the one that uses no extra structure beyond what the constraints
// force. Result:
//
//   - support [a, b] only, no moment constraints   -> uniform U(a, b)
//   - support [0, infty), E[X] = mu                -> exponential lambda = 1/mu
//   - support R, E[X] = mu, Var[X] = sigma^2       -> Gaussian N(mu, sigma)
//   - support [0, infty), E[ln X] = c              -> ?, not displayed
//
// (MacKay 2003, Section 22.2; Cover and Thomas 2006, Section 12.1.)
//
// We render the chosen pdf on a 1D grid and compute its differential
// entropy by trapezoidal sum, then compare to the analytic value.

export const GRID_N = 500;

export function chooseSupport(family) {
  switch (family) {
    case 'uniform':     return { xmin: -3, xmax: 3 };
    case 'exponential': return { xmin: 0,  xmax: 8 };
    case 'gaussian':    return { xmin: -6, xmax: 6 };
    case 'laplace':     return { xmin: -6, xmax: 6 };
    default: throw new Error(`unknown family ${family}`);
  }
}

export function pdf(family, params, xs) {
  const p = new Float64Array(xs.length);
  switch (family) {
    case 'uniform': {
      const { a, b } = params;
      const w = b - a;
      for (let i = 0; i < xs.length; i += 1) {
        p[i] = (xs[i] >= a && xs[i] <= b) ? 1 / w : 0;
      }
      return p;
    }
    case 'exponential': {
      const { mean } = params;
      const lambda = 1 / mean;
      for (let i = 0; i < xs.length; i += 1) {
        p[i] = xs[i] >= 0 ? lambda * Math.exp(-lambda * xs[i]) : 0;
      }
      return p;
    }
    case 'gaussian': {
      const { mu, sigma } = params;
      const norm = 1 / (sigma * Math.sqrt(2 * Math.PI));
      for (let i = 0; i < xs.length; i += 1) {
        const z = (xs[i] - mu) / sigma;
        p[i] = norm * Math.exp(-0.5 * z * z);
      }
      return p;
    }
    case 'laplace': {
      const { mu, b } = params;
      for (let i = 0; i < xs.length; i += 1) {
        p[i] = (1 / (2 * b)) * Math.exp(-Math.abs(xs[i] - mu) / b);
      }
      return p;
    }
    default: throw new Error(`unknown family ${family}`);
  }
}

export function analyticEntropy(family, params) {
  switch (family) {
    case 'uniform':     return Math.log(params.b - params.a);
    case 'exponential': return 1 + Math.log(params.mean);
    case 'gaussian':    return 0.5 * Math.log(2 * Math.PI * Math.E * params.sigma * params.sigma);
    case 'laplace':     return 1 + Math.log(2 * params.b);
    default: return NaN;
  }
}

export function numericEntropy(p, xs) {
  const dx = xs[1] - xs[0];
  let s = 0;
  for (let i = 0; i < p.length; i += 1) {
    const pi = p[i];
    if (pi > 1e-30) s -= pi * Math.log(pi) * dx;
  }
  return s;
}

export function gridX(family) {
  const { xmin, xmax } = chooseSupport(family);
  const xs = new Float64Array(GRID_N);
  for (let i = 0; i < GRID_N; i += 1) xs[i] = xmin + (xmax - xmin) * (i / (GRID_N - 1));
  return xs;
}

// Seeded RNG (mulberry32) so sampling is deterministic for the gate.
export function makeRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Draw n samples from the maximum-entropy distribution of a family by
// direct inversion / Box-Muller. The empirical moments reproduce the
// constraints that family was built to satisfy.
export function sampleFamily(family, params, n, seed = 0xC0FFEE) {
  const rng = makeRng(seed), out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const u = Math.min(1 - 1e-12, Math.max(1e-12, rng()));
    if (family === 'uniform') out[i] = params.a + (params.b - params.a) * u;
    else if (family === 'exponential') out[i] = -params.mean * Math.log(1 - u);
    else if (family === 'gaussian') {
      const u2 = Math.min(1 - 1e-12, Math.max(1e-12, rng()));
      out[i] = params.mu + params.sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * u2);
    } else { // laplace
      const e = u - 0.5;
      out[i] = params.mu - params.b * Math.sign(e) * Math.log(1 - 2 * Math.abs(e));
    }
  }
  return out;
}

// Same support and family, but with an imposed cosine ripple of
// amplitude s in [0, 1], renormalised on the grid. It is a valid
// density satisfying the same support, yet its added structure makes
// it strictly less entropic than the maximum-entropy member: this is
// the point of the principle (any structure beyond the constraints
// costs entropy). Reference: Cover and Thomas 2006, Sec. 12.1.
export function structuredPdf(family, params, xs, s) {
  const p = pdf(family, params, xs);
  if (s <= 0) return p;
  let xlo = xs[0], xhi = xs[xs.length - 1];
  if (family === 'uniform') { xlo = params.a; xhi = params.b; }
  const k = 4 * Math.PI / (xhi - xlo), c = 0.5 * (xlo + xhi), dx = xs[1] - xs[0];
  let norm = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const mod = 1 + s * Math.cos(k * (xs[i] - c));
    p[i] = p[i] * Math.max(0, mod);
    norm += p[i] * dx;
  }
  if (norm > 0) for (let i = 0; i < p.length; i += 1) p[i] /= norm;
  return p;
}

// Constraints summary string for each family (UI tooltip).
export const CONSTRAINTS = {
  uniform:     'support [a, b], no moment constraint',
  exponential: 'support [0, infty), fixed mean E[X] = mu',
  gaussian:    'support R, fixed mean and variance',
  laplace:     'support R, fixed mean and E[|X - mu|] = b',
};
