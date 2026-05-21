---
title: Runge Phenomenon and Chebyshev Cure
slug: runge-vs-chebyshev
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2018
supporting_ucs: [M3012, MAA-NM]
curriculum_year: bsc-y2s2
hook: 'Interpolate a gentle bump with more and more equally spaced points and it gets worse, wild oscillations at the edges; Chebyshev nodes cure it.'
one_paragraph: 'High-degree polynomial interpolation on equispaced nodes can fail badly: for the Runge function 1/(1 + 25 x^2) the interpolant grows huge oscillations near the interval ends that worsen as you add points. Clustering the nodes toward the edges at the Chebyshev points tames the error and restores convergence. The playground overlays the equispaced and Chebyshev interpolants on the true function as you raise the degree, so the runaway edge oscillation and its Chebyshev fix are visible together. This is exactly why spectral methods use Chebyshev grids. Reference: Trefethen, Approximation Theory and Approximation Practice.'
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

# Runge phenomenon and the Chebyshev cure

## Explainer

### What you are looking at

The natural instinct, fit more points with a higher-degree polynomial
to get a better approximation, can spectacularly backfire. The
playground interpolates the same smooth function on evenly spaced
points and watches the fit explode near the edges, then fixes it by
moving the points, not raising the degree.

### The Runge phenomenon

Interpolate the deceptively gentle Runge function

$$f(x) = \frac{1}{1 + 25 x^2}, \qquad x\in[-1,1],$$

with a degree-$n$ polynomial through $n+1$ equally spaced nodes. As
$n$ grows the polynomial does not converge: it develops violent
oscillations near $\pm1$ whose amplitude diverges. The reason is the
interpolation error formula

$$f(x)-p_n(x)
  = \frac{f^{(n+1)}(\xi)}{(n+1)!}\prod_{i}(x-x_i),$$

where the node polynomial $\prod(x-x_i)$ for equispaced nodes grows
exponentially toward the interval ends (the Lebesgue constant blows
up like $2^n/n$). More points make it worse, not better.

### The Chebyshev cure

The fix is not a higher degree or a different polynomial; it is where
you sample. Put the nodes at the Chebyshev points

$$x_k = \cos\!\frac{(2k+1)\pi}{2(n+1)},$$

which cluster near the endpoints. This is exactly the node
distribution that minimizes the maximum of $|\prod(x-x_i)|$
(equioscillation), so the Lebesgue constant grows only like
$\log n$ and the interpolant converges uniformly for any smooth $f$.
The playground overlays the equispaced fit (wild edge oscillations)
and the Chebyshev fit (clean convergence) at the same degree, the
canonical lesson that node placement, not polynomial order, controls
interpolation, and the basis of spectral methods.

### Things to try

- Raise the degree with equispaced nodes and watch the edge
  oscillations grow without bound (Runge).
- Switch to Chebyshev nodes at the same degree and watch the fit
  hug the curve everywhere.
- Compare the node-spacing: equispaced uniform vs Chebyshev clustered
  at the ends.

### Where this comes from

The Runge phenomenon, the Lebesgue constant and Chebyshev
interpolation follow Trefethen, *Approximation Theory and
Approximation Practice*, and Press et al., *Numerical Recipes*,
Chapter 3.

## Physical setup

Polynomial interpolation of the Runge function
f(x) = 1 / (1 + 25 x^2) on [-1, 1] at n + 1 nodes:
- Equispaced: x_i = -1 + 2 i / n.
- Chebyshev (second kind, including endpoints): x_i = cos(i pi / n).

## Numerical method

Lagrange interpolation with explicit basis. Max error sampled on 1001
evaluation points.

## Controls

- n nodes: 4 to 30.
- speed: auto-sweep over n.
- Reset / Pause / Play.

## Expected qualitative features

1. Equispaced (orange): match at nodes; oscillate wildly between them
   near +/- 1; error grows with n.
2. Chebyshev (cyan): converge uniformly; error drops rapidly with n.
3. Bottom panel: log error vs n shows divergent (orange) vs convergent
   (cyan) curves.

## Invariants and acceptance thresholds

1. Equispaced error at n = 20 is at least 5 times the error at n = 8 on
   the Runge function.
2. Chebyshev error at n = 20 is smaller than at n = 8.
3. Equispaced node spacing 2/n exact.
4. Chebyshev nodes cluster at endpoints.
5. Lagrange interpolation matches at the nodes (1e-9).
6. Chebyshev error << equispaced error at n = 16 (factor 10).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Small n (~4): equispaced is fine, error is similar to Chebyshev.
- Smooth analytic f: Chebyshev converges geometrically.
- Discontinuous or non-smooth f: convergence rates degrade for both.

## Visual fallback

Canvas2D only. Top: f(x) (white), equispaced interpolant (orange) with
node dots, Chebyshev interpolant (cyan) with node dots. Bottom: log error
vs n for both schemes with cursor at current n.

## Citations

- Trefethen, Approximation Theory and Approximation Practice
  (`trefethen-spectral`).
- Press et al., Numerical Recipes 3e Ch. 5.

## Stretch goals

- Floater-Hormann rational interpolation.
- Approximation of |x| (both diverge slowly).
- Barycentric Chebyshev for stability.

## Risk register

- Lagrange explicit form is O(n^2) per evaluation; n up to 30 is fast
  enough but higher n would lag. Use barycentric form for production.
