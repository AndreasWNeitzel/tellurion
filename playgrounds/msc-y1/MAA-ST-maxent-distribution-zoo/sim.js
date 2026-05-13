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

// Constraints summary string for each family (UI tooltip).
export const CONSTRAINTS = {
  uniform:     'support [a, b], no moment constraint',
  exponential: 'support [0, infty), fixed mean E[X] = mu',
  gaussian:    'support R, fixed mean and variance',
  laplace:     'support R, fixed mean and E[|X - mu|] = b',
};
