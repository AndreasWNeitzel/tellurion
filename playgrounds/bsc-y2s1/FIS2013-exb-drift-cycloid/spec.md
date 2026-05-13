---
title: E x B Drift and the Cycloid
slug: exb-drift-cycloid
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2013
supporting_ucs: [MAA-PL]
curriculum_year: bsc-y2s1
---

# E x B drift and the cycloid

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
