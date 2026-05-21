---
title: Mutual Information of a Bivariate Gaussian
slug: mutual-information-2d
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-ST
supporting_ucs: [MAA-DM]
curriculum_year: msc-y1
hook: 'Correlation only sees straight-line dependence; mutual information sees all of it, in nats. For two correlated Gaussians it is exactly -1/2 ln(1 - rho^2): zero when independent, diverging as one variable comes to determine the other.'
one_paragraph: 'Mutual information I(X;Y) measures how much knowing one variable reduces uncertainty about the other: it is the Kullback-Leibler divergence between the true joint density and the product of the marginals, equivalently I = H(X) - H(X|Y), zero exactly when X and Y are independent and positive otherwise. For a bivariate Gaussian with correlation coefficient rho everything collapses to the closed form I(X;Y) = -1/2 ln(1 - rho^2), which depends only on rho^2 (positive and negative correlation carry the same information) and rises slowly then diverges as |rho| approaches 1. The playground renders the joint density as a heatmap with its marginals, sweeps rho and the marginal widths, and tracks both the exact I and a grid-integrated estimate, the workhorse quantity behind feature selection, the information bottleneck and channel analysis. Reference: Cover and Thomas, Elements of Information Theory, 2nd ed., Chapters 2 and 8; MacKay, Information Theory, Inference, and Learning Algorithms, Chapter 2.'
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
---

# Mutual information of a bivariate Gaussian

## Explainer

### What you are looking at

Mutual information answers "how much does knowing $X$ tell you about
$Y$?" in bits, capturing any dependence, not just linear correlation.
For two correlated Gaussians it has a clean closed form, so the
playground can show the joint cloud, its marginals, and the exact
mutual information as you tighten the correlation.

### The definition

Mutual information is the gap between treating $X$ and $Y$ as
independent and using their true joint distribution:

$$I(X;Y)
  = \iint p(x,y)\,
  \log\frac{p(x,y)}{p(x)\,p(y)}\,dx\,dy
  = \mathrm{KL}\big(p(x,y)\,\big\|\,p(x)p(y)\big).$$

Equivalently $I(X;Y) = H(X) - H(X\mid Y)$: the reduction in your
uncertainty about $X$ once $Y$ is known. It is zero exactly when $X$
and $Y$ are independent and otherwise positive.

### The Gaussian closed form

For a bivariate Gaussian with correlation coefficient $\rho$,
everything collapses to

$$I(X;Y) = -\tfrac12\,\ln\!\big(1 - \rho^2\big).$$

This single formula carries the intuition:

- $\rho=0$: independent, $I=0$ (knowing $X$ says nothing about $Y$).
- $|\rho|\to1$: $I\to\infty$ (one variable nearly determines the
  other).
- $I$ depends only on $\rho^2$: positive and negative correlation
  carry the same information, and the relationship is strongly
  nonlinear (you need $\rho\approx0.8$ before $I$ even reaches 0.5
  nat).

The playground sweeps $\rho$ and shows the joint heatmap tilt into an
ellipse while $I=-\tfrac12\ln(1-\rho^2)$ and the conditional spread
$H(X\mid Y)$ track it. This is the workhorse quantity behind feature
selection, the information bottleneck, and channel analysis.

### Things to try

- Set $\rho=0$ and see a round cloud with $I=0$ (independent).
- Increase $|\rho|$ and watch the ellipse thin while $I$ rises
  slowly then explodes near $|\rho|=1$.
- Flip the sign of $\rho$ and confirm $I$ is unchanged (it depends
  only on $\rho^2$).

### Where this comes from

The definition of mutual information and the Gaussian
$-\tfrac12\ln(1-\rho^2)$ result follow Cover and Thomas, *Elements of
Information Theory*, Chapters 2 and 8.

## Physical setup

A static, exact, no-integration example: two correlated Gaussian random variables (X, Y) with covariance Sigma. The joint density p(x, y) is rendered as a heatmap; the marginals p(x) and p(y) are drawn above and beside it. Mutual information I(X; Y) is the area you can carve out of the joint by knowing the marginals; for a Gaussian it admits a closed form -0.5 ln(1 - rho^2).

## Governing equations

For (X, Y) ~ N(0, Sigma) with

  Sigma = [[ sigma_x^2,            rho sigma_x sigma_y ],
           [ rho sigma_x sigma_y,  sigma_y^2 ]]

the differential entropy of a 2D Gaussian is

  h(X, Y) = 0.5 ln( (2 pi e)^2 det Sigma )

with det Sigma = sigma_x^2 sigma_y^2 (1 - rho^2). The marginals are univariate Gaussians:

  h(X) = 0.5 ln(2 pi e sigma_x^2)
  h(Y) = 0.5 ln(2 pi e sigma_y^2)

and mutual information collapses to:

  I(X; Y) = h(X) + h(Y) - h(X, Y) = -0.5 ln(1 - rho^2).

## Numerical method

Sample the analytic joint density on a 96 x 96 grid covering [-3.2, 3.2]^2. Compute marginals by trapezoidal sum over one axis. Compute differential entropies h(X), h(Y), h(X, Y) by negation of p ln p summed across the grid, weighted by cell area. The numerical I matches the closed form to a few percent at this resolution; the playground reports both.

## Controls

- rho: correlation coefficient, slider -0.98 to +0.98, default 0.6
- sigma_x: marginal std of X, slider 0.4 - 1.6, default 1.0
- sigma_y: marginal std of Y, slider 0.4 - 1.6, default 1.0
- Reset: default parameters
- rho = 0: snap to independent case

## Expected qualitative features

1. rho = 0: heatmap is an upright product of two Gaussians, no diagonal alignment; I = 0.
2. rho > 0: heatmap stretches along the +x = +y diagonal; I > 0.
3. rho < 0: heatmap stretches along +x = -y; same |I|.
4. As |rho| -> 1, the joint density collapses onto a line and I diverges.

## Invariants and acceptance thresholds

- I(0) = 0.
- I(0.5) == I(-0.5) exactly.
- I monotone in |rho| from 0 to 0.95.
- Numeric I within 3 percent of analytic for rho in [0, 0.85] at grid 96, span 3.2.
- Marginals integrate to 1 within 1 percent at rho = 0.6.
- Marginal entropy matches 0.5 ln(2 pi e sigma^2) within 2 percent.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- rho -> 0: marginals factorize, I -> 0.
- rho -> 1: joint concentrates on the diagonal line, I -> infinity (numerically caps when det Sigma underflows; we do not let the slider reach 1).
- sigma_x -> 0 (or sigma_y -> 0): the joint density becomes degenerate; the playground caps sigmas at 0.4 to avoid this.

## Visual fallback

Canvas2D only. The heatmap is drawn via an offscreen canvas at 96 x 96 then upscaled with `imageSmoothingEnabled = false` for a crisp look.

## Citations

- MacKay 2003, Information Theory, Inference, and Learning Algorithms, Chapter 2.
- Cover and Thomas 2006, Elements of Information Theory, 2e, Eq. 8.85.
- Murphy 2022, Probabilistic Machine Learning Vol. 1, Section 6.3.

## Stretch goals

- Add a "samples" mode that draws (X, Y) draws from the joint as scatter on top of the heatmap.
- Add a Kraskov k-NN MI estimator on the samples to show it converging toward the closed-form value.

## Risk register

- At rho > 0.95 the joint density spikes; the colormap saturates and the heatmap looks flat. Capping the slider at 0.98 mitigates.
- 96 x 96 grid is the floor at which numerical I matches analytic to a few percent for unit sigmas and span 3.2. Smaller grids introduce > 5 percent bias.
