---
title: Cyclotron Motion in a Uniform Magnetic Field
slug: cyclotron-uniform-b
status: verified
audience: portfolio
created: 2026-05-13
---

# Cyclotron motion in a uniform magnetic field

## Physical setup

A charged particle (q = m = 1) in a uniform, out-of-page magnetic field
B = B z-hat. Initial state: (x, y) = (0, 0), (vx, vy) = (0, v).

## Governing equations

  F = q v x B  =>  m a = q (vy, -vx) B
  d v / dt = (q B / m) (vy, -vx)

Closed form: circular motion at radius r = m v / (q B), angular frequency
omega_c = q B / m, period T = 2 pi m / (q B).

## Numerical method

Fourth-order Runge-Kutta with dt = 0.005.

## Controls

- B: field magnitude, 0.3 to 3.0.
- |v|: initial speed, 0.3 to 2.5.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Particle traces a circle of radius m v / (q B).
2. Larger B -> tighter circle, but same period scaling differently:
   T = 2 pi m / (q B).
3. Larger v -> bigger circle, same period at fixed B.
4. Cyan dashed circle is the analytic prediction.

## Invariants and acceptance thresholds

1. Speed conserved within 1e-5 over 1000 RK4 steps.
2. Trajectory lies on analytic circle (center (r, 0), radius r) within
   1e-3.
3. Period closure: after T, particle returns to initial position within
   1e-2 (RK4 integration error).
4. r_2 / r_1 = B_1 / B_2 (exact).
5. Reversing B sign reverses orbit direction.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- B -> infinity: r -> 0, T -> 0.
- v -> 0: particle stationary.
- Reversed B sign: clockwise instead of counter-clockwise.

## Visual fallback

Canvas2D only. Particle (warm orange dot) with trail (yellow), analytic
circle (cyan dashed), velocity arrow, dotted B-field background.

## Citations

- Jackson, Classical Electrodynamics 3e Ch. 12.

## Stretch goals

- Helical motion in 3D (with v_par).
- Time-varying B (synchrotron).
- Drift in non-uniform B (grad-B drift).

## Risk register

- For very large B (omega_c >> 1/dt), RK4 may show small phase error.
  Default dt = 0.005 keeps the error below 1 percent for B up to 3.
