---
title: Monte Carlo Integration Convergence
slug: mc-integration-convergence
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2018
primary_citation: hecht-optics
supporting_ucs: [MAA-NM, MAA-ST]
curriculum_year: bsc-y2s2
hook: 'Throw random darts at a shape and the fraction inside is its area; the error falls only as 1/sqrt(N), so ten times the accuracy costs a hundred times the darts.'
one_paragraph: 'Monte Carlo integration by hit-or-miss sampling: a shape lives in the unit square, uniform random darts are thrown, and the fraction landing inside estimates the shape''s area, which is the integral of its indicator function. The darts accumulate continuously so the estimate refines in front of you, and because the hit count is a Binomial random variable the standard error shrinks as 1/sqrt(N) regardless of the shape. The playground offers several shape presets (a quarter disk that estimates pi, an ellipse, an annulus, a four-petal rose) and plots the absolute error against N on log-log axes next to the 1/sqrt(N) reference. Reference: MacKay, Information Theory, Inference, and Learning Algorithms, Ch. 29; Press et al., Numerical Recipes, Ch. 7.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: consistency
    label: estimate within 3 sigma of the exact area
    tolerance: 1
  - key: convergence
    label: absolute error follows the 1/sqrt(N) law
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Pick the quarter disk and watch 4x the hit fraction approach pi.
  - Switch shapes and confirm the estimate re-converges to the new area.
  - Read the convergence panel: the error tracks the 1/sqrt(N) line.
references:
  - "Hecht, Optics, 5th ed."
---

# Monte Carlo integration and 1/sqrt(N) convergence

## Explainer

### What you are looking at

A shape sits in the unit square. Uniform random darts are thrown at
the square and accumulate continuously, coloured green inside the
shape and red outside. The fraction of darts that land inside
estimates the shape's area, because the unit square has area 1 and the
area is the integral of the shape's indicator function.

### The method

To estimate the area $A$ of a region $S \subset [0,1]^2$, throw $N$
uniform darts and count the hits $H$:

$$\hat A = \frac{H}{N}, \qquad (X_i, Y_i) \sim \mathrm{Uniform}([0,1]^2).$$

The hit count $H$ is $\mathrm{Binomial}(N, A)$, so the estimator is
unbiased and its standard error is

$$\mathrm{SE} = \sqrt{\frac{A(1-A)}{N}} \sim \frac{1}{\sqrt N}.$$

That $1/\sqrt N$ law is the signature of Monte Carlo: it is
independent of dimension (which is why Monte Carlo wins for
high-dimensional integrals), and it is slow (cutting the error by ten
needs a hundred times more darts).

### Shapes

Each preset has a known exact area, the convergence target:

- Quarter disk, area $\pi/4$. Four times the hit fraction estimates
  $\pi$, the classic Monte Carlo demonstration.
- Ellipse, area $\pi a b$.
- Annulus, area $\pi(R^2 - r^2)$.
- Four-petal rose $r \le a\,|\cos 2\theta|$, area $\pi a^2 / 2$.

### Things to try

- Watch the absolute error fall as $1/\sqrt N$: a straight line of
  slope $-1/2$ on the log-log convergence panel.
- Switch shapes and confirm the estimate re-converges to the new
  exact area.
- Note how the green darts alone reveal the shape outline as $N$
  grows.

### Where this comes from

Hit-or-miss Monte Carlo and the $1/\sqrt N$ error law follow MacKay,
*Information Theory, Inference, and Learning Algorithms*, Chapter 29,
and Press et al., *Numerical Recipes*, 3rd ed., Chapter 7.6.

## Physical setup

Estimate the area of a shape $S \subset [0,1]^2$ by hit-or-miss Monte
Carlo. Uniform darts $(X_i, Y_i)$ are thrown; the estimate is the hit
fraction $\hat A = H/N$. The hit count is $\mathrm{Binomial}(N, A)$,
so the estimator is unbiased with standard error
$\sqrt{A(1-A)/N}$.

## Numerical method

Seedable xoshiro128** RNG via the shared rng module. Each frame a
batch of darts is thrown, each tested against the shape's indicator
predicate, and the running hit and total tallies are updated. The
area estimate and its Binomial standard error are read from the
tallies.

## Controls

- shape: the region to estimate (quarter disk, ellipse, annulus,
  four-petal rose).
- darts/frame: how many darts are thrown each frame (40 to 240).
- Reset / Pause / Play.

## Expected qualitative features

1. The hit fraction converges to the shape's exact area.
2. The absolute error falls along the 1/sqrt(N) reference on the
   log-log convergence panel.
3. The accumulated green darts trace out the shape.

## Invariants and acceptance thresholds

1. Each shape's estimate is within 0.01 of the exact area at N = 4e5.
2. The standard error scales as 1/sqrt(N): the SE ratio between N and
   100N is in [7, 13].
3. Every shape lands within 4 sigma of its exact area at N = 5e4.
4. The running tallies are self-consistent (nTotal advances by the
   batch size; the hit count matches the dart list).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- A shape filling the whole square has area 1: every dart is a hit.
- A degenerate empty shape has area 0: no hits, SE = 0.

## Visual fallback

Canvas2D only. Left: the unit-square dart board with the shape mask
and accumulated darts. Right: the area readouts and a log-log panel
of absolute error vs N with the 1/sqrt(N) reference.

## Citations

- MacKay, Information Theory, Inference, and Learning Algorithms, Ch. 29.
- Press et al., Numerical Recipes 3e, Ch. 7.6 (hit-or-miss Monte Carlo).

## Stretch goals

- Stratified or quasi-random (Sobol) darts for faster convergence.
- A user-drawn shape.
- Multi-dimensional hit-or-miss.

## Risk register

- Very thin shapes have a low hit rate, so the estimate is noisier;
  the presets all keep a moderate area fraction.
