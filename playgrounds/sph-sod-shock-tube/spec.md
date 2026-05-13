---
title: SPH 1D Sod Shock Tube
slug: sph-sod-shock-tube
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3014
supporting_ucs: [FIS2018]
curriculum_year: bsc-y3s1
---

# SPH 1D Sod shock tube

## Physical setup

The Sod shock tube is the canonical compressible-fluid benchmark. A membrane
at x = 0.5 separates two states of an ideal gas with gamma = 1.4:

- Left state:  rho = 1.0, P = 1.0, v = 0
- Right state: rho = 0.125, P = 0.1, v = 0

At t = 0 the membrane is removed. The exact Riemann solution has, from left to
right: a rarefaction fan, a contact discontinuity, and a shock.

## Governing equations

Euler equations in conservation form (1D):

  d rho / dt + d(rho v) / dx = 0
  d(rho v) / dt + d(rho v^2 + P) / dx = 0
  d(rho E) / dt + d((rho E + P) v) / dx = 0

with equation of state P = (gamma - 1) rho u and E = u + v^2 / 2.

## Numerical method: Smoothed Particle Hydrodynamics

- Fluid as 360 Lagrangian particles (320 left, 40 right) so the mass per
  particle is equal across the interface.
- Cubic spline kernel W(r, h) with h = 0.04 and compact support 2h.
- Density via summation: rho_i = sum_j m_j W(r_ij, h).
- Symmetric pressure gradient: rho^-1 grad P = sum_j m_j (P_i / rho_i^2 + P_j / rho_j^2) grad W.
- Monaghan-Gingold artificial viscosity (alpha = 1, beta = 2) activates only on
  approach (v . r < 0); captures the shock without overly smearing the contact.
- Explicit Euler with dt = 0.0015.

## Controls

- speed: SPH steps per render frame, 1 to 5, default 2.
- field: highlight rho / v / P trace.
- Reset / Pause / Play.

## Expected qualitative features

1. t < 0.1: disturbance propagates outward from the interface.
2. t around 0.15: rarefaction fan spans the left half; contact discontinuity
   visible at the original interface; shock front advances right.
3. t around 0.2: post-shock plateau in density (rho near 0.27), velocity
   v near 0.93, pressure P near 0.3.
4. Velocity profile: rises from 0 in the rarefaction, plateaus across the
   contact, jumps back down at the shock.

## Invariants and acceptance thresholds

1. Lagrangian total mass exact to 1e-12.
2. Energy drift |delta E / E_0| < 0.05 over 200 steps.
3. Kernel density at t = 0: both bulk densities within 10 percent of analytic.
4. Rarefaction and shock develop within 250 steps.
5. Peak density bounded by strong-shock limit (gamma + 1) / (gamma - 1) = 6.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Equal-state initial condition (rho_L = rho_R, P_L = P_R): no waves develop.
- Strong-shock limit: density ratio rho_2 / rho_1 approaches 6 from below.

## Visual fallback

Canvas2D only. The particle ribbon shows Lagrangian particle locations
colored by initial half; three stacked panels plot rho(x), v(x), P(x).

## Citations

- Sod 1978, J. Comp. Phys. 27, 1, "A survey of several finite difference
  methods for systems of nonlinear hyperbolic conservation laws" (`sod1978`).
- Monaghan 1992, ARAA 30, 543, "Smoothed particle hydrodynamics" (`monaghan1992`).
- Price 2012, J. Comp. Phys. 231, 759, "Smoothed particle hydrodynamics and
  magnetohydrodynamics" (`price2012sph`).
- LeVeque 2002, Finite Volume Methods for Hyperbolic Problems, Ch. 14
  (`leveque2002`).

## Stretch goals

- Adaptive smoothing length.
- Exact Riemann-solver reference overlay (dashed line over each panel).
- Higher-order kernel (Wendland C2).

## Risk register

- 360 particles is modest; the contact discontinuity smears more than a
  high-resolution finite-volume scheme would show.
- Reflective boundaries: long runs see wave reflections off the walls; the
  demo only runs until t around 0.2 before reflections matter.
