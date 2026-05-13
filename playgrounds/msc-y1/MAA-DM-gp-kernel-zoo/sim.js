// sim.js
// 1D Gaussian Process kernels and prior / posterior sampling.
// Implemented kernels: RBF (squared exponential), Matern 3/2, Matern 5/2,
// periodic, linear.
//
// For visualization: sample N_samples function draws from f ~ GP(0, K)
// evaluated on a 1D grid. Posterior conditioning: given observations
// (x_obs, y_obs) with noise sigma_n^2, condition on them and sample from
// the posterior GP.
//
// Reference: Murphy V1 2022 Ch. 17; MacKay 2003 Ch. 45.

import { makeRng, gaussian } from '../../../shared/js/render/rng.js';

export const KERNELS = {
  rbf:      (ell, sigma_f) => (x1, x2) => sigma_f * sigma_f * Math.exp(-0.5 * (x1 - x2) ** 2 / (ell * ell)),
  matern32: (ell, sigma_f) => (x1, x2) => {
    const r = Math.abs(x1 - x2) / ell;
    return sigma_f * sigma_f * (1 + Math.sqrt(3) * r) * Math.exp(-Math.sqrt(3) * r);
  },
  matern52: (ell, sigma_f) => (x1, x2) => {
    const r = Math.abs(x1 - x2) / ell;
    return sigma_f * sigma_f * (1 + Math.sqrt(5) * r + (5 / 3) * r * r) * Math.exp(-Math.sqrt(5) * r);
  },
  periodic: (ell, sigma_f, p = 1.5) => (x1, x2) => {
    const dx = x1 - x2;
    const s = Math.sin(Math.PI * dx / p);
    return sigma_f * sigma_f * Math.exp(-2 * s * s / (ell * ell));
  },
  linear: (ell, sigma_f) => (x1, x2) => sigma_f * sigma_f * x1 * x2 + ell * ell,
};

// Build covariance matrix K from a kernel function and grid xs.
export function covariance(kernel, xs) {
  const n = xs.length;
  const K = new Float64Array(n * n);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      K[i * n + j] = kernel(xs[i], xs[j]);
    }
  }
  return K;
}

// Cholesky decomposition of K (assumes symmetric positive definite).
// Stores lower-triangular L in-place. Adds jitter * I to ensure SPD.
export function cholesky(K, n, jitter = 1e-6) {
  const L = new Float64Array(n * n);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let sum = K[i * n + j];
      if (i === j) sum += jitter;
      for (let k = 0; k < j; k += 1) sum -= L[i * n + k] * L[j * n + k];
      if (i === j) L[i * n + j] = Math.sqrt(Math.max(1e-12, sum));
      else L[i * n + j] = sum / L[j * n + j];
    }
  }
  return L;
}

// Solve L y = b for lower-triangular L (column-major doesn't apply here).
function forwardSubL(L, b, n) {
  const y = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    let s = b[i];
    for (let j = 0; j < i; j += 1) s -= L[i * n + j] * y[j];
    y[i] = s / L[i * n + i];
  }
  return y;
}

// Solve L^T x = y for x.
function backwardSubLT(L, y, n) {
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i -= 1) {
    let s = y[i];
    for (let j = i + 1; j < n; j += 1) s -= L[j * n + i] * x[j];
    x[i] = s / L[i * n + i];
  }
  return x;
}

// Sample N draws from the GP prior on grid xs.
export function priorSamples(kernel, xs, nSamples = 5, seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  const n = xs.length;
  const K = covariance(kernel, xs);
  const L = cholesky(K, n);
  const draws = [];
  for (let s = 0; s < nSamples; s += 1) {
    const z = new Float64Array(n);
    for (let i = 0; i < n; i += 1) z[i] = gaussian(rng, 0, 1);
    // f = L z
    const f = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      let sum = 0;
      for (let j = 0; j <= i; j += 1) sum += L[i * n + j] * z[j];
      f[i] = sum;
    }
    draws.push(f);
  }
  return draws;
}

// Posterior mean and std given observations (xObs, yObs) at noise sigma_n.
export function posterior(kernel, xs, xObs, yObs, sigma_n = 0.05) {
  const n = xs.length;
  const m = xObs.length;
  if (m === 0) {
    const mu = new Float64Array(n);
    const std = new Float64Array(n);
    for (let i = 0; i < n; i += 1) std[i] = Math.sqrt(kernel(xs[i], xs[i]));
    return { mu, std };
  }
  // K_oo = kernel(x_obs, x_obs) + sigma_n^2 I
  const Koo = new Float64Array(m * m);
  for (let i = 0; i < m; i += 1) for (let j = 0; j < m; j += 1) {
    Koo[i * m + j] = kernel(xObs[i], xObs[j]) + (i === j ? sigma_n * sigma_n : 0);
  }
  const Loo = cholesky(Koo, m, 1e-9);
  // alpha = Koo^{-1} y_obs via forward+backward
  const alphaTmp = forwardSubL(Loo, yObs, m);
  const alpha = backwardSubLT(Loo, alphaTmp, m);
  // For each test point: mu(x*) = k(x*, X) alpha
  // var(x*) = k(x*, x*) - k(x*, X) Koo^{-1} k(X, x*)
  const mu = new Float64Array(n);
  const std = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const ks = new Float64Array(m);
    for (let j = 0; j < m; j += 1) ks[j] = kernel(xs[i], xObs[j]);
    let mui = 0;
    for (let j = 0; j < m; j += 1) mui += ks[j] * alpha[j];
    mu[i] = mui;
    // v = L^{-1} k(X, x*)
    const v = forwardSubL(Loo, ks, m);
    let vDotv = 0;
    for (let j = 0; j < m; j += 1) vDotv += v[j] * v[j];
    const var_i = kernel(xs[i], xs[i]) - vDotv;
    std[i] = Math.sqrt(Math.max(1e-12, var_i));
  }
  return { mu, std };
}
