---
title: Uniform vs Pointwise Convergence
slug: uniform-vs-pointwise-convergence
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M1017
curriculum_year: bsc-y1s1
primary_citation: rudin-pma
primary_chapter: 7
hook: "f_n can settle at every single point yet never settle as a whole. Watch a bump slide to the edge keeping the sup-norm pinned away from zero."
one_paragraph: "Pointwise convergence means f_n(x) -> f(x) at each fixed x; uniform convergence is the stronger claim that the worst-case gap, the sup-norm ||f_n - f||, goes to zero. The two differ: x^n on [0,1] converges pointwise to a discontinuous step while its sup-norm stays at 1, and a bump of fixed or growing height can slide toward the edge so f_n -> 0 everywhere while the sup-norm refuses to fall; only a flattening ramp converges uniformly. The playground sweeps n and draws f_n with its limit and the sup-norm gap, plotting that sup-norm against n, the single number that tells uniform from merely pointwise."
tags: [real-analysis, convergence, sequences-of-functions, sup-norm, animation, interactive]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [fn]
invariants:
  - key: pointwise
    label: every sequence converges pointwise, f_n(x0) -> f(x0)
    tolerance: 0.05
  - key: uniform
    label: uniform convergence iff the sup-norm goes to zero
    tolerance: 0.0
  - key: discontinuous
    label: a pointwise limit can be discontinuous (x^n on [0,1])
    tolerance: 0.0
what_to_try:
  - Sweep n; the ramp flattens onto zero (uniform) while the bumps keep a gap open (pointwise only).
  - On x^n, watch the limit turn discontinuous at x = 1.
  - Drag the probe x0; f_n(x0) always settles, even when the sup-norm does not.
references:
  - "Rudin, Principles of Mathematical Analysis, 3rd ed., Sec. 7.1-7.2 (uniform convergence)."
  - "Abbott, Understanding Analysis, 2nd ed., Sec. 6.2."
---

# Uniform vs pointwise convergence

## Mathematical setup

A sequence of functions f_n is compared to its limit in two senses: pointwise (at
each x) and uniform (the whole graph at once).

## Equations

Pointwise: $f_n(x) \to f(x)$ for each fixed $x$. Uniform: the sup-norm

$$ \lVert f_n - f\rVert_\infty = \sup_x |f_n(x) - f(x)| \to 0. $$

Uniform implies pointwise, not the reverse; uniform limits preserve continuity.

## Numerical method

No engine. The sup-norm is computed by dense sampling over the domain; the
displayed index n sweeps continuously. No fabricated values.

## Controls

- Next sequence (x^n, sliding bump, growing bump, flattening ramp), maximum n;
  drag the probe x0.

## Expected qualitative features

1. All four sequences converge pointwise.
2. Only the ramp converges uniformly (sup-norm to zero); the bumps keep a gap and
   x^n keeps a shoulder near 1.
3. The x^n limit is discontinuous; the tall bump's sup-norm diverges.

## Invariants and acceptance thresholds

- Pointwise convergence at an interior point.
- Uniform convergence iff the sup-norm vanishes.
- The x^n pointwise limit is discontinuous.

## Citations

Rudin, Principles of Mathematical Analysis, 3rd ed., Sec. 7.1-7.2. Abbott,
Understanding Analysis, 2nd ed., Sec. 6.2.
