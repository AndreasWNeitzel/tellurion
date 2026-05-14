---
title: Foucault Pendulum and Coriolis Precession
slug: foucault-pendulum
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: []
curriculum_year: bsc-y1s1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Foucault pendulum: Coriolis precession

## Physical setup

A small-amplitude pendulum suspended over a point on a rotating Earth at
latitude phi. In the horizontal (x, y) frame at that point, the Coriolis
acceleration has a vertical component omega_z = Omega sin(phi). The
linearized equations of motion are
  x'' = -omega_0^2 x + 2 omega_z y'
  y'' = -omega_0^2 y - 2 omega_z x'.

The pendulum still oscillates at omega_0 = sqrt(g / L) but the plane of
oscillation slowly precesses at -omega_z.

## Governing equations

Above. Time is scaled so that T_reference (precession period at the pole)
is 24 seconds rather than 24 hours, for visibility.

## Numerical method

Fourth-order Runge-Kutta with dt = 0.02. Pendulum period T_0 = 2 pi.

## Controls

- latitude: -90 to +90 degrees.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. latitude = 90 deg (pole): precession period equals T_reference = 24 s.
2. latitude = 45 deg: precession period 24 / sin(45) approx 33.9 s.
3. latitude = 0 (equator): no precession; swing stays along x-axis.
4. negative latitude (southern hemisphere): rotation reverses.
5. Trace forms a rosette / Spirograph pattern.

## Invariants and acceptance thresholds

1. Energy bounded: |delta E / E_0| < 1e-3 over 5000 RK4 steps.
2. Precession period = T_reference / sin(lat) exact.
3. omega_z = 0 at equator.
4. Pole precession period equals T_reference.
5. Hemisphere sign flip: omega_z(lat) = -omega_z(-lat).
6. Swing plane actually rotates: max |y| > 0.5 within a quarter precession
   at the pole.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Equator: no precession.
- Pole: maximum precession rate.
- omega_z = 0: trajectory is pure SHO along x.

## Visual fallback

Canvas2D only. Center: rosette trace of the pendulum bob. Dashed line:
initial swing axis. Current bob position highlighted in warm orange.

## Citations

- Marion and Thornton, Classical Dynamics 5e Ch. 10 (`marion-thornton`).
- Foucault 1851, Comptes Rendus.

## Stretch goals

- Latitude-varying realistic Omega (Earth = 7.27 x 10^-5 rad/s).
- Friction and gravitational restoring force in 3D.
- Side-by-side at multiple latitudes.

## Risk register

- Linearized EOM assumes small amplitude. Slider amplitude is hard-coded
  at x_0 = 1.0.
- At very long times, energy drift from RK4 can shrink the swing amplitude.
  Trail size capped to keep the figure crisp.
