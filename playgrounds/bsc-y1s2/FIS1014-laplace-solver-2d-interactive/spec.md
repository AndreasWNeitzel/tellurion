---
title: Interactive Laplace Solver: Draw Your Own Conductors
slug: laplace-solver-2d-interactive
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Paint a conductor with the mouse and watch the electrostatic field find its own shape in about a second.'
one_paragraph: 'A live successive-over-relaxation solver for Laplace''s equation. The primary canvas is the potential field itself, a diverging RdBu image with electric-field streamlines; drag to paint conductors, choose presets (parallel plates, coaxial cable, dipole, charged sphere), set the voltage, and switch between potential, |E| and equipotential views. The headless sim.js runs the same scheme and is gate-tested against the analytic capacitor and coaxial limits.'
tags: [electromagnetism, interactive-drag, field-visualization, animation]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
share_state_keys: []
---

# Interactive Laplace Solver

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
Sec. 2.5 and 3.1 (`griffithsem2017`); Press et al., *Numerical
Recipes*, Sec. 20.5.
