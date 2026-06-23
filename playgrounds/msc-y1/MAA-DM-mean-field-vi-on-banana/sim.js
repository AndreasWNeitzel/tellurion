// sim.js
// Mean-field variational inference on a banana-shaped 2D distribution.
//
// Target: Rosenbrock-style banana, log p(x, y) = -((1 - x)^2 + 100 (y - x^2)^2 / 20)
// (normalized to peak at 0). Variational family: q(x, y) = N(mu_x, sigma_x^2) * N(mu_y, sigma_y^2)
// (mean-field Gaussian; independent x and y). Parameters theta = (mu_x, log sigma_x, mu_y, log sigma_y).
//
// We optimize ELBO = E_q[log p(x, y)] - E_q[log q(x, y)] by gradient descent
// on the reparameterization-gradient estimator with a fixed Monte Carlo
// sample size.
//
// Reference: Bishop and Bishop 2024 Deep Learning Ch. 16, Blei et al. 2017
// VI review (`bishop2006`).

import { makeRng, gaussian, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

function logBanana(x, y) {
  return -((1 - x) ** 2 + 100 * (y - x * x) ** 2) / 20;
}

function gradLogBanana(x, y) {
  // d/dx log p = -[ -2 (1 - x) + 100 * 2 (y - x^2) * (-2 x) ] / 20
  //            = -[ -2 + 2 x - 400 x (y - x^2) ] / 20
  const dx = -(-2 + 2 * x - 400 * x * (y - x * x)) / 20;
  const dy = -(100 * 2 * (y - x * x)) / 20;
  return [dx, dy];
}

const logQEntropy = (logSigmaX, logSigmaY) => 0.5 * Math.log(2 * Math.PI * Math.E) * 2 + logSigmaX + logSigmaY;

// Clip a value to [-cap, +cap].
const clip = (x, cap) => Math.max(-cap, Math.min(cap, x));

// One ELBO gradient step. theta is { muX, logSX, muY, logSY }.
// Gradient clipped at GRAD_CAP to prevent banana-tail blowups.
const GRAD_CAP = 50;
export function viStep(theta, lr = 0.005, K = 32, seed = null) {
  const rng = makeRng(seed === null ? DEFAULT_SEED : seed);   // null defaults to the canonical seed, not an unseeded draw
  const sigmaX = Math.exp(theta.logSX), sigmaY = Math.exp(theta.logSY);
  let dMuX = 0, dLogSX = 0, dMuY = 0, dLogSY = 0;
  let elboLogP = 0;
  for (let k = 0; k < K; k += 1) {
    const eps_x = gaussian(rng, 0, 1), eps_y = gaussian(rng, 0, 1);
    const x = theta.muX + sigmaX * eps_x;
    const y = theta.muY + sigmaY * eps_y;
    const [gxRaw, gyRaw] = gradLogBanana(x, y);
    const gx = clip(gxRaw, GRAD_CAP);
    const gy = clip(gyRaw, GRAD_CAP);
    elboLogP += logBanana(x, y) / K;
    dMuX += gx / K;
    dMuY += gy / K;
    dLogSX += gx * sigmaX * eps_x / K;
    dLogSY += gy * sigmaY * eps_y / K;
  }
  // Clip the averaged gradients again for safety.
  dMuX = clip(dMuX, GRAD_CAP);
  dMuY = clip(dMuY, GRAD_CAP);
  dLogSX = clip(dLogSX, GRAD_CAP);
  dLogSY = clip(dLogSY, GRAD_CAP);
  // Entropy contribution: d H / d logSX = 1; d H / d logSY = 1.
  dLogSX += 1;
  dLogSY += 1;
  // Gradient ASCENT on ELBO (maximize).
  theta.muX += lr * dMuX;
  theta.muY += lr * dMuY;
  // Constrain logSigma to [-3, 2] to prevent extreme widths.
  theta.logSX = Math.max(-3, Math.min(2, theta.logSX + lr * dLogSX));
  theta.logSY = Math.max(-3, Math.min(2, theta.logSY + lr * dLogSY));
  return elboLogP + logQEntropy(theta.logSX, theta.logSY);
}

export function createVI({ muX = 0, logSX = 0, muY = 0, logSY = 0 } = {}) {
  return { muX, logSX, muY, logSY };
}

// Sample N points from current q (for visualization).
export function sampleQ(theta, N = 200, seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  const out = new Float64Array(N * 2);
  const sigmaX = Math.exp(theta.logSX), sigmaY = Math.exp(theta.logSY);
  for (let i = 0; i < N; i += 1) {
    out[2 * i]     = theta.muX + sigmaX * gaussian(rng, 0, 1);
    out[2 * i + 1] = theta.muY + sigmaY * gaussian(rng, 0, 1);
  }
  return out;
}

// Evaluate log p on a grid (for contour plotting).
export function logPGrid(xs, ys) {
  const Nx = xs.length, Ny = ys.length;
  const g = new Float64Array(Nx * Ny);
  for (let j = 0; j < Ny; j += 1) for (let i = 0; i < Nx; i += 1) {
    g[j * Nx + i] = logBanana(xs[i], ys[j]);
  }
  return g;
}

export { logBanana };
