---
title: Hamiltonian Phase-Space Flow
slug: hamiltonian-phase-space-flow
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: lemos-mech
primary_chapter: 6
hook: 'Click anywhere and drop a tracer; it glides along a curve of constant energy, and the whole plane fills with the nested orbits of the flow.'
one_paragraph: 'A Hamiltonian system moves so that energy is conserved, so every trajectory is confined to a constant-H contour in phase space. The playground lets you click to seed tracers anywhere; each is integrated with a symplectic step and rides its own energy contour, exposing the global structure of the flow (fixed points, separatrices, libration versus rotation). Because the integrator is symplectic the orbits stay closed and the energy does not drift. It turns the phase portrait into something you build by hand, one click at a time. Reference: Lemos, Analytical Mechanics, Ch. 6.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
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
---
# Hamiltonian phase-space flow
Click to seed tracers; each one traces an orbit at constant energy. Source: Lemos Ch. 6.

## Explainer

### What you are looking at

Instead of plotting position against time, plot position against
momentum. Every state of the system is one point in this phase plane;
as time runs, the point flows along a curve. Click to drop tracers and
each rides its own curve. The pattern of all those curves, the phase
portrait, shows the entire dynamics of the system at a glance.

### The Hamiltonian flow

For a system with Hamiltonian $H(q, p)$ (energy as a function of
position $q$ and momentum $p$), the equations of motion are Hamilton's
equations:

$$\dot q = \frac{\partial H}{\partial p}, \qquad
  \dot p = -\frac{\partial H}{\partial q}.$$

These define a velocity at every point of the phase plane, a flow.
Because $H$ has no explicit time dependence here, energy is conserved,
so every trajectory stays on a curve $H(q, p) = E$. The phase portrait
is just the family of these constant-energy contours: closed loops
around a stable equilibrium (oscillation), and the special
separatrix curve that divides qualitatively different motions (for a
pendulum, swinging versus going over the top).

### Liouville's theorem

Hamiltonian flow has a deep property: it preserves area in phase space.
A blob of initial conditions can stretch and fold but never changes its
total area, $\nabla\cdot(\dot q, \dot p) = 0$. That is why these
trajectories never spiral into a point (no attractors in a
frictionless Hamiltonian system) and why the phase portrait is filled
with nested closed curves rather than sinks. It is also the foundation
of statistical mechanics.

### Things to try

- Click near a stable equilibrium and watch the tracer trace a small
  closed loop (oscillation at fixed energy).
- Seed several tracers and note none ever cross: trajectories at
  different energies are nested, never intersecting.
- Find the separatrix: the dividing curve where the motion changes
  character.

### Where this comes from

Hamilton's equations, energy-conserving phase-space flow, the
separatrix, and Liouville's area-preservation theorem follow Lemos,
*Analytical Mechanics*, Chapter 6.
