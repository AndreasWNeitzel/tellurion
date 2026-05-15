---
title: "Fluid Painter: Lattice Boltzmann Sandbox"
slug: fluid-painter-lattice-boltzmann
status: needs-attention
audience: portfolio
created: 2026-05-15
primary_uc: AST3014
supporting_ucs: []
curriculum_year: bsc-y3s1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [fluids-mhd, interactive-drag, animation, field-visualization]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: []
---

# Fluid Painter: Lattice Boltzmann Sandbox

Draw obstacles by click-drag; a 256 x 192 D2Q9 Lattice Boltzmann solver (running in a Worker) responds instantly. Visualize velocity magnitude with a viridis colormap and overlaid streamlines. Shift-drag injects a colored tracer dye that visualizes mixing. A circular obstacle produces a Von Karman vortex street; a sharp corner produces a Kelvin-Helmholtz roll.

## Physical setup

D2Q9 distribution functions $f_i$ on a 2D grid. BGK collision $f_i \to f_i - (f_i - f_i^\mathrm{eq})/\tau$ with equilibrium $f_i^\mathrm{eq} = \rho w_i [1 + \mathbf{u}\cdot\mathbf{c}_i/c_s^2 + (\mathbf{u}\cdot\mathbf{c}_i)^2/(2 c_s^4) - \mathbf{u}\cdot\mathbf{u}/(2 c_s^2)]$, $c_s^2 = 1/3$. Bounce-back boundary conditions at obstacles. Kinematic viscosity $\nu = c_s^2(\tau - 1/2)$. Re $= UL/\nu$.

## Controls

- Click-drag: draw obstacles; right-click erases; shift-drag injects dye
- Reynolds slider, inflow speed, dye rate
- Velocity vs vorticity toggle, reset

## Invariants

- Total mass conserved within 0.01% per 1000 steps.
- Empty channel: Poiseuille parabola within 2% after 500 steps.
- Von Karman shedding period at Re = 100: Strouhal $St \approx 0.2$ within 20%.

## Status note

Scaffolded with full LBM spec; Worker + bounce-back + dye advection not yet implemented.

## Citations

Kruger et al., "The Lattice Boltzmann Method", Springer 2017 (`kruger2017`).
