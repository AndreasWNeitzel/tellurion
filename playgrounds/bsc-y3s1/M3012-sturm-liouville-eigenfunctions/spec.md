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
hook: 'The Sturm-Liouville modes of the string operator are the normal modes of a clamped string; watch it vibrate.'
one_paragraph: 'A vibrating-string instantiation of the regular Sturm-Liouville problem on [0, pi]. The string evolves as y(x,t) = sum c_n phi_n(x) cos(omega_n t) with omega_n = sqrt(lambda_n) = n, so the eigenvalue spectrum lambda_n = n^2 becomes visible motion: the lower lanes show each normal mode oscillating at its own rate (mode n is n times faster). Click the string to re-pluck it (triangular initial condition) and watch the modal mix change; the N slider sets how many eigenfunctions reconstruct it, with the max reconstruction error read out live.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Sturm-Liouville eigenfunctions on [0, pi]

## Explainer

### What you are looking at

Pluck a string fixed at both ends and it rings in a sum of pure modes,
each a sine, each with its own frequency. The playground projects any
starting shape onto those modes and evolves it. The point is general:
those modes are the eigenfunctions of a Sturm-Liouville operator, and
they form a complete orthonormal basis, the engine behind every Fourier
expansion in physics.

### The eigenproblem

The simplest regular Sturm-Liouville problem is

$$-y'' = \lambda\,y \quad\text{on }[0,\pi],
  \qquad y(0) = y(\pi) = 0.$$

The boundary conditions only admit discrete solutions:

$$\lambda_n = n^2, \qquad
  \phi_n(x) = \sqrt{\tfrac2\pi}\,\sin(n x),
  \qquad n = 1, 2, 3,\dots$$

The $\lambda_n$ are the eigenvalues (squared mode frequencies), the
$\phi_n$ the eigenfunctions (the standing-wave shapes).

### Orthonormality and projection

The eigenfunctions are orthonormal under the inner product
$\langle f, g\rangle = \int_0^\pi f g\,dx$, so any starting shape
$f(x)$ is decomposed by simple projection:

$$c_n = \langle \phi_n, f\rangle,
  \qquad f(x) = \sum_n c_n\,\phi_n(x).$$

Each mode then just oscillates at its own frequency
$\omega_n = \sqrt{\lambda_n} = n$, so the full motion is

$$y(x, t) = \sum_n c_n\,\phi_n(x)\,\cos(\omega_n t).$$

This is exactly why separation of variables works for the wave and heat
equations: the spatial operator's eigenfunctions diagonalize the
problem, and the messy PDE becomes a list of independent oscillators.
The playground lets you pluck a shape, see its mode coefficients, and
watch the reconstruction evolve.

### Things to try

- Pluck a triangular shape and watch its sine-mode coefficients
  $c_n$ fall off (sharp corner, slow decay).
- Keep only the first few modes and see the reconstruction smooth out
  the corner (Fourier truncation).
- Note higher modes oscillate faster ($\omega_n = n$): the string's
  overtones.

### Where this comes from

The regular Sturm-Liouville problem, its discrete orthonormal
eigenfunctions, and the eigenfunction-expansion solution follow Arfken
and Weber, *Mathematical Methods for Physicists*, 7th ed., Chapter 8.

## Physical setup

The simplest regular Sturm-Liouville problem: $-y'' = \lambda y$ on $[0, \pi]$ with $y(0) = y(\pi) = 0$. The eigenvalues are $\lambda_n = n^2$ and the eigenfunctions are $\phi_n(x) = \sqrt{2/\pi} \sin(n x)$, orthonormal under $\langle f, g \rangle = \int_0^\pi f g\,dx$.

## Numerical method

Closed-form $\phi_n$. Inner products by Simpson 1/3 with $N = 2000$ subintervals. The initial profile (default $f(x) = x(\pi - x)$, or a triangular pluck set by clicking) has coefficients $c_n = \langle \phi_n, f \rangle$. The string is evolved as $y(x,t) = \sum c_n \phi_n(x) \cos(\omega_n t)$ with $\omega_n = \sqrt{\lambda_n}$, the standard temporal factor of the separated wave equation; sim.js (eigenfunctions, inner product, projection, reconstruction) is unchanged.

## Controls

- Number of modes $N$ (1 to 20).
- Click the string to re-pluck (triangular initial condition at the cursor).

## Expected qualitative features

1. A clamped string vibrating as the time-evolved modal sum in the top panel, with the static reconstruction envelope behind it.
2. The first up-to-six normal modes in stacked lanes, each oscillating at its own $\omega_n = n$ (higher modes visibly faster).
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
