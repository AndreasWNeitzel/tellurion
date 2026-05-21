---
title: Thomas Precession
slug: thomas-precession
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3028
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: jackson3e
primary_chapter: 11
hook: 'Carry a gyroscope around a circle at relativistic speed and it comes back rotated, with no torque, because boosts in different directions do not commute.'
one_paragraph: 'Thomas precession is a purely kinematic relativistic rotation: a gyroscope carried around a closed path picks up an extra (gamma - 1) radians of rotation per revolution with no applied torque, because two non-collinear Lorentz boosts compose into a boost plus a rotation. It is the factor-of-2 correction that reconciles the naive spin-orbit coupling with measured atomic fine structure. The playground carries a spin vector around a circular orbit and accumulates the precession as you raise the orbital speed. Reference: Jackson, Classical Electrodynamics, 3e, Ch. 11.8.'
tags: [relativity, animation, live-readout]
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
# Thomas precession
A gyroscope on a circular orbit picks up $(\gamma - 1)$ rad of extra rotation per revolution. Source: Jackson 3e Ch. 11.8 (`jackson3e`).

## Explainer

### What you are looking at

Carry a gyroscope around a closed loop at relativistic speed and it
comes back rotated, even though no torque ever acted on it. The
rotation is purely a relativity-of-simultaneity effect: a string of
boosts in different directions does not compose into a pure boost. This
Thomas precession is the missing factor of 2 in atomic fine structure.

### Why boosts do not commute

A Lorentz boost in one direction followed by a boost in another is not
a single boost: it equals a boost plus a rotation (the Wigner
rotation). An accelerating particle is, instant by instant, a chain of
infinitesimal boosts in slightly different directions, so its rest
frame slowly rotates relative to the lab even with zero applied torque.
For circular motion the accumulated rotation per revolution is

$$\Delta\phi_\text{Thomas} = 2\pi\,(\gamma - 1),$$

(with $\gamma$ the Lorentz factor), opposite to the orbital sense. At
low speed $\gamma - 1 \approx \tfrac12\beta^2$, small but not zero.

### Why it matters

A naive calculation of the electron's spin-orbit energy in an atom
comes out a factor of 2 too large. Thomas precession is exactly the
correction: the electron's rest frame is non-inertial and precesses,
halving the effective spin-orbit coupling. Without this kinematic
rotation, atomic fine structure would not match experiment. The
playground carries a spin vector around a circular orbit and
accumulates the $(\gamma - 1)$ rotation as you raise the speed.

### Things to try

- Increase the orbital speed and watch the per-revolution rotation
  grow as $\gamma - 1$ (negligible at low $\beta$, large near $c$).
- Note nothing exerts a torque: the rotation is pure boost
  composition.
- Connect it to atoms: this is the factor-of-2 that fixes spin-orbit
  fine structure.

### Where this comes from

The Wigner rotation, the $(\gamma-1)$ per-revolution Thomas precession,
and its role in fine structure follow Jackson, *Classical
Electrodynamics*, 3rd ed., Section 11.8.
