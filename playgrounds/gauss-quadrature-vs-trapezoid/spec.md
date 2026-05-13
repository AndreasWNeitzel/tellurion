---
title: Gauss-Legendre vs Trapezoid Quadrature
slug: gauss-quadrature-vs-trapezoid
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2018
supporting_ucs: [M3012, MAA-NM]
curriculum_year: bsc-y2s2
---

# Gauss-Legendre vs trapezoid quadrature

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
  (`trefethen-spectral`).
- Press et al., Numerical Recipes 3e Ch. 4.

## Stretch goals

- Clenshaw-Curtis quadrature.
- Adaptive Gauss-Kronrod.
- Tanh-sinh / double exponential.

## Risk register

- Golub-Welsch QL is somewhat opaque; node positions match published
  tables to 14+ digits (verified manually for n = 4).
