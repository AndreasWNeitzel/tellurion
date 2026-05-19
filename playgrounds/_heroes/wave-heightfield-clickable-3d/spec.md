---
title: Wave Heightfield (Clickable Hero)
description: "Click the shaded 3D surface to drop a ripple into a damped 2D wave equation on a 256x256 grid with fixed (Dirichlet) walls. Concentric ridges spread at speed c, bounce off the walls, and successive clicks interfere. Sliders set the wave speed, damping, impulse height and width; drag to orbit, scroll to zoom."
caption: "Figure 1. Shaded heightfield of the displacement u(x,y,t) for the damped 2D wave equation, with click-seeded Gaussian impulses reflecting off Dirichlet walls and interfering. Method: explicit finite-difference time stepping on a 256x256 grid, Blinn-Phong shaded surface. Source: French, Vibrations and Waves, Ch. 6."
slug: wave-heightfield-clickable-3d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2016
supporting_ucs: [FIS1013]
curriculum_year: hero
primary_citation: french-waves
primary_chapter: 6
hook: "Drop a stone in a pond and rings spread, bounce off the edges, and cross through each other without colliding. Click the surface and watch exactly that: the 2D wave equation solved live, ripples reflecting off fixed walls and interfering, with sliders for speed and damping."
one_paragraph: "This solves the damped two-dimensional wave equation, d2u/dt2 = c^2 (d2u/dx2 + d2u/dy2) minus gamma du/dt, on a 256x256 grid whose edges are clamped to zero (Dirichlet walls, like a drum skin pinned at its rim). Click anywhere on the shaded surface to seed a Gaussian bump of height A and width sigma; it splits into a ring that travels outward at the wave speed c, reflects off the four walls, and passes through earlier ripples, adding where crests meet and cancelling where a crest meets a trough (linear superposition). The gamma slider adds damping, so the energy bleeds away and the surface settles flat; with gamma = 0 the total energy is essentially conserved (the readout tracks it). Raising c makes the rings travel faster and forces a smaller stable time step internally (the explicit scheme is only stable below the Courant limit). The surface is a real Blinn-Phong-lit 3D heightfield, not a flat colour map: drag to orbit, scroll to zoom, and the readout shows the energy, the absorbed-energy fraction, the click count and FPS."
tags: [waves, click-seed, animation, live-readout, interactive-drag]
difficulty: 3
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 6
share_state_keys: [c, gamma, A, sigma]
---

# Wave Heightfield (Clickable)

## Explainer

### What you are looking at

A drumhead rendered as a lit 3D surface that you can poke. Every
click drops a ripple that spreads at a fixed speed, bounces off the
rim, and adds to every other ripple. It is an interactive ripple
tank, the cleanest demonstration of how 2D waves propagate, reflect,
interfere, and decay.

### The wave equation

A stretched membrane pinned at its edges obeys the 2D wave equation
with damping:

$$\frac{\partial^2 u}{\partial t^2}
  = c^2\nabla^2 u - \gamma\frac{\partial u}{\partial t},$$

with $u(x,y,t)$ the height, $c$ the wave speed (set by tension and
density), and $\gamma$ the damping. It is solved on a grid by an
explicit finite-difference stencil, stable while the Courant number
$c\,\Delta t/\Delta x \le 1/\sqrt2$ (the 2D CFL limit; exceeding it
makes the scheme blow up).

### What the ripples show

Three universal wave behaviours, all visible at once:

- Propagation at constant speed: a click makes an expanding circular
  front; the radius grows linearly with time.
- Reflection with inversion at the fixed rim ($u=0$ boundary): the
  returning pulse is flipped, exactly the half-wave phase change of a
  hard boundary, and repeated reflections build standing-wave modes.
- Linear superposition: two ripples pass through each other and add,
  producing interference (reinforcement and cancellation) with no
  mutual scattering. Damping drains energy so the surface relaxes
  back to flat.

Same equation governs sound, light, seismic and water waves; the
heightfield just makes the 2D field tangible. The playground lets you
seed Gaussian impulses anywhere and change $c$ and $\gamma$.

### Things to try

- Click once and watch a clean circular front expand and reflect
  inverted off the edges.
- Click twice and watch the two ripples interfere (bright
  reinforcement, dark cancellation) and then pass through unchanged.
- Raise the damping and watch the surface settle to flat; lower it
  and watch reflections build a standing-wave pattern.

### Where this comes from

The 2D wave equation, boundary reflection and the CFL stability
condition follow French, *Vibrations and Waves*, Chapter 7, and
LeVeque, *Finite Difference Methods for ODEs and PDEs*, Chapter 4.

## Physical setup

A stretched membrane pinned at its edges obeys the two-dimensional wave equation. Any disturbance spreads as a travelling wave at a fixed speed set by the medium, reflects off the fixed boundary (inverting on reflection), and superposes linearly with other disturbances. Damping removes energy and the membrane relaxes back to flat. Clicking the surface seeds a localized Gaussian impulse, so the playground is an interactive ripple tank rendered as a lit 3D heightfield.

## Governing equations

The damped 2D wave equation (geometric units):

d2u/dt2 = c^2 (d2u/dx2 + d2u/dy2) - gamma du/dt,

with u = 0 on all four edges (Dirichlet). A click adds a Gaussian impulse of amplitude A and width sigma to u. The total energy is the sum of kinetic (du/dt)^2 and gradient (c^2 |grad u|^2) terms; with gamma = 0 it is conserved up to scheme error, and with gamma > 0 it decays monotonically.

## Numerical method

Explicit second-order finite differences in space and time on a 256x256 grid (the shared CPU reference `engine/wave-2d-cpu.js`, which the invariant tests call, and the matching WebGL2 engine `engine-gl/wave-2d.js`, sole consumer this playground). The explicit leapfrog update is conditionally stable: it requires the Courant number c dt / dx <= 1/sqrt(2) in 2D, so the internal time step shrinks as the speed slider c is raised. The surface is drawn as a Blinn-Phong-shaded heightfield (three-point lighting, ACES tonemap). A click is projected from screen space to a grid cell by ray-casting the heightfield.

## Controls

- c (0.1 to 0.7): wave speed (also sets the stable internal time step).
- gamma (0 to 0.1): damping rate; 0 conserves energy, larger values relax the surface faster.
- A (0.1 to 2.0): height of the seeded Gaussian impulse.
- sigma (1 to 16): width of the seeded Gaussian impulse.
- Click the surface to seed an impulse; drag to orbit, scroll to zoom. The readout shows E(t), absorbed-energy fraction, click count and FPS.
- share_state_keys: `c`, `gamma`, `A`, `sigma`.

## Expected qualitative features

- A single click produces a concentric ring that spreads at speed c.
- The ring reflects off the four fixed walls (corners light up after the first reflections) and the edges stay pinned near zero.
- Two or more impulses interfere: reinforcing where crests meet, cancelling where a crest meets a trough.
- gamma > 0 makes the pattern decay to flat; gamma = 0 keeps it ringing with nearly constant energy.
- The five reference frames differ (spike, expanding ring, multi-front interference, damped late state).

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. The initial (unperturbed) energy is exactly zero.
2. Seeding an impulse increases the energy above zero.
3. With gamma = 0 the energy is nearly conserved over 1000 steps (relative drift below 0.6, a loose bound appropriate for the explicit scheme).
4. With gamma > 0 the energy after stepping is below the post-impulse energy (it decays).
5. Dirichlet boundary: the edge cells stay near zero.

Visual gate: SSIM > 0.92 against committed golden frames (deterministic). The post-build multimodal review confirmed the 3D heightfield, the spreading and reflecting ripples, the interference, the damping and a legible readout (6 of 6).

## Limiting cases for verification

- gamma = 0: undamped, energy-conserving standing-wave ringing.
- Large gamma: rapid relaxation back to a flat membrane.
- Early time after one click: a clean expanding circular front before any wall reflection.

## Visual fallback

If the WebGL2 context or float buffers are unavailable the engine falls back to the CPU grid (`wave-2d-cpu.js`); the energy readout and invariants still define correctness.

## Citations

- French, Vibrations and Waves, Ch. 6: the wave equation, reflection at fixed boundaries, superposition.
- Press et al., Numerical Recipes: the explicit finite-difference scheme and the Courant stability condition.

## Risk register

- The explicit leapfrog scheme is only conditionally stable; the internal time step is tied to the speed slider so the Courant limit is respected across the full c range. Stated here.
- Energy is conserved only up to discretization error at gamma = 0 (hence the loose 0.6 relative bound in invariant 3); this is expected for an explicit scheme and is not a physical leak.
