---
title: Magnus Effect on a Spinning Ball
slug: magnus-effect-spinning-ball
status: verified
audience: portfolio
created: 2026-05-13
---

# Magnus effect on a spinning ball

## Physical setup

A baseball-like ball (m = 0.15 kg) launched with initial speed v_0 and
angle, subject to gravity, quadratic drag, and Magnus lift due to spin.
Convention: positive spin = top-spin (ball rotates in direction of
flight; Magnus force pushes down). Negative spin = back-spin (Magnus
force pushes up).

## Governing equations

  d v / dt = -g y-hat - (c_drag |v|) v / m + (c_mag * spin)(vy, -vx) / m

with c_drag = 0.005, c_mag = 0.0003, g = 9.81.

## Numerical method

Fourth-order Runge-Kutta with dt = 0.01.

## Controls

- v_0: launch speed, 10 to 40 m/s.
- angle: launch angle, 5 to 60 degrees.
- spin: -100 (back-spin) to +100 (top-spin).
- Reset / Pause / Play.

## Expected qualitative features

1. spin = 0: parabolic-like trajectory (with drag asymmetry).
2. spin > 0 (top-spin): shorter range, trajectory curls downward.
3. spin < 0 (back-spin): longer range, trajectory floats.
4. At fixed angle, the trajectory continues until it lands.

## Invariants and acceptance thresholds

1. Positive spin shortens range vs spin = 0.
2. Negative spin extends range vs spin = 0.
3. Zero-spin peak is between 30 and 70 percent of range.
4. Spin sign produces nonzero range difference.
5. Trajectory lands at y = 0 (within 0.1).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- No drag, no spin: pure parabola.
- Very high spin: trajectory hooks dramatically.

## Visual fallback

Canvas2D only. Three trajectories on common axes: no-spin (dashed
yellow), opposite-spin (cyan), current-spin (orange) with animated
ball.

## Citations

- Adair 1990, The Physics of Baseball (`adair1990`).
- Jackson, Classical Electrodynamics Ch. 12.

## Stretch goals

- Tennis serve trajectories.
- Soccer free kicks (lateral Magnus).
- 3D extension with full angular velocity vector.

## Risk register

- c_drag and c_mag are tuned for visual effect, not measured. Behaviors
  are qualitatively correct.
