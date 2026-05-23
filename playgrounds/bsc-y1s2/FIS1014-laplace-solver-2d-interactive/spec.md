---
title: Interactive Laplace Solver: Draw Your Own Conductors
slug: laplace-solver-2d-interactive
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Paint a conductor with the mouse and watch the electrostatic field find its own shape in about a second.'
one_paragraph: 'In a charge-free region the electrostatic potential obeys Laplace''s equation, del^2 V = 0, which has the smoothing property that V at any point is the average of its neighbours and can have no interior maximum or minimum. The primary canvas is the potential field itself with electric-field streamlines; you drag to paint conductors, pick presets (parallel plates, coaxial cable, dipole, charged sphere), set the voltage, and switch between the potential, the field magnitude |E|, and equipotential views. Watching the solution relax shows the potential settling into the unique configuration fixed by the conductor boundaries, with E always perpendicular to them. Reference: Griffiths, Introduction to Electrodynamics, Chapter 3.'
tags: [electromagnetism, interactive-drag, field-visualization, animation]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
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

# Interactive Laplace Solver

## Explainer

### What you are looking at

Paint some conductors at fixed voltages inside a grounded box and the
playground fills in the electric potential everywhere else, with field
lines that meet the conductors at right angles. There are no charges in
the empty space; the potential there is fixed entirely by the
boundaries. You are watching a boundary-value problem relax to its
solution.

### The equation

In a charge-free region the electrostatic potential obeys Laplace's
equation:

$$\nabla^2\varphi = 0.$$

It has a strong physical meaning: the value at any point is the average
of its surroundings. There are no local peaks or valleys in empty space
(the maximum principle); extremes can only sit on the conductors. The
boundary condition is Dirichlet: $\varphi$ is pinned to the painted
voltage on every conductor, and the field is $\mathbf E = -\nabla\varphi$,
which is why field lines hit conductors perpendicularly.

### How it is solved

Discretize the box into a grid. The averaging property becomes: each
cell should equal the mean of its four neighbors. Iterating that
directly (Jacobi or Gauss-Seidel) converges slowly, so the playground
uses successive over-relaxation, which overshoots each correction by a
factor $\omega$:

$$\varphi_{ij} \leftarrow (1-\omega)\,\varphi_{ij}
  + \frac{\omega}{4}\big(\varphi_{i+1,j} + \varphi_{i-1,j}
  + \varphi_{i,j+1} + \varphi_{i,j-1}\big),$$

with $\omega \approx 1.9$ and a red-black update order so the sweep
parallelizes cleanly. A handful of sweeps per frame and the field
visibly settles in about a second. The Dirichlet cells are re-imposed
every sweep so the boundaries never drift.

### Things to try

- Paint two opposite plates and watch the field become uniform
  between them (a parallel-plate capacitor emerging from the solver).
- Make a sharp conductor corner and see the field crowd there, the
  reason lightning rods are pointed.
- Note streamlines always strike conductors at right angles: a
  conductor surface is an equipotential.

### Where this comes from

Laplace's equation, the boundary-value setup, the mean-value and
maximum principles, and the relaxation/SOR solution follow Griffiths,
*Introduction to Electrodynamics*, 5th ed., Chapters 2 and 3.

## Physical setup

A grounded box encloses user-painted conductors. The electrostatic
potential satisfies Laplace's equation in the charge-free region with
Dirichlet data on every conductor; the electric field is
`E = -grad phi` and is everywhere normal to the conductor surfaces.

## Governing equations

$$\nabla^2\varphi=0,\qquad
\varphi_{ij}\leftarrow(1-\omega)\varphi_{ij}
+\tfrac{\omega}{4}\big(\varphi_{i+1,j}+\varphi_{i-1,j}
+\varphi_{i,j+1}+\varphi_{i,j-1}\big),$$

red-black successive over-relaxation with `omega ~ 1.9`.

## Numerical method

Red-black SOR on a 150x150 grid, ~14 sweeps per animation frame, so
the field converges visibly in about a second. Dirichlet cells are
re-imposed every sweep. The field is drawn from an ImageData buffer;
streamlines integrate `-grad phi` by normalized steps.

## Controls

- preset selector (parallel plates, coaxial, dipole, charged sphere).
- voltage slider; view selector (phi, |E|, equipotentials).
- draw +V / -V / erase brushes; drag on the canvas to paint;
  Reset, Pause.

## Expected qualitative features

- The field relaxes from noise to the smooth solution on load.
- Parallel plates give a near-uniform interior field with fringing.
- Coaxial gives the radial logarithmic potential; dipole the classic
  two-lobe pattern; the sphere an equipotential interior.
- Streamlines always leave conductors normally.

## Invariants and acceptance thresholds

- SOR residual decays monotonically and converges below 1e-2.
- The converged interior is harmonic (max discrete Laplacian < 5e-3).
- Dirichlet cells keep their prescribed values exactly.
- Parallel-plate interior field `E = V/d` within 1%.
- Coaxial potential follows `A ln r + B` within 0.5%.
- Potential bounded by the conductor extremes.

## Limiting cases for verification

- Two plates: uniform field `V/d` between them.
- Coaxial: `phi(r) = A ln r + B`.

Source: Griffiths, *Introduction to Electrodynamics*, 4th ed.,
Sec. 2.5 and 3.1; Press et al., *Numerical
Recipes*, Sec. 20.5.
