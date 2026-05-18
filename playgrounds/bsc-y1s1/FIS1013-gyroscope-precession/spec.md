---
title: Gyroscope Precession
slug: gyroscope-precession
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
hook: "A spinning top should fall over, but it does not: gravity's torque, instead of toppling it, swings its axis sideways in a slow circle. Spin it faster and it precesses slower. That is angular momentum refusing to point where the force pushes."
one_paragraph: "A fast-spinning gyroscope tilted from the vertical has a large spin angular momentum L along its axis. Gravity applies a torque tau = r x W (weight times the lever arm to the pivot) that points perpendicular to L, so instead of changing L's length it swings its direction: the axis sweeps a cone at the precession rate Omega_p = M g r / (I_s omega_s). Counter-intuitively, a faster spin gives a slower precession (the 1/omega_s curve in the side panel). The scene draws the spinning disc, the spin axis (L, gold), the weight (W, red), the gravitational torque (tau, green) and the cone the axis traces; the readout gives omega_s, the tilt, Omega_p and the precession period. This steady-precession picture (valid when the spin is fast compared with the precession) is why a bicycle stays up, how a gyrocompass finds north, and why bullets and footballs are spun."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
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
