---
title: Interactive 2D Heat Equation
slug: heat-equation-2d-gpu
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Paint a copper bar through a foam wall and watch heat refuse to cross it: the same flux, a gentle slope in the metal and a cliff in the insulator.'
one_paragraph: 'An explicit finite-difference solver for the variable-conductivity heat equation dT/dt = div(kappa grad T) + S on a 96x96 grid. The primary scene is the physical temperature field (viridis) overlaid with live conductive-flux streamlines q = -kappa grad T; the side panel is the mid-row cross-section T(x). Five presets (composite wall, uniform rod, room radiator, finned heat sink, insulated quench), a paint brush for metal, insulator, heat and cold, and sliders for the conductivity contrast, the source temperature and the time-lapse rate. A composite wall keeps the heat flux continuous while the temperature gradient steepens in the poorer conductor, an insulated box conserves total heat, and uniform conductivity relaxes to the linear Laplace profile. Reference: Incropera, Fundamentals of Heat and Mass Transfer, Chapters 2 and 5.'
tags: [thermodynamics, pde, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2001
primary_citation: griffithsem2017
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
  - "Griffiths, Introduction to Electrodynamics, Fourth ed."
---

# Interactive 2D Heat Equation

## Explainer

### What you are looking at

Heat always flows from hot to cold, but how fast depends on the
material. The playground solves the two-dimensional heat equation on a
slab you can paint with conductor or insulator. The point it makes
concrete: a metal bar threaded through a foam wall develops a gentle
slope in the metal and a steep cliff in the foam, even though exactly
the same amount of heat crosses both.

### The heat equation

The temperature field $T(x,y,t)$ evolves by

$$\frac{\partial T}{\partial t}
  \;=\; \nabla\cdot\big(\kappa\,\nabla T\big) \;+\; S,$$

where $\kappa(x,y)$ is the thermal diffusivity (how readily the local
material conducts heat) and $S$ is any heat source. The heat flux
follows Fourier's law,

$$\mathbf{q} \;=\; -\,\kappa\,\nabla T,$$

so heat runs downhill in temperature at a rate set by $\kappa$.

### Steady state and the composite wall

When nothing changes in time, $\partial T/\partial t = 0$, so the field
settles to the balance $\nabla\cdot(\kappa\nabla T) + S = 0$ (Poisson,
or Laplace when $S=0$). For a uniform $\kappa$ held between two fixed
faces the steady profile is a straight line. Across a composite wall
the flux $\mathbf{q}$ must be continuous (heat cannot pile up at the
interface), so $-\kappa\,dT/dx$ is the same on both sides and the
gradient $dT/dx$ is steeper in the lower-$\kappa$ material by exactly
the ratio of the conductivities. That is the cliff-in-the-insulator.

### The stability limit

An explicit time step is only stable if it is small enough: in two
dimensions $dt \le dx^2/(4\,\kappa_{\max})$. Push the time-lapse past
that bound and the numbers blow up instead of diffusing; the
playground shows the bound live so you can watch it fail.

### Things to try

- Paint a metal bar through an insulating wall and watch the kink form
  in both the field and the cross-section.
- Raise the conductivity contrast and see the gradient ratio across
  the interface grow with it.
- Push the time-lapse rate past the stability bound and watch the
  explicit scheme diverge.

### Where this comes from

The variable-coefficient heat equation, Fourier's law and the
composite-wall result follow Incropera, Fundamentals of Heat and Mass
Transfer, Chapters 2 and 5; the explicit scheme and its stability
bound follow Press et al., Numerical Recipes (3rd ed.), Section 20.2.

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
Sec. 20.2; Incropera, *Fundamentals of Heat and Mass
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

Source: Press et al., *Numerical Recipes* (3rd ed.), Sec. 20.2; Incropera, *Fundamentals of Heat and Mass Transfer*,
Ch. 5.
