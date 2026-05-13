---
title: Kapitza Inverted Pendulum
slug: inverted-pendulum-kapitza
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
---

# Kapitza inverted pendulum

## Physical setup

Rigid pendulum of length l = 1 with pivot driven vertically at
y_p(t) = a cos(omega t). In the inertial frame the equation of motion
about the upside-down equilibrium (theta = 0 = up) is
  theta'' = ((g - a omega^2 cos(omega t)) / l) sin(theta)

Above the Kapitza criterion a^2 omega^2 > 2 g l, the upside-down
equilibrium is stable. Below it, the natural instability dominates.

## Numerical method

Fourth-order Runge-Kutta with dt = 0.0005 (small to resolve the
high-frequency drive).

## Controls

- a: drive amplitude, 0.02 to 0.20 m.
- omega: drive frequency, 10 to 100 rad/s.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Below criterion (a^2 omega^2 < 2 g l): pendulum falls quickly.
2. Above criterion: pendulum stays upside-down with small wobble.
3. Effective potential develops a local minimum at theta = 0 above
   criterion.

## Invariants and acceptance thresholds

1. Stability criterion formula.
2. Ratio formula a^2 omega^2 / (2 g l).
3. Above stability: |theta| < 0.3 over 5 s.
4. Below stability: |theta| > 1 within 5 s.
5. Effective-potential min at theta = 0 when stable.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- a = 0: pure inverted pendulum, falls.
- omega large enough: stabilization works at vanishing a.

## Visual fallback

Canvas2D only. Left: mechanical scene with vertically driven pivot and
pendulum trail. Right: effective potential U_eff(theta) with current
theta marker.

## Citations

- Landau and Lifshitz, Mechanics 3e Sec. 30 (`landau-lifshitz-mechanics`).
- Kapitza 1951.

## Stretch goals

- Mathieu equation overlay (linearized stability diagram).
- Damped Kapitza (limit-cycle entrainment).
- Acoustic levitation analog.

## Risk register

- dt = 0.0005 chosen to resolve omega up to 100; smaller dt needed for
  omega beyond slider range.
