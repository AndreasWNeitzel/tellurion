---
title: Equipartition from Microscopic Collisions
slug: equipartition-from-collisions
status: deprecated
superseded_by: maxwell-boltzmann-emergence
audience: portfolio
created: 2026-05-14
primary_uc: FIS2014
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: reif
primary_chapter: 7
hook: 'Let hard disks bang around at random and, with no thermostat, the average kinetic energy per degree of freedom settles on exactly half kT.'
one_paragraph: 'Equipartition is usually stated as a result; here you watch it emerge. A box of hard disks starts with arbitrary velocities and simply collides elastically. Energy and momentum are conserved at every bounce, yet the velocity distribution relaxes to Maxwell-Boltzmann and the mean translational kinetic energy converges to kT (half kT per degree of freedom in 2D). The playground runs the gas and plots the running average against the kT line so the approach is visible. It shows that equipartition is a statistical consequence of collisions, not an assumption put in by hand. Reference: Reif, Fundamentals of Statistical and Thermal Physics, Ch. 7.'
tags: [thermodynamics, statistical-physics, animation, live-readout]
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
# Equipartition from collisions
2D hard-disk gas; the mean translational kinetic energy converges to $kT$. Source: Reif Ch. 7.

## Explainer

### What you are looking at

Start a gas of disks with a wildly unequal speed distribution and let
them collide. Without any thermostat or imposed rule, collisions alone
drive the system to the Maxwell-Boltzmann distribution and equal
energy per degree of freedom. The playground shows that emergence: the
histogram morphs to the bell curve and the mean energy settles at the
equipartition value.

### Just elastic hard-disk collisions

Every disk pair conserves momentum and kinetic energy on contact
(elastic), with the impulse along the line of centres. Nothing else is
imposed: no friction, no heat bath, no target distribution. Yet from
almost any start the speed distribution relaxes to the 2D
Maxwell-Boltzmann form

$$f(v) \,\propto\, v\,\exp\!\left(-\frac{m v^2}{2 k_B T}\right),$$

because that distribution is the unique collision-invariant one
(Boltzmann's H-theorem: collisions can only increase entropy until
the distribution is Maxwellian).

### Equipartition

Once relaxed, the mean translational kinetic energy per disk obeys the
equipartition theorem: $\tfrac12 k_B T$ for each quadratic degree of
freedom, so in 2D

$$\langle \tfrac12 m v^2 \rangle = 2\cdot\tfrac12 k_B T = k_B T,$$

and the temperature is just a readout of the mean kinetic energy. The
deep point is that temperature, the Maxwell distribution, and
equipartition are not assumptions of kinetic theory: they are
emergent attractors of pure mechanical collisions. The playground
tracks the running speed histogram against the Maxwell curve and the
mean energy against $k_B T$ so you watch the second law happen.

### Things to try

- Start everything at the same speed (a delta function) and watch
  collisions broaden it into the Maxwell-Boltzmann bell.
- Confirm the mean kinetic energy converges to $k_B T$ (equipartition)
  regardless of the initial distribution.
- Speed up or slow down the gas and watch the same shape rescale (T
  is just the mean energy).

### Where this comes from

The hard-sphere relaxation to Maxwell-Boltzmann, the H-theorem, and
equipartition follow Reif, *Fundamentals of Statistical and Thermal
Physics*, Chapter 7, and Blundell and Blundell, *Concepts in Thermal
Physics*, Chapter 5.
