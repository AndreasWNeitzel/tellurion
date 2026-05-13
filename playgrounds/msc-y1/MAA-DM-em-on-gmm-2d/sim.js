// sim.js
// Expectation-maximization (EM) for a Gaussian mixture model in 2D.
//
// Generative model:
//   z_n ~ Cat(pi),   x_n | z_n = k ~ N(mu_k, Sigma_k).
// Parameters theta = (pi_k, mu_k, Sigma_k) for k = 1, ..., K.
//
// EM updates:
//   E-step (responsibilities):
//     gamma_{nk} = pi_k N(x_n; mu_k, Sigma_k) / sum_j pi_j N(x_n; mu_j, Sigma_j)
//   M-step:
//     N_k = sum_n gamma_{nk}
//     mu_k = (1/N_k) sum_n gamma_{nk} x_n
//     Sigma_k = (1/N_k) sum_n gamma_{nk} (x_n - mu_k)(x_n - mu_k)^T
//     pi_k = N_k / N
//
// log-likelihood:
//   L(theta) = sum_n log sum_k pi_k N(x_n; mu_k, Sigma_k)
// monotone non-decreasing under EM (Dempster, Laird, Rubin 1977).
//
// Reference: Bishop 2006, PRML, Section 9.2 (`bishop2006`); Murphy 2022, PML
// Vol. 1, Section 17.2 (`murphy2022pml`).

import { makeRng } from '../../../shared/js/render/rng.js';

const TWO_PI = 2 * Math.PI;

function gaussian2(x, mu, S) {
  const dx = x[0] - mu[0], dy = x[1] - mu[1];
  const det = S[0] * S[3] - S[1] * S[2];
  if (det <= 0) return 1e-30;
  const inv = 1 / det;
  const m00 = S[3] * inv, m01 = -S[1] * inv, m10 = -S[2] * inv, m11 = S[0] * inv;
  const z = dx * (m00 * dx + m01 * dy) + dy * (m10 * dx + m11 * dy);
  return Math.exp(-0.5 * z) / (TWO_PI * Math.sqrt(det));
}

// Generate a synthetic GMM dataset with K clusters of given means, covariances,
// mixing weights. Returns Float64Array of length 2 N (x, y).
export function sampleGMM({
  N = 600, K = 3, means, covs, weights, seed = 0xC0FFEE,
} = {}) {
  const rng = makeRng(seed);
  const data = new Float64Array(N * 2);
  const labels = new Int32Array(N);
  for (let n = 0; n < N; n += 1) {
    const u = rng();
    let s = 0, k = 0;
    for (k = 0; k < K; k += 1) { s += weights[k]; if (u < s) break; }
    if (k >= K) k = K - 1;
    labels[n] = k;
    const mu = means[k], S = covs[k];
    // Cholesky of S
    const a = Math.sqrt(S[0]);
    const b = S[1] / a;
    const c = Math.sqrt(Math.max(1e-9, S[3] - b * b));
    const u1 = rng(), u2 = rng();
    const z1 = Math.sqrt(-2 * Math.log(u1 + 1e-30)) * Math.cos(TWO_PI * u2);
    const z2 = Math.sqrt(-2 * Math.log(u1 + 1e-30)) * Math.sin(TWO_PI * u2);
    data[2 * n]     = mu[0] + a * z1;
    data[2 * n + 1] = mu[1] + b * z1 + c * z2;
  }
  return { data, labels };
}

// Initialize parameters: K-means-style spread of means across the data range.
export function initEM({ data, N, K, seed = 1 }) {
  const rng = makeRng(seed);
  // Spread the means by picking K random data points
  const means = [];
  const used = new Set();
  while (means.length < K) {
    const idx = Math.floor(rng() * N);
    if (!used.has(idx)) {
      used.add(idx);
      means.push([data[2 * idx], data[2 * idx + 1]]);
    }
  }
  // Initial cov: identity scaled by data spread
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (let i = 0; i < N; i += 1) {
    const x = data[2 * i], y = data[2 * i + 1];
    if (x < xmin) xmin = x; if (x > xmax) xmax = x;
    if (y < ymin) ymin = y; if (y > ymax) ymax = y;
  }
  const span = Math.max(xmax - xmin, ymax - ymin) / K;
  const covs = [];
  for (let k = 0; k < K; k += 1) covs.push([span * span, 0, 0, span * span]);
  const weights = new Float64Array(K);
  for (let k = 0; k < K; k += 1) weights[k] = 1 / K;
  return { means, covs, weights };
}

// One E-M iteration. Returns the responsibilities (N x K).
export function emStep({ data, N, K, means, covs, weights }) {
  // E-step
  const gamma = new Float64Array(N * K);
  let logLike = 0;
  for (let n = 0; n < N; n += 1) {
    const x = [data[2 * n], data[2 * n + 1]];
    let sum = 0;
    for (let k = 0; k < K; k += 1) {
      const v = weights[k] * gaussian2(x, means[k], covs[k]);
      gamma[n * K + k] = v;
      sum += v;
    }
    if (sum > 0) {
      for (let k = 0; k < K; k += 1) gamma[n * K + k] /= sum;
    }
    logLike += Math.log(sum + 1e-300);
  }
  // M-step
  const Nk = new Float64Array(K);
  const newMeans = [];
  for (let k = 0; k < K; k += 1) newMeans.push([0, 0]);
  for (let n = 0; n < N; n += 1) {
    for (let k = 0; k < K; k += 1) {
      const g = gamma[n * K + k];
      Nk[k] += g;
      newMeans[k][0] += g * data[2 * n];
      newMeans[k][1] += g * data[2 * n + 1];
    }
  }
  for (let k = 0; k < K; k += 1) {
    if (Nk[k] > 0) { newMeans[k][0] /= Nk[k]; newMeans[k][1] /= Nk[k]; }
  }
  const newCovs = [];
  for (let k = 0; k < K; k += 1) newCovs.push([0, 0, 0, 0]);
  for (let n = 0; n < N; n += 1) {
    for (let k = 0; k < K; k += 1) {
      const g = gamma[n * K + k];
      const dx = data[2 * n] - newMeans[k][0];
      const dy = data[2 * n + 1] - newMeans[k][1];
      newCovs[k][0] += g * dx * dx;
      newCovs[k][1] += g * dx * dy;
      newCovs[k][2] += g * dx * dy;
      newCovs[k][3] += g * dy * dy;
    }
  }
  for (let k = 0; k < K; k += 1) {
    if (Nk[k] > 0) {
      newCovs[k][0] /= Nk[k]; newCovs[k][1] /= Nk[k];
      newCovs[k][2] /= Nk[k]; newCovs[k][3] /= Nk[k];
      // Regularize to avoid singular covariance.
      newCovs[k][0] += 1e-6; newCovs[k][3] += 1e-6;
    }
  }
  const newWeights = new Float64Array(K);
  for (let k = 0; k < K; k += 1) newWeights[k] = Nk[k] / N;
  return { gamma, means: newMeans, covs: newCovs, weights: newWeights, logLike };
}

// One-sigma confidence ellipse for a 2x2 covariance, given a count of
// standard deviations s (=1 for 1-sigma). Returns parameterized list of
// (x, y) points along the ellipse.
export function ellipsePoints(mu, cov, s = 2, nPts = 64) {
  // Eigendecomposition of the 2x2 covariance.
  const a = cov[0], b = cov[1], d = cov[3];
  const trace = a + d, det = a * d - b * b;
  const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
  const lam1 = trace / 2 + disc;
  const lam2 = trace / 2 - disc;
  let theta;
  if (Math.abs(b) > 1e-12) theta = Math.atan2(lam1 - a, b);
  else theta = a >= d ? 0 : Math.PI / 2;
  const r1 = s * Math.sqrt(Math.max(0, lam1));
  const r2 = s * Math.sqrt(Math.max(0, lam2));
  const out = new Float64Array(nPts * 2);
  for (let i = 0; i < nPts; i += 1) {
    const t = (i / nPts) * TWO_PI;
    const x = r1 * Math.cos(t), y = r2 * Math.sin(t);
    out[2 * i]     = mu[0] + Math.cos(theta) * x - Math.sin(theta) * y;
    out[2 * i + 1] = mu[1] + Math.sin(theta) * x + Math.cos(theta) * y;
  }
  return out;
}
