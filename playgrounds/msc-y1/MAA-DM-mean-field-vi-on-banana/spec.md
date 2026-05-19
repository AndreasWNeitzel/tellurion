---
title: Mean-Field VI on a Banana
slug: mean-field-vi-on-banana
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-DM
supporting_ucs: [MAA-ST]
curriculum_year: msc-y1
hook: 'Variational inference turns Bayesian inference into optimization; watch a mean-field Gaussian squeeze itself into a curved banana posterior and see exactly what that approximation gets wrong.'
one_paragraph: 'The true posterior is a long curved Rosenbrock valley, p(x,y) proportional to exp[-(x^2 + 10(y - x^2)^2)/2]. Variational inference replaces sampling with optimization: it fits the closest member of a simple family, here the mean-field Gaussian q(x,y) = N(x | mu_x, sigma_x^2) N(y | mu_y, sigma_y^2), which by construction cannot represent any x-y correlation. Maximizing the evidence lower bound (equivalently minimizing the reverse KL divergence from q to p) is mode-seeking: q collapses onto one region and underestimates the variance rather than averaging over the whole curved ridge, the canonical failure mode the visible mismatch makes obvious. The playground animates the Gaussian ellipse climbing the ELBO onto the banana while the readout tracks the bound. Reference: Bishop, Pattern Recognition and Machine Learning, Chapter 10; Blei, Kucukelbir and McAuliffe 2017.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Mean-field VI on a banana

## Explainer

### What you are looking at

Variational inference turns Bayesian inference into optimization:
instead of sampling the true posterior, pick the closest member of a
simple family of distributions. The playground does exactly that,
fitting an axis-aligned Gaussian to a curved "banana" posterior, and
the visible mismatch is the whole lesson about what VI gets wrong.

### The target and the approximation

The true posterior is a long, curved Rosenbrock valley
$p(x,y)\propto\exp[-(x^2 + 10(y-x^2)^2)/2]$. The approximating family
is the mean-field Gaussian: independent in each coordinate,

$$q(x,y) = \mathcal N(x\mid\mu_x,\sigma_x^2)\,
  \mathcal N(y\mid\mu_y,\sigma_y^2).$$

"Mean-field" means we forbid $q$ from representing any correlation
between $x$ and $y$.

### The ELBO and why VI is mode-seeking

VI maximizes the evidence lower bound, equivalently it minimizes the
reverse KL divergence from $q$ to $p$:

$$\mathrm{ELBO}(q)
  = \mathbb E_{q}\big[\log p(x,y)\big]
  + \mathbb H[q]
  = \log p(\text{data}) - \mathrm{KL}\big(q\,\|\,p\big).$$

Because it is the reverse KL $\mathrm{KL}(q\|p)$, $q$ is penalized
heavily for putting mass where $p$ is near zero, so it tucks itself
inside one part of the banana rather than spanning it. The
consequences are textbook: the fitted Gaussian sits on the high-
density region but is too narrow and ignores the curvature, so VI
systematically underestimates the posterior variance and misses the
$x$-$y$ correlation. The playground animates the ELBO climbing while
the $q$ ellipse settles into the banana, visibly failing to follow
the bend, the canonical mean-field failure mode.

### Things to try

- Watch the ELBO increase monotonically while the Gaussian ellipse
  shrinks onto the valley.
- Note the converged ellipse is narrower than the true spread
  (reverse-KL variance underestimation).
- See that the axis-aligned $q$ cannot tilt to follow the banana's
  curvature (the cost of the mean-field independence assumption).

### Where this comes from

The ELBO, reverse-KL (mode-seeking) behavior, and the mean-field
failure on correlated posteriors follow Blei, Kucukelbir and
McAuliffe, JASA 112, 859 (2017), and Bishop, *Pattern Recognition
and Machine Learning*, Chapter 10.

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
