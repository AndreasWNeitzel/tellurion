---
title: "Fluid Painter: Lattice Boltzmann Sandbox"
slug: fluid-painter-lattice-boltzmann
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: AST3014
primary_citation: kulsrud-plasma-astro
supporting_ucs: []
curriculum_year: bsc-y3s1
hook: 'Draw an obstacle by click-drag and watch the flow respond in real time: it accelerates around the body and leaves a low-speed wake behind it, the speed shown as a colour field.'
one_paragraph: 'A D2Q9 BGK lattice-Boltzmann channel flow on a 192x96 grid: steady inflow on the left, zero-gradient outflow on the right, and half-way bounce-back at user-drawn obstacles. The relaxation time tau sets the kinematic viscosity nu = (tau - 1/2)/3 and hence the obstacle Reynolds number Re = U D / nu, so lowering tau drives the wake from a steady recirculation toward unsteady vortex shedding. Reference: Kruger et al., The Lattice Boltzmann Method (Springer 2017), Chapters 3 to 5.'
tags: [fluids-mhd, interactive-drag, animation, field-visualization]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
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
  - "Kulsrud, Plasma Physics for Astrophysics."
---

# Fluid Painter: Lattice Boltzmann Sandbox

Draw obstacles by click-drag (shift-drag erases); a 192 x 96 D2Q9 lattice-Boltzmann solver responds in real time. The colour field shows the local flow speed: bright where the fluid accelerates around the body, dark in the low-momentum wake behind it. A circular obstacle at moderate Reynolds number sheds a vortex street; lowering the relaxation time raises the Reynolds number and roughens the wake.

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

Behind a circular obstacle the flow separates: a low-momentum wake
forms on the centreline while the fluid squeezed around the sides
speeds up (a clear momentum deficit between the two). At moderate
Reynolds number the wake recirculates steadily; lower the relaxation
time to raise the Reynolds number and the wake becomes unsteady,
shedding alternately into a Von Karman vortex street (the same physics
that makes flags flap and wires sing). Because every cell only talks
to its neighbours, the solver responds to your drawing immediately.

### Things to try

- Draw a circle in the stream and watch the wake form behind it while
  the flow accelerates around its sides.
- Lower tau (raise the Reynolds number) and watch the steady wake give
  way to unsteady vortex shedding.
- Draw a flat plate across part of the channel and see the flow
  divert and a longer separated wake form behind it.

### Where this comes from

The D2Q9 lattice Boltzmann method, the BGK collision, bounce-back
boundaries, and the $\nu = c_s^2(\tau - 1/2)$ viscosity follow Kruger
et al., *The Lattice Boltzmann Method* (Springer, 2017).

## Physical setup

D2Q9 distribution functions $f_i$ on a 2D grid. BGK collision $f_i \to f_i - (f_i - f_i^\mathrm{eq})/\tau$ with equilibrium $f_i^\mathrm{eq} = \rho w_i [1 + \mathbf{u}\cdot\mathbf{c}_i/c_s^2 + (\mathbf{u}\cdot\mathbf{c}_i)^2/(2 c_s^4) - \mathbf{u}\cdot\mathbf{u}/(2 c_s^2)]$, $c_s^2 = 1/3$. Bounce-back boundary conditions at obstacles. Kinematic viscosity $\nu = c_s^2(\tau - 1/2)$. Re $= UL/\nu$.

## Controls

- Click-drag: draw obstacle cells; shift-drag erases.
- tau (relaxation time): sets the viscosity and hence the Reynolds
  number.
- Clear obstacles; Reset flow.

## Invariants

- D2Q9 equilibrium moments exact: sum_k f_k^eq = rho and
  sum_k c_k f_k^eq = rho u.
- Uniform fluid at rest (no inflow, no obstacle) is a fixed point.
- Deterministic: identical inputs reproduce the populations bit-for-bit.
- Fluid mass stays finite and bounded over a long run.
- An obstacle leaves a momentum deficit: the wake centreline is slower
  than the bypass flow beside it.
- Kinematic viscosity nu = (tau - 1/2)/3 and Re = U D / nu.

## Citations

Kruger et al., "The Lattice Boltzmann Method", Springer 2017.
