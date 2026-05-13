---
title: Pendulum on a Moving Cart
slug: pendulum-on-moving-cart
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
---

# Pendulum on a moving cart

## Physical setup

Frictionless cart of mass M = 2 on a horizontal rail, with a rigid
pendulum of length L = 1 and bob mass m = 0.5 hanging from a pivot on
top. Gravity g = 9.81. Two-degree-of-freedom system, no external
horizontal forces.

## Governing equations

Lagrangian:
  T = (1/2)(M + m) x'^2 + (1/2) m L^2 theta'^2 + m L cos(theta) x' theta'
  V = -m g L cos(theta)
Euler-Lagrange gives the coupled second-order system solved at each step
by a 2 x 2 linear solve for [x'', theta''].

## Numerical method

Fourth-order Runge-Kutta, dt = 0.005.

## Controls

- theta_0: initial pendulum angle, -1.4 to 1.4 rad.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Pendulum swings; cart slides to keep total p_x constant.
2. Energy bounded by RK4 truncation.
3. For small theta_0 the period is close to the simple pendulum with
   effective gravity g_eff = g (M + m) / M.
4. Bob trail traces a Lissajous-like pattern.

## Invariants and acceptance thresholds

1. |delta E / E_0| < 1e-3 over 10^4 RK4 steps.
2. Horizontal momentum |delta p| < 1e-8 over 5000 steps.
3. Theta bounded for moderate IC.
4. Equilibrium is a fixed point.
5. Small-angle period finite and reasonable.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- M -> infinity: cart doesn't move; pendulum is a simple pendulum.
- theta_0 = 0, v_0 = 0: system at rest forever.

## Visual fallback

Canvas2D only. Top: cart on rail with pendulum and bob trail. Bottom:
phase portrait (x_cart, theta).

## Citations

- Marion and Thornton, Classical Dynamics 5e Ch. 7 (`marion-thornton`).
- Goldstein, Classical Mechanics Ch. 8 (alternate Lagrangian treatment).

## Stretch goals

- Inverted-pendulum stabilization (cart accel as control input).
- Double cart-pendulum.
- Animated energy bars (KE vs PE swap).

## Risk register

- For very large theta_0 the pendulum can swing over the top; sliders
  cap at +/- 1.4 rad to keep the integrator stable.
