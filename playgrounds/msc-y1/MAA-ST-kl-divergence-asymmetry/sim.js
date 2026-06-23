// sim.js
// KL-divergence asymmetry: two distributions on a 1D grid; we compute
// D(P || Q) and D(Q || P) and visualize how a unimodal Q is pulled toward
// "mass-covering" by minimizing D(P || Q) or toward "mode-seeking" by
// minimizing D(Q || P) when P is bimodal.
//
//   D(P || Q) = sum_x p(x) log(p(x) / q(x))
//             = E_P[log P - log Q]
// (forward KL, "mass-covering": Q must put nonzero mass wherever P does,
// or else the integral blows up at log(p/0) = inf).
//
//   D(Q || P) = sum_x q(x) log(q(x) / p(x))
// (reverse KL, "mode-seeking": Q is penalized only where it has mass; so
// it can ignore modes of P that it does not cover, but must concentrate
// inside one mode).
//
// Reference: MacKay 2003, Ch. 2; Bishop 2006, Section 10.1 (variational
// inference).

export const GRID_N = 600;
export const GRID_XMIN = -8;
export const GRID_XMAX = 8;

export function gridX() {
  const xs = new Float64Array(GRID_N);
  for (let i = 0; i < GRID_N; i += 1) xs[i] = GRID_XMIN + (GRID_XMAX - GRID_XMIN) * (i / (GRID_N - 1));
  return xs;
}

function gaussian1D(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

// Mixture-of-two-Gaussians target: P(x) = w1 N(mu1, s1) + w2 N(mu2, s2).
export function pBimodal({ w = 0.5, mu1 = -2.0, mu2 = 2.0, s1 = 0.6, s2 = 0.6 } = {}) {
  const xs = gridX();
  const p = new Float64Array(GRID_N);
  for (let i = 0; i < GRID_N; i += 1) {
    p[i] = w * gaussian1D(xs[i], mu1, s1) + (1 - w) * gaussian1D(xs[i], mu2, s2);
  }
  return { xs, p };
}

// Single Gaussian Q.
export function qGaussian({ mu = 0, sigma = 2.0 } = {}) {
  const xs = gridX();
  const q = new Float64Array(GRID_N);
  for (let i = 0; i < GRID_N; i += 1) q[i] = gaussian1D(xs[i], mu, sigma);
  return { xs, q };
}

const EPS = 1e-30;

export function klPQ(p, q) {
  const dx = (GRID_XMAX - GRID_XMIN) / (GRID_N - 1);
  let s = 0;
  for (let i = 0; i < GRID_N; i += 1) {
    const pi = p[i];
    if (pi > EPS) s += pi * Math.log(pi / Math.max(q[i], EPS));
  }
  return s * dx;
}

export function klQP(p, q) {
  const dx = (GRID_XMAX - GRID_XMIN) / (GRID_N - 1);
  let s = 0;
  for (let i = 0; i < GRID_N; i += 1) {
    const qi = q[i];
    if (qi > EPS) s += qi * Math.log(qi / Math.max(p[i], EPS));
  }
  return s * dx;
}

// Sweep Q parameters and find the (mu, sigma) that minimizes each direction.
// Returns { argminPQ, argminQP }. Crude grid search; the playground does
// not need anything cleverer.
export function findArgmins({ p } = {}) {
  const mus = [];
  for (let i = -40; i <= 40; i += 1) mus.push(i * 0.1);
  // Dense sigma grid down to 0.3: the coarse old grid (min 0.5, wide steps)
  // missed the narrower Q that the mode-seeking reverse KL actually prefers, so
  // the reported argmin could exceed the live divergence of a hand-set Q, which
  // is logically impossible for a true minimum.
  const sigmas = [];
  for (let s = 0.3; s <= 3.6 + 1e-9; s += 0.1) sigmas.push(Math.round(s * 100) / 100);
  let bestPQ = { val: Infinity, mu: 0, sigma: 1 };
  let bestQP = { val: Infinity, mu: 0, sigma: 1 };
  for (const mu of mus) for (const sigma of sigmas) {
    const { q } = qGaussian({ mu, sigma });
    const a = klPQ(p, q);
    const b = klQP(p, q);
    if (a < bestPQ.val) bestPQ = { val: a, mu, sigma };
    if (b < bestQP.val) bestQP = { val: b, mu, sigma };
  }
  return { argminPQ: bestPQ, argminQP: bestQP };
}
