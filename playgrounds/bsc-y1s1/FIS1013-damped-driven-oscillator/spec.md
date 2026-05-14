---
title: Damped, Driven Oscillator and Resonance
slug: damped-driven-oscillator
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2016, FIS1015]
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

# Damped, driven oscillator and the resonance curve

## Physical setup

A single mass on a spring with linear damping, driven sinusoidally:
  x'' + 2 gamma x' + omega_0^2 x = F_0 cos(omega t)

with omega_0 = F_0 = 1.

## Governing equations

Steady-state amplitude:
  A(omega) = F_0 / sqrt((omega_0^2 - omega^2)^2 + (2 gamma omega)^2)

Phase lag:
  phi(omega) = atan2(2 gamma omega, omega_0^2 - omega^2)

Quality factor: Q = omega_0 / (2 gamma).

Resonance frequency: omega_r = omega_0 sqrt(1 - 2 (gamma / omega_0)^2).

## Numerical method

Fourth-order Runge-Kutta integration of the second-order ODE.

## Controls

- omega: drive frequency, 0.2 to 2.5.
- gamma: damping, 0.02 to 0.4 (Q from 12.5 to 1.25).
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. omega far from omega_0: small response.
2. omega ~ omega_r: amplitude grows; phase lag near pi/2.
3. omega > omega_0: phase lag approaches pi (out of phase).
4. Small gamma (high Q): sharp narrow peak in the response curve.
5. Large gamma (low Q): broad blunt peak that shifts to lower omega.

## Invariants and acceptance thresholds

1. Resonance peak: omega_r exact analytic.
2. Q = omega_0 / (2 gamma) exact.
3. Static limit: A(0) = F_0 / omega_0^2 exact.
4. High-frequency limit: A -> F_0 / omega^2.
5. Numerical steady-state amplitude matches analytic within 5 percent at
   resonance (omega = 1, gamma = 0.1) after warmup.
6. Phase at omega = omega_0 equals pi / 2 exactly.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- gamma -> 0: ideal undamped resonator, response diverges at omega_0.
- gamma > omega_0 / sqrt(2): no resonance peak (overdamped curve).
- omega = 0: static deflection F_0 / omega_0^2.

## Visual fallback

Canvas2D only. Top: live trace x(t) (cyan) with drive (orange). Bottom:
analytic response curve A(omega) with a cursor at the current omega and
a dashed peak marker.

## Citations

- Strogatz, Nonlinear Dynamics and Chaos 2e Ch. 7.
- Marion and Thornton, Classical Dynamics Ch. 3 (`marion-thornton`).

## Stretch goals

- Phase Lissajous (x vs F_drive over one period).
- Bode-plot complement (phase curve).
- Beating before steady state visible at startup.

## Risk register

- Driving force depends on absolute time; if reset incorrectly the phase
  jumps. rebuild() resets sim.t to 0.
