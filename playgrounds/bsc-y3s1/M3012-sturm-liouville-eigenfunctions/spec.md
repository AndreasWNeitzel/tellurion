---
title: Sturm-Liouville Eigenfunctions
slug: sturm-liouville-eigenfunctions
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M3012
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: arfken-weber
primary_chapter: 8
---

# Sturm-Liouville eigenfunctions on [0, pi]

## Physical setup

The simplest regular Sturm-Liouville problem: $-y'' = \lambda y$ on $[0, \pi]$ with $y(0) = y(\pi) = 0$. The eigenvalues are $\lambda_n = n^2$ and the eigenfunctions are $\phi_n(x) = \sqrt{2/\pi} \sin(n x)$, orthonormal under $\langle f, g \rangle = \int_0^\pi f g\,dx$.

## Numerical method

Closed-form $\phi_n$. Inner products by Simpson 1/3 with $N = 2000$ subintervals. The target $f(x) = x(\pi - x)$ has Fourier-Sturm-Liouville coefficients $c_n = \langle \phi_n, f \rangle$.

## Controls

- Number of modes $N$ (1 to 20).

## Expected qualitative features

1. First five eigenfunctions overlaid in the top panel.
2. Target $f(x) = x(\pi - x)$ and its truncated reconstruction in the bottom panel.
3. As $N$ grows, the reconstruction visibly converges; the max-error readout drops.
4. Only odd modes contribute to $f$ because $f$ is even about $\pi/2$.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| eigenvalues $\lambda_n = n^2$ | exact | invariants test |
| $\phi_n(0) = \phi_n(\pi) = 0$ (Dirichlet) | within $10^{-12}$ | invariants test |
| $\langle \phi_n, \phi_n \rangle = 1$ | within $10^{-6}$ | invariants test |
| $\langle \phi_n, \phi_m \rangle = 0$ for $n \ne m$ | within $10^{-6}$ | invariants test |
| target projections nonzero for odd $n$ | strict | invariants test |
| reconstruction converges with $N = 20$: rel err < 1 percent | strict | invariants test |
| eigenvalues monotonically increase | strict | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $N = 1$: only the fundamental mode contributes; reconstruction is a half-sine.
- $N \to \infty$: pointwise convergence to $f$ (Sturm-Liouville completeness theorem).

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Arfken-Weber, *Mathematical Methods for Physicists*, 7e, Ch. 8 (`arfken-weber`).

## Stretch goals

- Allow user to pick the target function from a dropdown (Dirac delta limit, step, parabola).
- Add a weighted inner product to demonstrate non-trivial Sturm-Liouville (Legendre, Chebyshev).
- Hilbert-space completeness illustration with the L^2 error.

## Risk register

- Simpson with $N = 2000$ gives $\sim 10^{-6}$ accuracy on smooth integrands; sufficient for the orthogonality tests.
