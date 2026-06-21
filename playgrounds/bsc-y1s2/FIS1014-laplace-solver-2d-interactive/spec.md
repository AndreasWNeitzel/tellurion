---
title: Interactive Laplace Solver: Draw Your Own Conductors
slug: laplace-solver-2d-interactive
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Paint a conductor with the mouse and watch the electrostatic field find its own shape in about a second.'
one_paragraph: 'In a charge-free region the electrostatic potential obeys Laplace''s equation, del^2 V = 0, which has the smoothing property that V at any point is the average of its neighbours and can have no interior maximum or minimum. The primary canvas is the potential field itself, a diverging colour map with equipotential contours that relaxes live by red-black successive over-relaxation; you drag to paint conductors (paint +1, -1, ground, or erase), pick presets (parallel plates, coaxial cable, two electrodes, charged disc), and watch the field re-solve in real time. The relaxation replays on a loop so the potential is always seen settling into the unique configuration fixed by the conductor boundaries. The diagnostic plots the residual, the largest change per sweep, on a log scale, plunging toward zero as it converges. Reference: Griffiths, Introduction to Electrodynamics, Chapter 3.'
tags: [electromagnetism, interactive-drag, field-visualization, animation]
difficulty: 3
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
primary_citation: griffiths-em
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
  - "Griffiths, Introduction to Electrodynamics, 4th ed., Ch. 3; Press et al., Numerical Recipes, Sec. 20.5."
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

Red-black SOR (omega = 1.92) on a 112x112 grid, 3 sweeps per animation
frame, so the field converges visibly in about a second; once converged
the interior is wiped and the relaxation replays on a loop. Dirichlet
cells are re-imposed every sweep. The potential is drawn from an
ImageData buffer (diverging colour map); equipotential contours are
drawn by sub-sampled marching squares.

## Controls

- setup selector (parallel plates, coaxial, two electrodes, charged disc).
- brush selector: paint +1 / -1 / ground / erase; drag on the canvas to
  paint conductors and watch the field re-solve.
- Reset, Pause.

## Expected qualitative features

- The field relaxes from flat to the smooth solution on load and on every
  replay; painting re-solves around the new conductors live.
- Parallel plates give a near-uniform interior field with fringing.
- Coaxial gives the radial logarithmic potential; two electrodes the
  classic dipole-like pattern; the disc an equipotential interior.
- Equipotential contours always meet conductors so the field leaves them
  normally.

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
