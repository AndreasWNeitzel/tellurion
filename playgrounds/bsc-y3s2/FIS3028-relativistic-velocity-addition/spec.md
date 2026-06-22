---
title: Relativistic Velocity Addition
slug: relativistic-velocity-addition
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3028
curriculum_year: bsc-y3s2
primary_citation: taylor-wheeler
primary_chapter: 3
hook: "Half light speed plus half light speed is not light speed. Watch velocities combine through the relativistic law and never quite reach c, while rapidities add the ordinary way."
one_paragraph: "Collinear velocities combine relativistically as w = (u+v)/(1+uv/c^2), which keeps the result below c for any sub-light inputs and leaves light invariant. The playground races a light pulse, a ball, and a ship from rest (the ball never catches the light), lays the ground velocities on a [-c,c] axis where the Galilean sum overshoots the light wall, and shows the rapidity phi = artanh(beta) adding head to tail since phi_w = phi_u + phi_v. The diagnostic plots w against v: the relativistic curve flattens against c while the Galilean line runs off."
tags: [relativity, special-relativity, velocity-addition, rapidity, kinematics, interactive, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [u, v]
invariants:
  - key: sublight
    label: the combined ground speed stays below c for sub-light inputs
    tolerance: 0.0
  - key: rapidity
    label: rapidities add, phi_w = phi_u + phi_v
    tolerance: 1e-9
  - key: light
    label: adding any velocity to c returns c
    tolerance: 1e-12
what_to_try:
  - Set both speeds to 0.9c; the ground speed is 0.994c, the Galilean sum 1.8c.
  - Push either speed to c; the ground speed locks to exactly c.
  - Watch the rapidity axis; phi_u and phi_v always sum to phi_w.
  - Drop both speeds near zero; relativistic and Galilean answers coincide.
references:
  - "Taylor and Wheeler, Spacetime Physics, 2nd ed., Freeman, 1992, Ch. 3."
  - "Rindler, Relativity: Special, General, and Cosmological, 2nd ed., Ch. 2."
---

# Relativistic velocity addition

## Physical setup

A frame (ship) moves at velocity u along a line; an object (ball) moves at velocity v
along the same line within the ship frame. The object's velocity in the original frame
is sought. Units c = 1.

## Equations

$$ w = \frac{u+v}{1+uv/c^2}, \qquad \phi = \operatorname{artanh}\beta, \qquad \phi_w = \phi_u + \phi_v. $$

For $|u|,|v|<c$ the result satisfies $|w|<c$; for $v=c$ (or $u=c$), $w=c$.

## Numerical method

Closed-form evaluation of the velocity-addition law and the rapidity; the race animates
ground-frame positions x = (speed) t. No integration.

## Controls

- Ship speed u; ball speed v in the ship frame.

## Expected qualitative features

1. The combined speed never reaches c for sub-light inputs.
2. Adding any speed to c returns c (light is invariant).
3. The Galilean sum u+v overshoots the light wall.
4. Rapidities add linearly even as velocities saturate.

## Invariants and acceptance thresholds

- $|w|<c$ for $|u|,|v|<c$.
- $\phi_w = \phi_u + \phi_v$ to 1e-9.
- $w=c$ when $v=c$ or $u=c$.

## Citations

Taylor and Wheeler, Spacetime Physics, 2nd ed., Ch. 3.
Rindler, Relativity: Special, General, and Cosmological, 2nd ed., Ch. 2.
