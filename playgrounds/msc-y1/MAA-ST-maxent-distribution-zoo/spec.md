---
title: Maximum-Entropy Distributions Zoo
slug: maxent-distribution-zoo
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-ST
supporting_ucs: []
curriculum_year: msc-y1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Maximum-entropy distributions: a small zoo

## Physical setup

A 1D probability density on a continuous support. The maximum-entropy principle (Jaynes 1957) selects the density that maximizes differential entropy h(p) = -integral p ln p dx subject to fixed moments (or other linear functionals of p). The result depends entirely on the choice of constraints; this playground enumerates four canonical cases.

## Governing equations

- Support [a, b], no moments fixed: p(x) = 1/(b - a) on [a, b]; h = ln(b - a).
- Support [0, infinity), mean mu fixed: p(x) = (1/mu) e^{-x/mu}; h = 1 + ln mu.
- Support R, mean mu and variance sigma^2 fixed: p(x) = N(mu, sigma); h = 0.5 ln(2 pi e sigma^2).
- Support R, mean mu and E[|X - mu|] = b fixed: p(x) = (1/(2 b)) e^{-|x - mu|/b} (Laplace); h = 1 + ln(2 b).

## Numerical method

Closed-form pdfs evaluated on a 500-point grid sized to the active family. Numerical entropy by trapezoidal sum. Both reported live.

## Controls

- family: dropdown (gaussian, uniform, exponential, laplace)
- mu: location parameter (gaussian, laplace), -2 to 2
- sigma / b / mean: scale parameter (gaussian: sigma; laplace: b; exponential: mean), 0.3 to 3.0
- support: uniform half-width, 0.5 to 3.0

## Expected qualitative features

1. Selecting "uniform" with mean 0 collapses to a flat box; entropy ~ ln(2 supp).
2. Selecting "gaussian" gives a bell-shaped pdf; entropy scales with ln(sigma).
3. Selecting "exponential" gives the standard right-skewed pdf on [0, infinity).
4. Selecting "laplace" gives the double-exponential cusp at mu.

## Invariants and acceptance thresholds

- Closed-form entropies match A&S references to 12 sig figs.
- Numerical entropy matches analytic within:
  - 1 percent (gaussian, uniform)
  - 5 percent absolute (exponential, due to long-tail truncation at the grid edge)
  - 2 percent (laplace, due to cusp at mu)
- All pdfs integrate to 1 within 2 percent on their grid.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Gaussian sigma -> infinity: entropy diverges; numerical diverges with grid as expected.
- Uniform b -> a (zero support): h -> -infinity; numerical does not crash because we only render finite p.
- Exponential mean -> 0: h -> -infinity (analytic); numerical bounded by grid resolution.

## Visual fallback

Canvas2D only.

## Citations

- MacKay 2003, Information Theory, Inference, and Learning Algorithms, Section 22.2 (`mackay2003`).
- Cover and Thomas 2006, Elements of Information Theory, 2e, Section 12.1.
- Jaynes 1957, "Information Theory and Statistical Mechanics", Phys. Rev. 106 (the original maxent principle).

## Stretch goals

- Add a "constraints as Lagrange multipliers" derivation panel.
- Add the q-state discrete maxent (= uniform on q states).
- Add the log-normal: maxent on (0, infty) with fixed E[ln X], E[(ln X)^2].

## Risk register

- Long-tail truncation for the exponential family at the right edge of the grid causes the trapezoidal entropy to underestimate the analytic value by a few percent. Acceptable for visualization.
- The uniform pdf has discontinuities at the support endpoints; the trapezoidal sum picks up O(dx) error there, which is invisible at 500 grid points.
