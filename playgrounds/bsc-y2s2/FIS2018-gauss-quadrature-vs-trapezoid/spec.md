---
title: Gauss-Legendre vs Trapezoid Quadrature
slug: gauss-quadrature-vs-trapezoid
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2018
primary_citation: hecht-optics
supporting_ucs: [M3012, MAA-NM]
curriculum_year: bsc-y2s2
hook: 'The trapezoid rule needs hundreds of points where Gauss-Legendre nails a smooth integral with a handful, just by choosing where to sample.'
one_paragraph: 'Both rules approximate an integral as a weighted sum of samples, but they differ in where the samples go. The trapezoid rule uses n + 1 equispaced points and converges slowly; Gauss-Legendre places n nodes at the roots of the Legendre polynomial and integrates polynomials up to degree 2n - 1 exactly, so for smooth functions it converges far faster. The playground evaluates both on several test integrands and plots the error against the number of points, so the gap, and where Gauss loses its edge (on non-smooth functions like sqrt|x|), is explicit. Reference: Press et al., Numerical Recipes, Ch. 4.'
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
  - "Hecht, Optics, 5th ed."
---

# Gauss-Legendre vs trapezoid quadrature

## Explainer

### What you are looking at

Two ways to compute an integral numerically. The trapezoidal rule lays
down evenly spaced points and connects them with straight lines.
Gauss-Legendre instead chooses both the point positions and their
weights optimally. For smooth functions Gauss-Legendre is staggeringly
more accurate for the same number of points, and the playground shows
that gap shrink as you add nodes.

### The two rules

Approximate $\int_{-1}^{1} f(x)\,dx$ as a weighted sum of samples:

$$\int_{-1}^{1} f(x)\,dx \approx \sum_{i} w_i\,f(x_i).$$

- Trapezoid: $x_i$ equispaced, $w_i$ equal (ends halved). With $n$
  intervals the error falls only as $1/n^2$.
- Gauss-Legendre: the $n$ nodes are the roots of the Legendre
  polynomial $P_n(x)$ and the weights are chosen so the rule is exact
  for every polynomial up to degree $2n-1$, double what $n$ free
  points would naively give.

### Why Gauss wins (and when it does not)

By placing nodes at the Legendre roots, $n$ Gauss points integrate a
degree-$(2n-1)$ polynomial with zero error. For a smooth function
(well approximated by polynomials) the error then drops
*exponentially* in $n$, not polynomially: a dozen Gauss points can beat
thousands of trapezoid points. The playground tests
$\cos 2x$ and $e^{-4x^2}$ (smooth, Gauss crushes it), the Runge
function (Gauss still wins), and $\sqrt{|x|}$ (a kink at 0: neither
converges fast, the honest caveat that spectral accuracy needs
smoothness). Nodes and weights are computed by the Golub-Welsch
eigenproblem.

### Things to try

- Pick $\cos 2x$ and watch Gauss reach machine precision in ~6 nodes
  while trapezoid is still crawling.
- Pick $\sqrt{|x|}$ and see both stall: the kink destroys the
  Gauss advantage.
- Add nodes and watch the Gauss error fall in a straight line on a
  log axis (exponential convergence).

### Where this comes from

Gauss-Legendre quadrature, the degree-$(2n-1)$ exactness, and the
smoothness requirement follow Trefethen, *Approximation Theory and
Approximation Practice*, Chapter 18, and Press et al., *Numerical
Recipes*, 3rd ed., Chapter 4.

## Physical setup

Numerical evaluation of integral_{-1}^1 f(x) dx by:
- Trapezoidal rule: n + 1 equispaced points.
- Gauss-Legendre: n optimized nodes from roots of P_n.

Test functions: cos(2x), exp(-4 x^2), Runge function, sqrt(|x|).

## Numerical method

GL nodes and weights precomputed for n in [1, 16] by Golub-Welsch QL
eigenproblem on the Jacobi matrix.

## Controls

- n nodes: 2 to 16.
- function: cos / gaussian / runge / sqrt-abs.
- speed: auto-sweep n.
- Reset / Pause / Play.

## Expected qualitative features

1. Smooth f (cos, gaussian): GL exponential convergence; trapezoid h^2.
2. Runge f: both converge but GL much faster.
3. sqrt-abs f (non-smooth): both stuck at slow algebraic convergence.

## Invariants and acceptance thresholds

1. GL nodes symmetric about 0.
2. GL weights sum to 2.
3. GL exact for polynomials of degree 2n - 1.
4. GL n = 8 error << trapezoid n = 8 error on cos (factor 1000).
5. GL n = 16 matches sin(2) within 1e-12 on cos.
6. Trapezoid error halves by factor 4 when n doubles (h^2 convergence).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Polynomial of degree <= 2n - 1: GL exact.
- Periodic smooth on [-1, 1]: trapezoid is also exponential.
- Discontinuous f: both stuck at slow rates.

## Visual fallback

Canvas2D only. Top: f(x) with trapezoid nodes (orange dots) and GL nodes
(cyan dots). Bottom: log10|error| vs n curves.

## Citations

- Trefethen, Approximation Theory and Approximation Practice Ch. 18
 .
- Press et al., Numerical Recipes 3e Ch. 4.

## Stretch goals

- Clenshaw-Curtis quadrature.
- Adaptive Gauss-Kronrod.
- Tanh-sinh / double exponential.

## Risk register

- Golub-Welsch QL is somewhat opaque; node positions match published
  tables to 14+ digits (verified manually for n = 4).
