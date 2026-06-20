---
title: Pendulum on a Moving Cart
slug: pendulum-on-moving-cart
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
primary_citation: taylor-mech
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
hook: "Hang a pendulum from a cart that is free to roll. Swing the pendulum and the cart slides the other way: with no outside push the centre of mass cannot move, so the two trade momentum back and forth."
one_paragraph: "A pendulum hangs from a cart that rolls without friction on a horizontal rail, a coupled two-degree-of-freedom system. With no external horizontal force the total horizontal momentum is conserved (zero here), so every time the bob swings one way the cart recoils the other and the centre of mass stays put. The swing and the cart recoil are coupled through the rod, and because the rod forces are internal the center of mass holds a fixed vertical line; the diagnostic plots the cart and bob horizontal positions against time as mirror images about that constant level. The readout tracks the angle, the cart and bob positions, and the conserved p_x (which stays at zero to machine precision). A heavy cart barely recoils; a light cart does most of the moving. This is the same momentum bookkeeping as a person walking on a free raft or a rocket recoiling from its exhaust."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "Taylor, Classical Mechanics."
---

# Pendulum on a moving cart

## Explainer

### What you are looking at

Hang a pendulum from a cart that is free to roll, and the two move
together: the swinging bob shoves the cart back and forth, and the
cart's recoil changes how the bob swings. The playground shows this
coupled dance and the conserved quantities that govern it, a textbook
two-degree-of-freedom system.

### Two coupled coordinates

The state is the cart position $x$ and the pendulum angle $\theta$.
There is no external horizontal force, so the total horizontal
momentum is conserved: if the system starts at rest the centre of
mass never moves horizontally, the cart always recoils opposite the
bob. The equations of motion, from the Lagrangian
$L = \tfrac12(M+m)\dot x^2 + m\,\ell\,\dot x\dot\theta\cos\theta
+ \tfrac12 m\ell^2\dot\theta^2 + m g\ell\cos\theta$, are

$$(M+m)\ddot x + m\ell\big(\ddot\theta\cos\theta
  - \dot\theta^2\sin\theta\big) = 0,$$

$$\ell\ddot\theta + \ddot x\cos\theta + g\sin\theta = 0.$$

The cross term $m\ell\,\ddot x\cos\theta$ is the coupling: the cart's
acceleration acts like an effective gravity on the pendulum and vice
versa.

### Small oscillations and the mass ratio

For small swings this linearizes to a single oscillator with a
shifted frequency:

$$\omega = \sqrt{\frac{g}{\ell}\,\frac{M+m}{M}}.$$

A free cart makes the pendulum swing faster than the fixed-pivot
$\sqrt{g/\ell}$, and the lighter the cart the larger the effect (as
$M\to\infty$ the cart is immovable and the ordinary pendulum is
recovered; as $M\to0$ the frequency diverges). Energy is conserved
and continually trades between cart translation and pendulum
swing. This is the same physics as the recoil of a launcher and the
basis of the inverted-pendulum control problem. The playground sweeps
the mass ratio and length and shows the coupled motion, the conserved
momentum, and the energy exchange.

### Things to try

- Start the bob to one side and watch the cart recoil so the centre
  of mass stays fixed (momentum conservation).
- Make the cart very heavy and recover the ordinary
  $\sqrt{g/\ell}$ pendulum; make it light and watch the swing speed
  up.
- Watch energy slosh between cart kinetic energy and pendulum
  swing while the total stays constant.

### Where this comes from

The cart-pendulum Lagrangian, momentum conservation, and the
mass-ratio frequency shift follow Taylor, *Classical Mechanics*,
Chapter 11, and Goldstein, *Classical Mechanics*, Chapter 1.

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
- cart M: cart mass, 0.5 to 6 kg.
- bob m: bob mass, 0.2 to 3 kg.
- Reset / Pause / Play.

## Expected qualitative features

1. Pendulum swings; cart slides to keep total p_x constant.
2. Released from rest, the center of mass stays on a fixed vertical line;
   the diagnostic shows the cart and bob horizontal positions as mirror
   images about that constant center-of-mass level.
3. For small theta_0 the period is close to the simple pendulum with
   effective gravity g_eff = g (M + m) / M.
4. A light cart recoils far; a heavy cart barely moves. The cart and bob
   position amplitudes are in the ratio m : M.

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

Canvas2D only. Top: cart on rail with pendulum, bob trail, and the fixed
center-of-mass line. Bottom: cart and bob horizontal positions versus time,
straddling the constant center of mass.

## Citations

- Marion and Thornton, Classical Dynamics 5e Ch. 7.
- Goldstein, Classical Mechanics Ch. 8 (alternate Lagrangian treatment).

## Stretch goals

- Inverted-pendulum stabilization (cart accel as control input).
- Double cart-pendulum.
- Animated energy bars (KE vs PE swap).

## Risk register

- For very large theta_0 the pendulum can swing over the top; sliders
  cap at +/- 1.4 rad to keep the integrator stable.
