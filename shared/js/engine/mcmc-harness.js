// shared/js/engine/mcmc-harness.js
// Four MCMC samplers operating on a unified target interface, plus four
// reference targets (Gaussian, banana, mixture, funnel). Headless: no DOM,
// no window. Deterministic at a supplied seed.
//
// Samplers:
//   rwm:          random-walk Metropolis with isotropic Gaussian proposal
//   adaptive-rwm: Haario-Saksman adaptive Metropolis (Robert-Casella 7.6)
//   mala:         Metropolis-adjusted Langevin (preconditioned)
//   hmc:          Hamiltonian Monte Carlo with leapfrog, fixed step count
//
// Target interface:
//   { name, dim, logProb(x), gradLogProb(x) }
//
// Sampler API:
//   const chain = createChain({ method, target, x0, params, seed });
//   chain.step()              returns { accepted, x, logProb }
//   chain.run(N)              returns Float64Array shape [N * dim], row-major
//   chain.diagnostics(trace)  returns { acceptance, ess, mean, var, ... }

import { makeRng, gaussian as boxMullerStd } from '../render/rng.js';
import { autocorrelation } from '../invariants/ess.js';

// ==== numeric helpers =====================================================

function zeros(n) { return new Float64Array(n); }
function copyVec(dst, src) { for (let i = 0; i < dst.length; i += 1) dst[i] = src[i]; }
function dot(a, b) { let s = 0; for (let i = 0; i < a.length; i += 1) s += a[i] * b[i]; return s; }

function randn(rng) {
  return boxMullerStd(rng, 0, 1);
}
function randnVec(rng, dim, out = null) {
  out = out ?? zeros(dim);
  for (let i = 0; i < dim; i += 1) out[i] = randn(rng);
  return out;
}

// Cholesky factor of an SPD matrix in row-major Float64Array form, returning
// L (lower triangular).
function cholesky(M, dim) {
  const L = zeros(dim * dim);
  for (let i = 0; i < dim; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let s = M[i * dim + j];
      for (let k = 0; k < j; k += 1) s -= L[i * dim + k] * L[j * dim + k];
      if (i === j) {
        if (s <= 0) s = Math.max(s, 1e-12);
        L[i * dim + j] = Math.sqrt(s);
      } else {
        L[i * dim + j] = s / L[j * dim + j];
      }
    }
  }
  return L;
}

function applyLower(L, u, dim, out = null) {
  out = out ?? zeros(dim);
  for (let i = 0; i < dim; i += 1) {
    let s = 0;
    for (let j = 0; j <= i; j += 1) s += L[i * dim + j] * u[j];
    out[i] = s;
  }
  return out;
}

// ==== targets =============================================================

export function gaussian2dTarget({ mu = [0, 0], sigma = [1, 1] } = {}) {
  return {
    name: 'gaussian2d',
    dim: 2,
    mu, sigma,
    logProb(x) {
      const dx = x[0] - mu[0], dy = x[1] - mu[1];
      return -0.5 * (dx * dx / (sigma[0] * sigma[0]) + dy * dy / (sigma[1] * sigma[1]));
    },
    gradLogProb(x, out = null) {
      out = out ?? zeros(2);
      out[0] = -(x[0] - mu[0]) / (sigma[0] * sigma[0]);
      out[1] = -(x[1] - mu[1]) / (sigma[1] * sigma[1]);
      return out;
    },
  };
}

// 2D banana (Rosenbrock-flavoured): x ~ N(0, sigmaX^2),
// y ~ N(x^2 - b, (sigmaY / a)^2). Curved valley along y = x^2 - b.
export function bananaTarget({ a = 1.0, b = 1.0, sigmaX = 2.0, sigmaY = 1.0 } = {}) {
  return {
    name: 'banana',
    dim: 2,
    a, b, sigmaX, sigmaY,
    logProb(x) {
      const xx = x[0], yy = x[1];
      const r1 = xx / sigmaX;
      const r2 = a * (yy - (xx * xx - b)) / sigmaY;
      return -0.5 * (r1 * r1 + r2 * r2);
    },
    gradLogProb(x, out = null) {
      out = out ?? zeros(2);
      const xx = x[0], yy = x[1];
      const denom = sigmaY * sigmaY;
      const u = yy - (xx * xx - b);
      out[0] = -xx / (sigmaX * sigmaX) + (a * a * u * 2 * xx) / denom;
      out[1] = -(a * a * u) / denom;
      return out;
    },
  };
}

export function mixture2dTarget({ c1 = [-3, 0], c2 = [3, 0], sigma = 1.0, w1 = 0.5 } = {}) {
  const w2 = 1 - w1;
  return {
    name: 'mixture2d',
    dim: 2,
    c1, c2, sigma, w1, w2,
    logProb(x) {
      const d1 = (x[0] - c1[0]) * (x[0] - c1[0]) + (x[1] - c1[1]) * (x[1] - c1[1]);
      const d2 = (x[0] - c2[0]) * (x[0] - c2[0]) + (x[1] - c2[1]) * (x[1] - c2[1]);
      const inv2s2 = 1 / (2 * sigma * sigma);
      const l1 = Math.log(w1) - d1 * inv2s2;
      const l2 = Math.log(w2) - d2 * inv2s2;
      const mx = l1 > l2 ? l1 : l2;
      return mx + Math.log(Math.exp(l1 - mx) + Math.exp(l2 - mx));
    },
    gradLogProb(x, out = null) {
      out = out ?? zeros(2);
      const d1 = (x[0] - c1[0]) * (x[0] - c1[0]) + (x[1] - c1[1]) * (x[1] - c1[1]);
      const d2 = (x[0] - c2[0]) * (x[0] - c2[0]) + (x[1] - c2[1]) * (x[1] - c2[1]);
      const inv2s2 = 1 / (2 * sigma * sigma);
      const l1 = Math.log(w1) - d1 * inv2s2;
      const l2 = Math.log(w2) - d2 * inv2s2;
      const mx = l1 > l2 ? l1 : l2;
      const e1 = Math.exp(l1 - mx), e2 = Math.exp(l2 - mx);
      const p1 = e1 / (e1 + e2), p2 = e2 / (e1 + e2);
      const invs2 = 1 / (sigma * sigma);
      out[0] = -p1 * (x[0] - c1[0]) * invs2 - p2 * (x[0] - c2[0]) * invs2;
      out[1] = -p1 * (x[1] - c1[1]) * invs2 - p2 * (x[1] - c2[1]) * invs2;
      return out;
    },
  };
}

// Neal's funnel in 2D: v ~ N(0, sigmaV^2), x ~ N(0, exp(v)).
export function funnelTarget({ sigmaV = 3.0 } = {}) {
  return {
    name: 'funnel',
    dim: 2,
    sigmaV,
    logProb(x) {
      const v = x[0], xx = x[1];
      const lpv = -0.5 * (v * v) / (sigmaV * sigmaV);
      const lpx = -0.5 * v - 0.5 * xx * xx * Math.exp(-v);
      return lpv + lpx;
    },
    gradLogProb(x, out = null) {
      out = out ?? zeros(2);
      const v = x[0], xx = x[1];
      out[0] = -v / (sigmaV * sigmaV) - 0.5 + 0.5 * xx * xx * Math.exp(-v);
      out[1] = -xx * Math.exp(-v);
      return out;
    },
  };
}

export const TARGETS = {
  gaussian2d: gaussian2dTarget,
  banana:     bananaTarget,
  mixture2d:  mixture2dTarget,
  funnel:     funnelTarget,
};

// ==== common sampler scaffold =============================================

function baseState(method, target, x0, seed) {
  if (x0.length !== target.dim) throw new Error('x0 length must equal target.dim');
  const x = Float64Array.from(x0);
  return {
    method,
    target,
    dim: target.dim,
    rng: makeRng(seed),
    x,
    logP: target.logProb(x),
    accepted: 0,
    proposed: 0,
  };
}

// ==== RWM =================================================================

export function createRWM({ target, x0, sigma = 1.0, seed = 0xC0FFEE } = {}) {
  const state = baseState('rwm', target, x0, seed);
  state.sigma = sigma;
  const xProp = zeros(state.dim);
  state.step = function step() {
    state.proposed += 1;
    for (let i = 0; i < state.dim; i += 1) {
      xProp[i] = state.x[i] + state.sigma * randn(state.rng);
    }
    const lpProp = target.logProb(xProp);
    const u = state.rng();
    if (Math.log(u) < lpProp - state.logP) {
      copyVec(state.x, xProp);
      state.logP = lpProp;
      state.accepted += 1;
      return { accepted: true, x: Array.from(state.x), logProb: lpProp };
    }
    return { accepted: false, x: Array.from(state.x), logProb: state.logP };
  };
  return wrapChain(state);
}

// ==== Adaptive RWM (Haario-Saksman) =======================================

export function createAdaptiveRWM({
  target, x0,
  sigma = 1.0,
  warmup = 200,
  scaleFactor = null,
  jitter = 0.05,
  seed = 0xC0FFEE,
} = {}) {
  const state = baseState('adaptive-rwm', target, x0, seed);
  state.sigma = sigma;
  state.warmup = warmup;
  state.scaleFactor = scaleFactor ?? (2.38 * 2.38 / state.dim);
  state.jitter = jitter;

  state.mean = zeros(state.dim);
  state.M2   = zeros(state.dim * state.dim);
  state.nSeen = 0;
  state.chol  = null;
  const xProp = zeros(state.dim);
  const u = zeros(state.dim);

  function updateMoments(x) {
    state.nSeen += 1;
    const n = state.nSeen;
    const delta = zeros(state.dim);
    for (let i = 0; i < state.dim; i += 1) delta[i] = x[i] - state.mean[i];
    for (let i = 0; i < state.dim; i += 1) state.mean[i] += delta[i] / n;
    for (let i = 0; i < state.dim; i += 1) {
      for (let j = 0; j < state.dim; j += 1) {
        state.M2[i * state.dim + j] += delta[i] * (x[j] - state.mean[j]);
      }
    }
  }

  state.step = function step() {
    state.proposed += 1;
    let useAdaptive = false;
    if (state.nSeen > state.warmup) {
      const cov = zeros(state.dim * state.dim);
      for (let i = 0; i < state.dim * state.dim; i += 1) {
        cov[i] = state.M2[i] / (state.nSeen - 1);
      }
      for (let i = 0; i < state.dim; i += 1) cov[i * state.dim + i] += state.jitter;
      state.chol = cholesky(cov, state.dim);
      useAdaptive = true;
    }
    if (useAdaptive) {
      randnVec(state.rng, state.dim, u);
      applyLower(state.chol, u, state.dim, xProp);
      const s = Math.sqrt(state.scaleFactor);
      for (let i = 0; i < state.dim; i += 1) xProp[i] = state.x[i] + s * xProp[i];
    } else {
      for (let i = 0; i < state.dim; i += 1) {
        xProp[i] = state.x[i] + state.sigma * randn(state.rng);
      }
    }
    const lpProp = target.logProb(xProp);
    if (Math.log(state.rng()) < lpProp - state.logP) {
      copyVec(state.x, xProp);
      state.logP = lpProp;
      state.accepted += 1;
      updateMoments(state.x);
      return { accepted: true, x: Array.from(state.x), logProb: lpProp };
    }
    updateMoments(state.x);
    return { accepted: false, x: Array.from(state.x), logProb: state.logP };
  };
  return wrapChain(state);
}

// ==== MALA (preconditioner P = I in the first cut) =========================

export function createMALA({
  target, x0,
  stepSize = 0.1,
  seed = 0xC0FFEE,
} = {}) {
  const state = baseState('mala', target, x0, seed);
  state.stepSize = stepSize;

  const grad = zeros(state.dim);
  const gradProp = zeros(state.dim);
  const xProp = zeros(state.dim);
  const noise = zeros(state.dim);

  function meanFrom(x, g, out) {
    const eps2 = state.stepSize * state.stepSize;
    for (let i = 0; i < state.dim; i += 1) out[i] = x[i] + 0.5 * eps2 * g[i];
    return out;
  }

  function logQ(xTo, xFrom, gradFrom) {
    const m = meanFrom(xFrom, gradFrom, zeros(state.dim));
    let s = 0;
    for (let i = 0; i < state.dim; i += 1) {
      const d = xTo[i] - m[i];
      s += d * d;
    }
    return -0.5 * s / (state.stepSize * state.stepSize);
  }

  target.gradLogProb(state.x, grad);

  state.step = function step() {
    state.proposed += 1;
    randnVec(state.rng, state.dim, noise);
    const eps = state.stepSize;
    for (let i = 0; i < state.dim; i += 1) {
      xProp[i] = state.x[i] + 0.5 * eps * eps * grad[i] + eps * noise[i];
    }
    const lpProp = target.logProb(xProp);
    target.gradLogProb(xProp, gradProp);
    const lqFwd = logQ(xProp, state.x, grad);
    const lqBwd = logQ(state.x, xProp, gradProp);
    const logAcc = (lpProp - state.logP) + (lqBwd - lqFwd);
    if (Math.log(state.rng()) < logAcc) {
      copyVec(state.x, xProp);
      state.logP = lpProp;
      copyVec(grad, gradProp);
      state.accepted += 1;
      return { accepted: true, x: Array.from(state.x), logProb: state.logP };
    }
    return { accepted: false, x: Array.from(state.x), logProb: state.logP };
  };
  return wrapChain(state);
}

// ==== HMC (leapfrog, fixed step count) =====================================

// p ~ N(0, M = I). H(x, p) = -logProb(x) + 0.5 * p^T p.
// One trajectory: half kick, L drifts each followed by a full kick except the
// last which uses half. We use the conventional half/full/half ordering.
export function createHMC({
  target, x0,
  stepSize = 0.1,
  nLeapfrog = 10,
  seed = 0xC0FFEE,
} = {}) {
  const state = baseState('hmc', target, x0, seed);
  state.stepSize = stepSize;
  state.nLeapfrog = nLeapfrog;

  const xProp = zeros(state.dim);
  const pProp = zeros(state.dim);
  const grad  = zeros(state.dim);

  state.step = function step() {
    state.proposed += 1;
    const eps = state.stepSize;
    const L = state.nLeapfrog;
    const p0 = randnVec(state.rng, state.dim);
    copyVec(xProp, state.x);
    copyVec(pProp, p0);
    target.gradLogProb(xProp, grad);
    for (let i = 0; i < state.dim; i += 1) pProp[i] += 0.5 * eps * grad[i];
    for (let li = 0; li < L; li += 1) {
      for (let i = 0; i < state.dim; i += 1) xProp[i] += eps * pProp[i];
      target.gradLogProb(xProp, grad);
      const kickScale = (li === L - 1) ? 0.5 : 1.0;
      for (let i = 0; i < state.dim; i += 1) pProp[i] += kickScale * eps * grad[i];
    }
    const lpProp = target.logProb(xProp);
    const H0 = -state.logP + 0.5 * dot(p0, p0);
    const H1 = -lpProp     + 0.5 * dot(pProp, pProp);
    const logAcc = H0 - H1;
    if (Math.log(state.rng()) < logAcc) {
      copyVec(state.x, xProp);
      state.logP = lpProp;
      state.accepted += 1;
      return { accepted: true, x: Array.from(state.x), logProb: state.logP };
    }
    return { accepted: false, x: Array.from(state.x), logProb: state.logP };
  };
  return wrapChain(state);
}

// ==== top-level factory ===================================================

export function createChain({ method, target, x0, params = {}, seed = 0xC0FFEE } = {}) {
  switch (method) {
    case 'rwm':          return createRWM({ target, x0, seed, ...params });
    case 'adaptive-rwm': return createAdaptiveRWM({ target, x0, seed, ...params });
    case 'mala':         return createMALA({ target, x0, seed, ...params });
    case 'hmc':          return createHMC({ target, x0, seed, ...params });
    default: throw new Error(`unknown method ${method}`);
  }
}

// ==== shared chain wrapper ================================================

function wrapChain(state) {
  return {
    state,
    get x()           { return state.x; },
    get acceptance()  { return state.proposed === 0 ? 0 : state.accepted / state.proposed; },
    step:             state.step,
    run(N) {
      const out = new Float64Array(N * state.dim);
      for (let i = 0; i < N; i += 1) {
        state.step();
        for (let j = 0; j < state.dim; j += 1) out[i * state.dim + j] = state.x[j];
      }
      return out;
    },
    diagnostics(trace = null) {
      const out = { acceptance: this.acceptance };
      if (trace) {
        const N = trace.length / state.dim;
        const dim = state.dim;
        out.mean = zeros(dim);
        for (let i = 0; i < N; i += 1) {
          for (let j = 0; j < dim; j += 1) out.mean[j] += trace[i * dim + j];
        }
        for (let j = 0; j < dim; j += 1) out.mean[j] /= N;
        out.var = zeros(dim);
        for (let i = 0; i < N; i += 1) {
          for (let j = 0; j < dim; j += 1) {
            const d = trace[i * dim + j] - out.mean[j];
            out.var[j] += d * d;
          }
        }
        for (let j = 0; j < dim; j += 1) out.var[j] /= (N - 1);
        out.ess = zeros(dim);
        for (let j = 0; j < dim; j += 1) {
          const col = new Float64Array(N);
          for (let i = 0; i < N; i += 1) col[i] = trace[i * dim + j];
          const ac = autocorrelation(col);
          out.ess[j] = ac.ess;
        }
      }
      return out;
    },
  };
}

// ==== diagnostic helpers ==================================================

// 1D Kolmogorov-Smirnov statistic between empirical samples and an analytic CDF.
export function ks1D(samples, cdf) {
  const sorted = Float64Array.from(samples);
  sorted.sort();
  const n = sorted.length;
  let dmax = 0;
  for (let i = 0; i < n; i += 1) {
    const F = cdf(sorted[i]);
    const a = Math.abs((i + 1) / n - F);
    const b = Math.abs(i / n - F);
    const d = a > b ? a : b;
    if (d > dmax) dmax = d;
  }
  return dmax;
}

export function normCdf(x, mu = 0, sigma = 1) {
  const z = (x - mu) / (sigma * Math.SQRT2);
  return 0.5 * (1 + erf(z));
}

// Abramowitz-Stegun erf approximation, max error 1.5e-7.
export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}
