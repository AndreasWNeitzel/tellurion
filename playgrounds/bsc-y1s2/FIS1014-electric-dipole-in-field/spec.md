---
title: An Electric Dipole in a Uniform Field
slug: electric-dipole-in-field
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS1014
curriculum_year: bsc-y1s2
primary_citation: griffiths-em
primary_chapter: 4
hook: "A uniform field cannot push a dipole, only twist it. The torque rotates it toward alignment and it librates like a pendulum in an energy well."
one_paragraph: "A dipole p in a uniform field E feels equal and opposite forces on its two charges: no net force, but a couple with torque tau = p x E of size pE sin(theta), always rotating it toward alignment. The orientation energy is U = -p.E = -pE cos(theta), minimum aligned and maximum anti-aligned, so released at an angle the dipole librates about the field like a pendulum, small-oscillation period T = 2 pi sqrt(I/pE). The playground draws the couple, the torque, and the libration, and shows the orientation-energy well with the total-energy line whose crossings are the turning points; damping spirals the dipole into alignment."
tags: [electromagnetism, dipole, torque, oscillation, energy, animation, live-readout]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [E, theta]
invariants:
  - key: torque
    label: torque tau = -pE sin(theta), zero aligned and anti-aligned, restoring
    tolerance: 1e-9
  - key: energy
    label: orientation energy U = -pE cos(theta), minimum at alignment
    tolerance: 1e-9
  - key: conserve
    label: without damping the total energy is conserved over a libration
    tolerance: 1e-3
what_to_try:
  - Drag the dipole to a large angle and release; it swings toward the field, overshoots, and librates.
  - Set damping to none; with no losses it librates forever and the total-energy line stays put.
  - Add damping; the total-energy line descends and the dipole spirals into alignment.
references:
  - "Griffiths, Introduction to Electrodynamics, 4th ed., Sec. 4.1.3 (torque and energy of a dipole)."
  - "Taylor, Classical Mechanics, Sec. 4.4 (the rigid-pendulum libration)."
---

# An electric dipole in a uniform field

## Physical setup

A dipole of moment p (two charges +q, -q separated by a fixed rod) sits in a
uniform electric field E and is free to rotate about its centre.

## Equations

The field exerts equal and opposite forces on the two charges, a couple with
torque

$$ \boldsymbol{\tau} = \mathbf{p}\times\mathbf{E}, \qquad |\tau| = pE\sin\theta, $$

and no net force. The orientation energy is

$$ U(\theta) = -\mathbf{p}\cdot\mathbf{E} = -pE\cos\theta, $$

minimum at alignment. The rotation obeys the rigid-pendulum equation
$I\ddot\theta = -pE\sin\theta$, with small-oscillation period
$T = 2\pi\sqrt{I/pE}$.

## Numerical method

Velocity-Verlet (symplectic) integration of the pendulum equation, with an
optional linear damping term. Energy is conserved to O(dt^2) without damping.

## Controls

- Field strength E, damping; drag the dipole to set the angle; Reset.

## Expected qualitative features

1. The dipole rotates toward alignment and overshoots, librating about the field.
2. Without damping the libration is perpetual and energy is conserved.
3. With damping the dipole spirals into alignment at the energy minimum.

## Invariants and acceptance thresholds

- $\tau = -pE\sin\theta$, restoring, zero at $\theta = 0, \pi$.
- $U = -pE\cos\theta$, minimum at $\theta = 0$.
- Energy conserved without damping over a libration.

## Citations

Griffiths, Introduction to Electrodynamics, 4th ed., Sec. 4.1.3. Taylor,
Classical Mechanics, Sec. 4.4.
