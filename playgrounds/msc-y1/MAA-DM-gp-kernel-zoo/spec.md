---
title: GP Kernel Zoo
slug: gp-kernel-zoo
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-DM
primary_citation: bishop2006
supporting_ucs: [MAA-ST]
curriculum_year: msc-y1
hook: 'A Gaussian process is a probability distribution over whole functions; pick a kernel and watch the prior fog of plausible curves collapse onto a handful of data points with calibrated uncertainty (wide between points, tight on them).'
one_paragraph: 'A Gaussian process places a prior over functions: any finite set of values is jointly Gaussian with mean zero and covariance set by a kernel k(x, x''), which encodes how smooth, wiggly or periodic the function is. Conditioning on noisy observations gives a closed-form Gaussian posterior, with mean mu(x*) = k(x*,X)[K + sigma_n^2 I]^-1 y and variance k(x*,x*) minus k(x*,X)[K + sigma_n^2 I]^-1 k(X,x*). The playground lets you switch among kernels (squared-exponential, Matern, periodic, linear) and see how each reshapes both the prior sample functions and the data-conditioned posterior with its uncertainty band. Reference: Rasmussen and Williams, Gaussian Processes for Machine Learning, Chapters 2 and 4.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "Bishop, Pattern Recognition and Machine Learning."
---

# Gaussian process kernel zoo

## Explainer

### What you are looking at

A Gaussian process is a probability distribution not over numbers but
over whole functions. Before you see data it is a fog of plausible
curves; show it a few points and the fog collapses to curves that pass
through them, with calibrated uncertainty (wide between points, tight
on them). The playground lets you pick the kernel and watch prior and
posterior.

### What a GP is

Assume any finite set of function values is jointly Gaussian with mean
zero and covariance set by a kernel $k(x,x')$:

$$f(x) \sim \mathcal{GP}\big(0,\ k(x,x')\big).$$

The kernel encodes your prior beliefs about the function: how smooth,
how wiggly, how periodic. Conditioning on noisy observations $y$ at
inputs $X$ gives a closed-form Gaussian posterior at any test point
$x_\*$:

$$\mu(x_\*) = k(x_\*,X)\big[K + \sigma_n^2 I\big]^{-1} y,$$

$$\mathrm{var}(x_\*) = k(x_\*,x_\*)
  - k(x_\*,X)\big[K + \sigma_n^2 I\big]^{-1} k(X,x_\*).$$

That single linear-algebra line is exact Bayesian regression: a
predictive mean and an honest error bar everywhere.

### The kernel is the model

The playground's five kernels show how the kernel choice is the
modeling choice:

- RBF (squared-exponential): infinitely smooth, gentle curves.
- Matern 3/2, 5/2: rougher, more realistic for physical signals.
- Periodic: enforces a repeating structure.
- Linear: GP reduces to Bayesian linear regression.

The length scale sets how fast correlations decay (how wiggly the
samples are); the amplitude sets their vertical spread; the noise
$\sigma_n$ sets how tightly the posterior must hit the data. The error
band widening away from observations is the headline feature: the model
knows what it does not know. GPs are the backbone of Bayesian
optimization and emulation of expensive simulators.

### Things to try

- Draw prior samples (no data) and watch the kernel's character: RBF
  smooth, Matern rough, periodic repeating.
- Add observations and watch the posterior collapse onto them with the
  error band pinching at the points and ballooning between.
- Shrink the length scale and watch the samples get wigglier and the
  posterior less confident far from data.

### Where this comes from

The GP prior, the conditioning equations, and the kernel zoo follow
Rasmussen and Williams, *Gaussian Processes for Machine Learning*
(2006).

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

- Murphy 2022, PML Vol. 1, Ch. 17.
- MacKay 2003, Information Theory, Inference, and Learning Algorithms, Ch. 45.
- Rasmussen and Williams 2006, Gaussian Processes for Machine Learning (background).

## Stretch goals

- Add log marginal likelihood readout for hyperparameter selection.
- Add posterior function sampling (in addition to mean +/- 2 sigma band).

## Risk register

- 100 grid points x 5 kernels: O(N^3) per render ~ 1 ms. Acceptable.
