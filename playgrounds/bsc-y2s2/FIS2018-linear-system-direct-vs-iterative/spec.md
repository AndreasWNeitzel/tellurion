---
title: "Linear System: Direct vs Iterative"
slug: linear-system-direct-vs-iterative
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2018
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: villate-vpython
primary_chapter: 6
hook: 'Solve the same linear system two ways: a direct solver gets the exact answer in one pass, iterative methods sneak up on it, fast or slow by method.'
one_paragraph: 'The 1D Poisson problem becomes a tridiagonal linear system. The playground solves it with a direct Thomas algorithm (exact, O(n), a single sweep) and with three iterative methods: Jacobi and Gauss-Seidel relax slowly toward the solution, while conjugate gradient converges dramatically faster on this symmetric positive-definite system. It plots the residual against iteration count, so direct appears as one jump to machine precision and the iterative convergence rates visibly separate. This is the everyday trade-off between a one-shot factorization and a scalable iterative solve. Reference: Villate, Numerical Methods (VPython), Ch. 6.'
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
# Direct vs iterative linear-system solvers
Poisson 1D problem; Thomas tridiagonal direct solver vs Jacobi, Gauss-Seidel, CG. Source: Villate Ch. 6 (`villate-vpython`).

## Explainer

### What you are looking at

Discretize almost any PDE and you get a big linear system
$A\mathbf x=\mathbf b$ to solve. There are two philosophies: solve it
exactly in one shot (direct), or sneak up on the answer by repeated
correction (iterative). The playground solves the same 1D Poisson
problem every way and shows the error history so the trade-offs are
explicit.

### The test problem

The 1D Poisson equation $-u''=f$ with fixed ends, discretized, gives a
tridiagonal system

$$\frac{-u_{i-1}+2u_i-u_{i+1}}{h^2} = f_i,$$

i.e. $A\mathbf u=\mathbf f$ with $A$ symmetric, sparse and
tridiagonal.

### Direct vs iterative

- Thomas algorithm (direct): Gaussian elimination specialized to
  tridiagonal $A$. It returns the exact solution (to roundoff) in
  $O(N)$ operations, one pass, no iteration. For this structure it is
  unbeatable; for dense or 3D problems direct factorization costs
  $O(N^3)$ and memory blows up, which is why iteration exists.
- Jacobi / Gauss-Seidel (stationary iterative): repeatedly relax
  $x_i$ toward consistency with its neighbours. The error decays
  geometrically with a rate set by the spectral radius of the
  iteration matrix; Gauss-Seidel (using updated values immediately)
  converges about twice as fast as Jacobi, but both slow to a crawl
  as $N$ grows because low-frequency error modes are damped weakly.
- Conjugate gradient (Krylov): for symmetric positive-definite $A$
  it minimizes the error in the energy norm over an expanding
  subspace and converges in at most $N$ steps (far fewer in
  practice, governed by the condition number $\sqrt\kappa$),
  dramatically faster than the stationary methods and the workhorse
  for large sparse systems.

The lesson: choose the solver by the matrix structure and size. Direct
for small/banded, iterative (ideally Krylov + a preconditioner) for
large sparse. The playground plots the residual versus iteration for
each method so you watch CG plunge while Jacobi crawls, and the
Thomas solver finish in one step.

### Things to try

- Watch Thomas return the exact answer immediately while the
  iterative residuals decay step by step.
- Compare Jacobi vs Gauss-Seidel vs CG residual curves: each is
  steeper than the last (CG by far).
- Increase $N$ and watch the stationary methods slow dramatically
  while CG and Thomas scale gracefully.

### Where this comes from

The Thomas algorithm, stationary iterations and conjugate gradient
follow Press et al., *Numerical Recipes*, Chapter 2, and Saad,
*Iterative Methods for Sparse Linear Systems*.
