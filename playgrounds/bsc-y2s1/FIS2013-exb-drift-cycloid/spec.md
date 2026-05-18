---
title: E x B Drift and the Cycloid
slug: exb-drift-cycloid
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2013
supporting_ucs: [MAA-PL]
curriculum_year: bsc-y2s1
hook: 'Cross an electric and a magnetic field and a charge released from rest does not fly along E; it loops in cycloids and drifts sideways at exactly E/B.'
one_paragraph: 'In crossed uniform fields a charge starting from rest accelerates along E until the growing v x B force curls it back, then repeats: the path is a cycloid, like a point on the rim of a rolling wheel. Averaged over one loop the particle marches steadily perpendicular to both fields at the velocity (E x B) / B^2, independent of its charge, mass, and sign. The playground integrates the exact motion and overlays that drift velocity, so you see the looping micro-motion and the clean sideways march it averages to, the building block of plasma E x B transport. Reference: Griffiths, Introduction to Electrodynamics, Ch. 5.'
tags: [electromagnetism, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# E x B drift and the cycloid

## Explainer

### What you are looking at

Cross an electric field with a magnetic field and a charged particle
released from rest does something surprising: it does not run along the
electric field. It loops in cycloid arcs and, on average, drifts
sideways, perpendicular to both fields, at a speed that does not depend
on its charge or mass. This E-cross-B drift moves plasma in the
magnetosphere, Hall thrusters, and fusion devices.

### The equations

With $\mathbf B = B\hat z$ out of the page and $\mathbf E = E\hat x$,
the Lorentz force gives (for $q=m=1$)

$$\dot v_x = E + v_y B, \qquad \dot v_y = -v_x B.$$

Starting from rest the exact solution is a cycloid: a circular
cyclotron loop of radius $E/B^2$ riding on a steady drift. Decompose
the velocity into the drift plus a circular part and the drift comes
out as

$$\mathbf v_d = \frac{\mathbf E\times\mathbf B}{B^2},
  \qquad |\mathbf v_d| = \frac{E}{B},$$

directed along $-\hat y$ here. The cyclotron loop has period
$T_c = 2\pi m/(qB)$.

### Why the drift is charge-independent

A positive and a negative charge curl in opposite senses, but they
also accelerate in opposite directions under $E$, and the two effects
combine so that both drift the *same* way at the *same* speed
$E/B$. Mass and charge cancel out of $\mathbf v_d$ entirely. That is
why an $\mathbf E\times\mathbf B$ drift moves a whole quasi-neutral
plasma bodily, without separating charge, the basis of plasma
transport and of crossed-field velocity selectors.

### Things to try

- Release from rest and watch the cycloid: tight loops that march
  steadily sideways, not along $\mathbf E$.
- Change $E$ or $B$ and confirm the drift speed tracks $E/B$ while the
  loop size tracks $E/B^2$.
- Note the drift direction is set by $\mathbf E\times\mathbf B$, not
  by the sign of the charge.

### Where this comes from

The crossed-field equations of motion, the cycloid solution, and the
$\mathbf E\times\mathbf B/B^2$ drift follow Jackson, *Classical
Electrodynamics*, 3rd ed., Chapter 12.

## Physical setup

A charged particle (q = m = 1) in crossed uniform fields B = B z-hat (out
of page) and E = E x-hat. Starting from rest at the origin, the particle
follows a cycloid: it accelerates in +x under E until v x B curves it
back. The net motion is a uniform drift in (E x B) / B^2 = -E / B in y.

## Governing equations

  d v / dt = (q / m) (E + v x B)
  dvx/dt = E + vy B
  dvy/dt = -vx B

The closed-form trajectory starting from rest is a cycloid with amplitude
E / B^2 in x and uniform drift -E / B in y. Cyclotron period T_c =
2 pi m / (q B).

## Numerical method

Fourth-order Runge-Kutta with dt = 0.01.

## Controls

- E: electric-field magnitude, 0.1 to 1.5.
- B: magnetic-field magnitude, 0.5 to 2.5.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Cycloid trajectory: loops with amplitude E / B^2 in x.
2. Net drift in -y direction at speed E / B.
3. Smaller B -> bigger loops, slower drift in some sense (depends on B).
4. Larger E -> faster drift, bigger loops.

## Invariants and acceptance thresholds

1. Drift velocity formula: E x B / B^2 = -E / B in y for B z-hat, E x-hat.
2. From rest: y drifts to -E/B * T after one cyclotron period.
3. x range = 2 E / B^2 (cycloid amplitude).
4. E = 0 reduces to pure cyclotron.
5. Numerical state vs analytic agreement within 1e-3 at t = 1.
6. E sign reversal flips drift direction.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- E = 0: pure cyclotron orbit.
- B -> infinity: cycloid amplitude vanishes, drift -> 0.
- v(0) = drift velocity: no cycloid, just uniform drift.

## Visual fallback

Canvas2D only. Charged particle (warm orange) with trail (blue),
B-field background (dotted out-of-page), E-field arrows (yellow), drift
vector (cyan arrow attached to particle).

## Citations

- Jackson, Classical Electrodynamics 3e Ch. 12.

## Stretch goals

- Grad-B drift (non-uniform B).
- Mass and charge dependence.
- Comparison with curvature drift in tokamak geometries.

## Risk register

- For very small B, cycloid amplitude blows up; slider lower bound is 0.5.
- For very large E with small B, the particle leaves the box quickly; trail
  capped at 1500 points.
