---
title: Projectile Motion with Air Drag
slug: projectile-with-air-drag
status: verified
audience: portfolio
created: 2026-05-13
---

# Projectile motion with air drag

## Physical setup

Three projectiles of equal mass m = 1 kg fired simultaneously at the same
speed v_0 and angle theta. Drag laws:
1. None (vacuum).
2. Stokes (linear): F_drag = -b v, b = 0.20.
3. Quadratic (Newton): F_drag = -c |v| v, c = 0.012.

Gravity g = 9.81 m / s^2.

## Governing equations

m a = -m g y-hat + F_drag

For Stokes: closed-form x(t), y(t) in terms of exp. For quadratic, no
closed form; integrate numerically.

## Numerical method

Fourth-order Runge-Kutta, dt = 0.01.

## Controls

- v_0: launch speed, 5 to 40 m/s.
- angle: launch angle, 10 to 80 degrees.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Vacuum: parabolic trajectory; range = v_0^2 sin(2 theta) / g.
2. Stokes drag: shorter range, asymmetric arc with longer descent than ascent.
3. Quadratic drag: even shorter range at high v_0 (drag scales as v^2).
4. At low speeds: Stokes and vacuum nearly coincide.
5. 45 degrees maximizes vacuum range; with drag the optimal angle is below 45.

## Invariants and acceptance thresholds

1. Vacuum range = v_0^2 sin(2 theta) / g within 1 percent.
2. Drag reduces range below vacuum.
3. Stokes terminal velocity = m g / b. Reached from rest within 5 percent.
4. Quadratic terminal velocity = sqrt(m g / c).
5. 45 degrees maximizes vacuum range.
6. Peak height = v_0^2 sin^2(theta) / (2 g) exact.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Zero drag: parabolic trajectory.
- Very high v: quadratic drag dominates.
- 90 degrees: vertical drop (no horizontal motion).

## Visual fallback

Canvas2D only. Three colored trajectories on common axes; current positions
shown as dots; ground line and legend.

## Citations

- Marion and Thornton, Classical Dynamics 5e Ch. 2 (`marion-thornton`).
- Adair 1990, The Physics of Baseball (`adair1990`).

## Stretch goals

- Magnus / spin lift (curveball, see magnus-effect-spinning-ball entry).
- Wind (constant horizontal drag offset).
- Variable air density vs altitude.

## Risk register

- Quadratic drag with high v_0 can produce very steep numerical gradients
  near launch; dt = 0.01 is conservative enough.
