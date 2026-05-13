---
title: GP Kernel Zoo
slug: gp-kernel-zoo
status: verified
audience: portfolio
created: 2026-05-13
---

# Gaussian process kernel zoo

## Physical setup

A 1D Gaussian Process: a probability distribution over functions. Five kernels (RBF, Matern 3/2, Matern 5/2, periodic, linear) parameterized by length scale and amplitude. Top panel: prior samples (no data). Bottom panel: posterior conditioned on observations with noise sigma_n.

## Governing equations

  f(x) ~ GP(0, k(x, x'))
  mu(x*) = k(x*, X) (k(X, X) + sigma_n^2 I)^{-1} y
  var(x*) = k(x*, x*) - k(x*, X) (k(X, X) + sigma_n^2 I)^{-1} k(X, x*)

## Numerical method

Cholesky factorization of K + sigma_n^2 I (1e-6 jitter for stability). Forward and backward substitution. Prior draws via f = L z with z ~ N(0, I).

## Controls

- kernel: RBF, Matern 3/2, Matern 5/2, periodic, linear
- l (length scale): 0.10 - 2.5, default 0.7
- sigma_f (amplitude): 0.2 - 2.0, default 1.0
- sigma_n (observation noise): 0.01 - 0.5, default 0.05
- Clear observations / Resample priors

Click on the bottom panel to add an observation.

## Expected qualitative features

1. RBF: smooth (analytic) draws.
2. Matern: less smooth (finite differentiability).
3. Periodic: exact period repetition.
4. Linear: posterior reduces to linear regression.
5. Posterior at obs points has std ~ sigma_n.

## Invariants and acceptance thresholds

- Cholesky factors all standard kernels without error.
- Prior zero-mean: 200-draw average within 0.20 of zero.
- Posterior interpolates obs: |mu - y_obs| < 1e-3 at sigma_n = 1e-5.
- Posterior std <= prior std everywhere.
- k(x, x) = sigma_f^2 exactly for stationary kernels.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- sigma_n -> 0: exact interpolation.
- No observations: posterior = prior.
- l -> infinity: nearly-constant correlation across the grid.

## Visual fallback

Canvas2D only.

## Citations

- Murphy 2022, PML Vol. 1, Ch. 17 (`murphy2022pml`).
- MacKay 2003, Information Theory, Inference, and Learning Algorithms, Ch. 45 (`mackay2003`).
- Rasmussen and Williams 2006, Gaussian Processes for Machine Learning (background).

## Stretch goals

- Add log marginal likelihood readout for hyperparameter selection.
- Add posterior function sampling (in addition to mean +/- 2 sigma band).

## Risk register

- 100 grid points x 5 kernels: O(N^3) per render ~ 1 ms. Acceptable.
