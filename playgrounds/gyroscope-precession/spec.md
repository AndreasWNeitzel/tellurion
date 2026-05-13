---
title: Gyroscope Precession
slug: gyroscope-precession
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
---

# Gyroscope precession

## Physical setup

Heavy symmetric top of mass M = 1, with pivot fixed at one end and center
of mass at distance r = 0.5 along the body axis. Spin moment of inertia
I_s = 0.1. Gravity g = 9.81 along -z.

## Governing equations

In the steady-precession (omega_s >> Omega_p) limit:
  Omega_p = M g r / (I_s omega_s)

Tilt theta is constant. Azimuth phi advances at Omega_p. Spin psi
advances at omega_s.

## Numerical method

Direct kinematic update of (theta, phi, psi) by dt times the analytic
rate.

## Controls

- omega_s: spin rate, 10 to 200.
- theta: tilt from vertical, 0.1 to 1.2 rad.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Higher omega_s -> slower precession.
2. Tilt theta is constant; tip traces a horizontal circle.
3. Right panel shows the 1 / omega_s scaling.

## Invariants and acceptance thresholds

1. Omega_p formula exact.
2. Monotonic in omega_s.
3. Tilt constant.
4. Tip traces a circle of constant radius.
5. Precession period closes.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- omega_s -> infinity: Omega_p -> 0 (gyroscopic stiffness).
- omega_s = 0: leading-order model invalid (top would fall over).

## Visual fallback

Canvas2D only. Left: pseudo-3D scene with vertical axis (dashed),
ground circle, cone of precession (faint), and body axis (bold) with
trail. Right: Omega_p vs omega_s curve.

## Citations

- Marion and Thornton, Classical Dynamics 5e Ch. 11 (`marion-thornton`).
- Goldstein, Classical Mechanics Ch. 5 (alternate Lagrangian treatment).

## Stretch goals

- Full Euler-equation nutation (theta wobble).
- Gravitational versus torque-free precession.
- Coupled gyroscopes (gimbal mount).

## Risk register

- Leading-order model breaks down at low spin. Slider lower bound at 10.
