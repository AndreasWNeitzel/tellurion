---
title: "Fluid Painter: Lattice Boltzmann Sandbox"
slug: fluid-painter-lattice-boltzmann
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: AST3014
supporting_ucs: []
curriculum_year: bsc-y3s1
hook: 'Draw obstacles by click-drag; a Lattice Boltzmann solver responds in real time with vortex streets, Bernoulli flow acceleration, and a viridis velocity-magnitude field.'
one_paragraph: 'D2Q9 BGK collision on a 192x96 grid, bounce-back at user-drawn obstacles, steady inflow on the left and zero-gradient outflow on the right. Reynolds number tunable via the relaxation time tau.'
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

## Explainer

### What you are looking at

Draw a wall and watch fluid flow around it in real time: vortices peel
off, a wake forms, dye swirls. It is solving the Navier-Stokes
behavior, but not by discretizing those equations directly. Instead it
streams and collides fictitious particle populations on a grid, the
lattice Boltzmann method, which recovers fluid flow in the large-scale
limit and parallelizes trivially.

### The method

On each grid cell live nine distribution functions $f_i$ (the D2Q9
stencil: rest plus eight lattice directions $\mathbf c_i$). Each step
is just stream then collide. Collision relaxes toward the local
equilibrium with a single rate (BGK):

$$f_i \to f_i - \frac{f_i - f_i^\text{eq}}{\tau},$$

$$f_i^\text{eq} = \rho\,w_i\left[1
  + \frac{\mathbf u\!\cdot\!\mathbf c_i}{c_s^2}
  + \frac{(\mathbf u\!\cdot\!\mathbf c_i)^2}{2 c_s^4}
  - \frac{\mathbf u\!\cdot\!\mathbf u}{2 c_s^2}\right],
  \qquad c_s^2 = \tfrac13.$$

Density and velocity are just moments of the $f_i$. Obstacles use
bounce-back (populations reverse at a wall, giving no-slip). A
Chapman-Enskog expansion shows this reproduces the incompressible
Navier-Stokes equations with kinematic viscosity

$$\nu = c_s^2\left(\tau - \tfrac12\right).$$

The relaxation time $\tau$ thus sets the Reynolds number
$\mathrm{Re} = UL/\nu$, the single dimensionless knob that decides
whether the flow is smooth or turbulent.

### What the flow shows

Behind a circular obstacle at moderate Reynolds number, vortices shed
alternately, the Von Karman vortex street (the same physics that makes
flags flap and wires sing). A sharp corner or a shear layer rolls up
into Kelvin-Helmholtz billows. The injected dye is passive: it
visualizes mixing without changing the flow. Because every cell only
talks to its neighbors, the whole thing runs fast in a Worker and
responds to your drawing instantly.

### Things to try

- Draw a circle in a stream and watch the vortex street develop
  behind it; widen it to raise Re and see the wake go turbulent.
- Make a sharp step and watch a Kelvin-Helmholtz roll-up on the shear
  layer.
- Shift-drag dye and watch it trace the mixing without disturbing the
  flow.

### Where this comes from

The D2Q9 lattice Boltzmann method, the BGK collision, bounce-back
boundaries, and the $\nu = c_s^2(\tau - 1/2)$ viscosity follow Kruger
et al., *The Lattice Boltzmann Method* (Springer, 2017).

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
