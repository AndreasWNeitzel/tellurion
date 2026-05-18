---
title: Lagrangian vs Newtonian
slug: lagrangian-vs-newtonian
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: lemos-mech
primary_chapter: 2
hook: 'Newton balances forces, Lagrange extremizes an action; point them at the same pendulum and they produce the identical motion by opposite routes.'
one_paragraph: 'The planar pendulum can be derived three ways: Newton''s second law with the tension constraint, the Euler-Lagrange equation from L = T - V, and Hamilton''s equations. The playground shows the same swinging pendulum alongside the three formulations and their equations, making explicit that the force-based and variational approaches are equivalent reformulations, with Lagrangian mechanics trading vector force-bookkeeping for a single scalar and automatic constraint handling. This equivalence is the conceptual pivot of a first analytical-mechanics course. Reference: Lemos, Analytical Mechanics, Ch. 2-3.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Lagrangian vs Newtonian formalism
Same planar-pendulum dynamics shown three ways. Source: Lemos Ch. 2-3 (`lemos-mech`).

## Explainer

### What you are looking at

There are two ways to derive the motion of a system: Newton's
(track every force and constraint vector) and Lagrange's (write one
scalar energy function and turn a crank). The playground runs the
same pendulum both ways and overlays the trajectories so you see they
are identical, while one route was far less work.

### Newton's way

In the Newtonian formulation you resolve forces and the unknown
constraint force (the rod tension) and project onto the motion:

$$m\ddot{\mathbf r} = \mathbf F_\mathrm{grav} + \mathbf T,$$

then eliminate the tension to get the equation for the angle. For one
pendulum this is manageable; for a double pendulum or a bead on a
wire it becomes a vector bookkeeping nightmare.

### Lagrange's way

Write a single scalar, the Lagrangian $L = T - V$ (kinetic minus
potential energy) in any convenient generalized coordinate $q$ (here
the angle $\theta$), and the equation of motion is the
Euler-Lagrange equation:

$$\frac{d}{dt}\frac{\partial L}{\partial\dot q}
  - \frac{\partial L}{\partial q} = 0.$$

For the pendulum $L=\tfrac12 m\ell^2\dot\theta^2 + mg\ell\cos\theta$,
and turning the crank gives $\ddot\theta = -(g/\ell)\sin\theta$
directly, with the constraint force never appearing. The two methods
must agree (the playground confirms the curves coincide to numerical
precision), but Lagrange's needs no force diagram, no constraint
forces, and any coordinates: it generalizes effortlessly to many
bodies and is the gateway to Hamiltonian mechanics, Noether's
theorem and field theory. Same physics, vastly less algebra; that is
the whole point of analytical mechanics.

### Things to try

- Run both formulations and confirm the Newtonian and Lagrangian
  trajectories overlap exactly (same physics).
- Note the Lagrangian route never needs the rod tension; the
  Newtonian one must solve for and cancel it.
- Increase the amplitude into the nonlinear regime and see both
  still agree (the equivalence is exact, not small-angle).

### Where this comes from

The Newtonian and Lagrangian formulations and their equivalence
follow Lemos, *Analytical Mechanics*, Chapters 2 and 3, and Taylor,
*Classical Mechanics*, Chapter 7.
