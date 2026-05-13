---
title: Runge Phenomenon and Chebyshev Cure
slug: runge-vs-chebyshev
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2018
supporting_ucs: [M3012, MAA-NM]
curriculum_year: bsc-y2s2
---

# Runge phenomenon and the Chebyshev cure

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
