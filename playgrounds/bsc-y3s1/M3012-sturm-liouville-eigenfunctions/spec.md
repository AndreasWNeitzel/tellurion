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
hook: 'A clamped string whose mass density you reshape; its normal modes are a numerically solved Sturm-Liouville spectrum.'
one_paragraph: 'The regular Sturm-Liouville problem -(T y'')'' = lambda rho(x) y on [0, pi] with clamped ends, solved numerically (finite differences plus a Jacobi eigensolver) for a density rho(x) the user picks: uniform, heavy centre, a density step, near-end loading, or a linear taper. Uniform rho recovers the closed form (phi_n = sqrt(2/pi) sin n x, lambda_n = n^2); loading the string bends the mode shapes toward the heavy region and shifts the spectrum off n^2, yet the modes stay orthonormal under the rho-weighted inner product. Three linked views: the vibrating string with line weight tracking the local density (and the density ribbon drawn beneath), the eigenvalue ladder lambda_k against the open-tick n^2 reference, and a small-multiples gallery of every one of the N requested modes (mode k has exactly k-1 interior nodes, the Sturm oscillation theorem, read out live). Click the string to re-pluck with a triangular tent.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [N, density]
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
  - "Arfken, Weber, Harris, Mathematical Methods for Physicists: A Comprehensive Guide, Seventh ed., Ch. 8."
---

# Sturm-Liouville eigenfunctions on [0, pi]

## Explainer

### What you are looking at

Pluck a string fixed at both ends and it rings in a sum of pure modes,
each with its own frequency. Here the string's mass density $\rho(x)$
is yours to choose. With a uniform density the modes are exactly the
textbook sines and the spectrum is $\lambda_n=n^2$; load the string in
the middle, put a step in the density, or taper it, and the modes bend
toward the heavy region while the spectrum slides off $n^2$. The deep
point: those deformed modes are still the eigenfunctions of a
Sturm-Liouville operator and still form a complete basis, but now
orthonormal under the density-weighted inner product. That weighted
orthogonality is what makes eigenfunction expansions work for every
non-uniform medium in physics, not just the constant-coefficient toy.

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

- Start uniform: the modes are clean sines and the ladder sits exactly
  on the $n^2$ ticks.
- Switch to heavy centre or a two-step density: watch the mode shapes
  bunch toward the heavy region and the ladder fall below $n^2$ (a
  loaded string rings slower).
- Push $N$ to 20: the gallery shows every mode, and mode $k$ always
  has exactly $k-1$ interior nodes (the readout confirms it live), the
  Sturm oscillation theorem holding even across the discontinuous
  two-step coefficient.
- Click to pluck a sharp corner and see how many modes the
  non-sinusoidal basis needs to resolve it.

### Where this comes from

The regular Sturm-Liouville problem, its discrete orthonormal
eigenfunctions, and the eigenfunction-expansion solution follow Arfken
and Weber, *Mathematical Methods for Physicists*, 7th ed., Chapter 8.

## Physical setup

The simplest regular Sturm-Liouville problem: $-y'' = \lambda y$ on $[0, \pi]$ with $y(0) = y(\pi) = 0$. The eigenvalues are $\lambda_n = n^2$ and the eigenfunctions are $\phi_n(x) = \sqrt{2/\pi} \sin(n x)$, orthonormal under $\langle f, g \rangle = \int_0^\pi f g\,dx$.

## Numerical method

The constant-coefficient closed form ($\phi_n=\sqrt{2/\pi}\sin n x$, Simpson 1/3 inner products) is retained as the uniform reference. The general variable-density problem $-(T y')' = \lambda\,\rho(x)\,y$ is discretized on $n=96$ interior nodes ($h=\pi/(n+1)$): $(T/h^2)K\mathbf{y}=\lambda M\mathbf{y}$ with $K=\mathrm{tridiag}(-1,2,-1)$ and $M=\mathrm{diag}(\rho_i)$. Symmetrizing with $z=M^{1/2}y$ gives a symmetric tridiagonal $S$ solved by cyclic Jacobi; eigenvectors are back-transformed and normalized so $\sum_i \rho_i\psi_i^2 h = 1$. The discrete operator is an oscillation matrix, so the Sturm node-count theorem holds exactly. The string evolves as $y(x,t)=\sum_{k\le N} c_k\,\psi_k(x)\cos(\sqrt{\lambda_k}\,t)$ with $c_k$ the density-weighted projection of the initial shape (smooth load, or a triangular pluck set by clicking).

## Controls

- Number of modes $N$ (1 to 20): sets reconstruction terms and the size of the mode gallery (every $N$ is shown, no hard cap).
- Density profile $\rho(x)$: uniform, heavy centre, heavy near one end, two-step (4x denser half), linear taper.
- Click the string to re-pluck (triangular initial condition at the cursor).
- Copy URL button restores $N$ and the density selection.

## Expected qualitative features

1. A clamped string vibrating as the time-evolved modal sum, line weight and warmth tracking the local density, with the density ribbon drawn beneath and the static envelope behind.
2. The eigenvalue ladder $\lambda_k$ with faint open ticks at the uniform-string reference $n^2$, so a non-uniform density visibly shifts the spectrum.
3. A small-multiples gallery of all $N$ modes (not capped at six); mode $k$ has exactly $k-1$ interior nodes.
4. Uniform density recovers the textbook sines and $\lambda_k\to k^2$; loading the string lowers the fundamental and concentrates modes away from the dense region.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| closed-form eigenvalues $\lambda_n = n^2$, Dirichlet, orthonormality | exact / $10^{-6}$ | invariants test |
| density profiles strictly positive | strict | invariants test |
| uniform solver reduces to closed form: $\lambda_k\to k^2$ | rel err < 2 percent ($k\le8$) | invariants test |
| Sturm oscillation: mode $k$ has exactly $k-1$ interior nodes | exact, all profiles incl. discontinuous | invariants test |
| eigenvalues positive and strictly ordered, every profile | strict | invariants test |
| weighted orthonormality $\sum\rho_i\psi_m\psi_k h=\delta_{mk}$ | within $10^{-6}$ | invariants test |
| modes vanish exactly at both clamped ends | exact | invariants test |
| loading lowers the fundamental ($\lambda_1$ down) | strict | invariants test |
| weighted projection recovers a smooth profile | rel err < 1 percent | invariants test |
| solver is deterministic (identical eigenpairs) | exact | invariants test |

All confirmed in `invariants.test.mjs` (16 tests passing).

## Limiting cases for verification

- Uniform $\rho$: $\psi_k\to\sqrt{2/\pi}\sin k x$, $\lambda_k\to k^2$ (closed form recovered, tested).
- $N = 1$: only the fundamental contributes (no interior nodes).
- Heavier $\rho$ lowers every frequency (a loaded string sags more slowly); tested on $\lambda_1$.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Arfken-Weber, *Mathematical Methods for Physicists*, 7e, Ch. 8.

## Stretch goals

- Done: weighted inner product and non-trivial (variable-density) Sturm-Liouville with a density selector.
- Add a Robin / free-end boundary condition to show the spectrum react to the boundary operator.
- Overlay the WKB estimate $\lambda_k \approx (k\pi / \int \sqrt{\rho/T}\,dx)^2$ on the ladder.

## Risk register

- Cyclic Jacobi on the $96\times96$ symmetric matrix converges to off-diagonal norm $<10^{-12}$ in well under the 80-sweep cap; the eigenpairs are bit-reproducible (tested), so golden frames are stable.
- Simpson with $N = 2000$ gives $\sim 10^{-6}$ accuracy for the retained closed-form orthogonality tests.
