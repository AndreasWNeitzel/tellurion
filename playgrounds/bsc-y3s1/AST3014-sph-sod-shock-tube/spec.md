---
title: SPH 1D Sod Shock Tube
slug: sph-sod-shock-tube
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3014
supporting_ucs: [FIS2018]
curriculum_year: bsc-y3s1
hook: 'Pop a membrane between high- and low-pressure gas and three things race apart at once: a shock, a contact surface, and a rarefaction fan.'
one_paragraph: 'The Sod shock tube is the standard test of any compressible-flow code. A membrane separates a dense, high-pressure gas (rho=1, P=1) from a thin, low-pressure one (rho=0.125, P=0.1); removing it launches a rightward shock, a contact discontinuity trailing it, and a leftward rarefaction fan, all with a known exact Riemann solution. The playground evolves it with smoothed-particle hydrodynamics (SPH) and overlays the analytic answer, so you see where the particle method captures the shock and where it smears the contact. It is the canonical pass/fail benchmark for hydrodynamics solvers. Reference: Sod 1978; Monaghan, Smoothed Particle Hydrodynamics (ARAA 1992).'
tags: [fluids-mhd, stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# SPH 1D Sod shock tube

## Explainer

### What you are looking at

A tube with a membrane: dense high-pressure gas on the left, thin
low-pressure gas on the right. Pop the membrane and three distinct
features race apart at once. The exact answer is known, so the Sod
shock tube is the pass/fail exam every fluid code must take. Here it is
solved with smoothed-particle hydrodynamics (SPH) and overlaid on the
analytic truth.

### The equations

The gas obeys the 1D Euler equations (mass, momentum, energy
conservation):

$$\partial_t\rho + \partial_x(\rho v) = 0,$$

$$\partial_t(\rho v) + \partial_x(\rho v^2 + P) = 0,$$

$$\partial_t(\rho E) + \partial_x\big[(\rho E + P)v\big] = 0,$$

closed by the ideal-gas law $P = (\gamma-1)\rho u$ with
$\gamma = 1.4$, starting from $(\rho,P) = (1, 1)$ on the left and
$(0.125, 0.1)$ on the right.

### The three waves

Removing the membrane launches a Riemann problem whose exact solution
has, left to right:

- a rarefaction fan (the dense gas smoothly expands and accelerates),
- a contact discontinuity (a jump in density but not pressure, the
  original interface, carried along), and
- a shock (an abrupt jump in density, pressure, and velocity plowing
  into the thin gas).

A good solver must place all three correctly. SPH represents the fluid
as moving particles; it captures the shock and rarefaction well but
tends to smear the contact discontinuity, which is exactly the kind of
behavior this benchmark is designed to expose. The playground evolves
the particles and draws the analytic solution underneath so the match
(and the smearing) is visible.

### Things to try

- Watch the shock move fastest to the right, the contact behind it,
  the rarefaction fanning left.
- Compare the SPH density to the analytic curve at the contact: the
  smoothing length sets how sharp it can be.
- Note pressure is continuous across the contact but density is not,
  the defining signature of a contact discontinuity.

### Where this comes from

The Euler equations, the Sod initial data, and the exact
rarefaction-contact-shock Riemann solution follow Sod (1978) and Toro,
*Riemann Solvers and Numerical Methods for Fluid Dynamics*, with the
SPH method from Monaghan, *Smoothed Particle Hydrodynamics* (ARAA
1992).

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
