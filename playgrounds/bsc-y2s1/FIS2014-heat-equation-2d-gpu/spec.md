---
title: Interactive 2D Heat Equation
slug: heat-equation-2d-gpu
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Paint a copper bar through a foam wall and watch heat refuse to cross it: the same flux, a gentle slope in the metal and a cliff in the insulator.'
one_paragraph: 'An explicit finite-difference solver for the variable-conductivity heat equation dT/dt = div(kappa grad T) + S on a 96x96 grid. The primary scene is the physical temperature field (viridis) overlaid with live conductive-flux streamlines q = -kappa grad T; the side panel is the mid-row cross-section T(x). Five presets (composite wall, uniform rod, room radiator, finned heat sink, insulated quench), a paint brush for metal, insulator, heat and cold, and sliders for the conductivity contrast, the source temperature and the time-lapse rate. The headless sim.js is gate-tested for heat conservation in an insulated box, the diffusivity rate at equal physical time, the steady Laplace balance, the composite-wall gradient ratio and the CFL stability bound.'
tags: [thermodynamics, pde, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2001
share_state_keys: []
---

# Interactive 2D Heat Equation

## Physical setup

A square slab of material with spatially varying thermal diffusivity
`kappa(x, y)`, conducting heat between painted hot and cold regions or
internal sources. The temperature field `T(x, y, t)` is the primary
physical scene; conductive-flux streamlines `q = -kappa grad T` show
where and how fast heat flows.

## Governing equations

The variable-coefficient heat equation

`dT/dt = div( kappa grad T ) + S`,

discretised by explicit forward Euler with the conductive flux across
each cell face taken at the arithmetic mean of the two cell
diffusivities. Steady state is the Poisson/Laplace balance
`div(kappa grad T) + S = 0`. For uniform `kappa` and two fixed faces
the steady profile is linear. Across a composite wall the flux is
continuous, so the temperature gradient is steeper in the lower-`kappa`
material by the ratio of the conductivities.

## Numerical method

Explicit FD on a 96x96 grid, `dx = 1`. The CFL stability bound
`dt <= dx^2 / (4 kappa_max)` is computed from the live maximum
diffusivity (safety factor 0.9) and shown in the readout; it is
re-evaluated whenever conductivity is painted or a preset loads.
Insulated (zero-flux) outer edges unless a cell is held fixed
(Dirichlet). Reference: Press et al., *Numerical Recipes* (3rd ed.),
Sec. 20.2 (`press2007`); Incropera, *Fundamentals of Heat and Mass
Transfer*, Ch. 5.

## Controls

- preset: composite wall, uniform rod, room radiator, finned heat
  sink, insulated quench.
- kappa contrast: the conductor/insulator diffusivity ratio.
- source T: the absolute driving temperature of fixed faces and
  sources (fixed colour scale, so it rescales the whole field).
- sim rate: finite-difference steps advanced per displayed frame.
- paint brush: metal, insulator, heat source, cold sink, erase, with
  click and drag on the field.
- Reset, Pause.

## Expected qualitative features

- Composite wall: a near-flat plateau in the high-`kappa` half and a
  steep drop in the insulator, with a clear kink at the interface in
  both the field and the T(x) panel.
- Uniform rod: the field relaxes to a linear left-to-right ramp.
- Radiator: a warm plume grows from the source against cooled walls.
- Heat sink: heat is channelled preferentially along the fins.
- Quench: an insulated hot blob spreads and flattens at constant total
  heat.
- Flux streamlines always point from hot to cold.

## Invariants and acceptance thresholds

- Insulated box, no source: total heat conserved within 0.1%.
- Higher diffusivity reaches a lower variance at equal physical time.
- Uniform `kappa` steady state is the linear profile within 1%, with
  the discrete `div(kappa grad T)` residual below 5e-3.
- Composite wall: the temperature drop is larger in the low-`kappa`
  half than in the high-`kappa` half.
- At the CFL `dt` the scheme stays bounded; at 2.5x the bound it
  diverges.
- Heat flows down-gradient: a hotspot warms its neighbours.

## Limiting cases for verification

- Uniform `kappa`, two fixed faces: steady state is exactly linear
  (the 1D Laplace solution), checked in `__physicsCheck`.
- Insulated, source-free: `sum T` is invariant (discrete energy
  conservation).

Source: Press et al., *Numerical Recipes* (3rd ed.), Sec. 20.2
(`press2007`); Incropera, *Fundamentals of Heat and Mass Transfer*,
Ch. 5.
