---
title: Mean-Field VI on a Banana
slug: mean-field-vi-on-banana
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-DM
supporting_ucs: [MAA-ST]
curriculum_year: msc-y1
---

# Mean-field VI on a banana

## Physical setup

Fit a mean-field Gaussian q(x, y) = N(mu_x, sigma_x^2) * N(mu_y, sigma_y^2) to a Rosenbrock-style banana target. The banana is a long curved valley; the mean-field Gaussian is axis-aligned; this gap is the canonical failure mode of variational inference.

## Governing equations

Target: log p(x, y) = -((1 - x)^2 + 100 (y - x^2)^2) / 20.

ELBO: L(theta) = E_q[log p(x, y)] + H(q).
H(q) = log sigma_x + log sigma_y + log(2 pi e).

Reparameterization gradient:
  dL/dmu = E_eps[grad_x log p]
  dL/dlog sigma = E_eps[grad_x log p * eps * sigma] + 1 (entropy)

We estimate the expectation with K = 32 Monte Carlo samples per step. Gradients clipped at 50 per component to prevent banana-tail blowups; log sigma clamped to [-3, 2].

## Numerical method

Vanilla SGD, lr = 0.005 default. K = 32 MC samples.

## Controls

- lr: 0.001 - 0.02, default 0.005
- K: 8 - 128, default 32
- speed: 1 - 20, default 5
- Reset / Single step / Pause / Play

## Expected qualitative features

1. Initial state: q is a unit Gaussian at the origin.
2. After 200 iters: q shrinks to a compact ellipse near the bend of the banana.
3. The ellipse never follows the curvature; it sits at the "best" Gaussian approximation.
4. ELBO climbs from ~ -20 to a small positive value.

## Invariants and acceptance thresholds

- ELBO at iter 800 > ELBO at iter 50 (monotone modulo MC noise).
- After 1000 iters: |mu_x| < 1.0, mu_y < 1.5.
- log sigma stays in [-3, 2].
- log p topology: log p(0, 0) > log p(2, -2); along valley y = x^2, log p > -0.5.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- lr -> 0: no updates; q stays at initialization.
- K -> infinity: deterministic gradients; trajectory deterministic.
- Banana flattened (replace 100 with 0): target reduces to N(1, 10); VI recovers it exactly.

## Visual fallback

Canvas2D only.

## Citations

- Bishop and Bishop 2024, Deep Learning: Foundations and Concepts, Chapter 16 (`bishop2006`).
- Blei, Kucukelbir, McAuliffe 2017, "Variational Inference: A Review for Statisticians", J. Am. Stat. Assoc. 112, 859.

## Stretch goals

- Add a full-covariance Gaussian variant to show VI can recover the banana with the right family.
- Add HMC sampling for ground-truth comparison.
- Add the Pathwise vs Score-function gradient estimator comparison.

## Risk register

- Banana tails: gradient of log p is unbounded; clipping at 50 prevents the issue but the playground at extreme initial muX, muY may still drift slowly.
- K is small (32) by default to keep the per-frame cost low; bumping K reduces MC noise.
