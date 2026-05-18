---
title: Kapitza Inverted Pendulum
slug: inverted-pendulum-kapitza
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
hook: "A pendulum hangs down because down is stable. Shake its pivot up and down fast enough and a second stable position appears, straight up: the pendulum stands on end and stays there, balanced by nothing but the vibration."
one_paragraph: "An ordinary pendulum has one stable equilibrium (hanging down) and one unstable one (inverted). Kapitza showed that driving the pivot vertically at high frequency adds, after averaging over the fast shaking, an effective potential that can turn the inverted position into a genuine stable minimum. The condition is a^2 omega^2 / (2 g l) > 1, with a and omega the drive amplitude and frequency: above that threshold the bob, given a small kick, only jitters about straight-up instead of toppling. The left panel shows the driven pendulum sitting inverted and trembling; the right panel plots the effective potential U_eff(theta) with its minimum at theta = 0, and the readout prints the stability number and flags STABLE when it exceeds 1. Drop the drive below threshold and the inverted state collapses. This vibrational stabilization is the same idea behind Paul ion traps and some feedback-free control schemes."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Kapitza inverted pendulum

## Explainer

### What you are looking at

A pendulum normally hangs down; balanced upside down it falls over at
the slightest nudge. But shake the pivot up and down fast enough and
the upside-down position becomes stable: the pendulum stands on end and
stays there, returning if you push it. This is the Kapitza pendulum,
and it is the principle behind ion traps and vibration-stabilized
systems.

### The equation of motion

With the pivot driven vertically as $y_p(t) = a\cos(\omega t)$, the
angle $\theta$ from the straight-up position obeys

$$\ddot\theta = \frac{g - a\,\omega^2 \cos(\omega t)}{l}\,\sin\theta.$$

The $g$ term is ordinary gravity, which by itself makes the inverted
state ($\theta = 0$ up) unstable. The $a\omega^2\cos(\omega t)$ term is
the shaking. It averages to zero, so intuitively it should do nothing,
yet it changes everything.

### Why fast shaking creates stability

Split the motion into a slow lean plus a tiny fast wiggle at the drive
frequency. Averaging over the fast wiggle leaves the slow angle moving
in an *effective* potential with an extra term from the shaking. That
extra term creates a minimum at $\theta = 0$ (straight up) provided the
shaking is strong enough. The condition is the Kapitza criterion:

$$a^2 \omega^2 > 2\,g\,l.$$

Above it, the upright position is a genuine stable equilibrium and the
pendulum oscillates about vertical. Below it, gravity wins and it
topples as usual. The playground lets you cross that threshold and
watch the upside-down pendulum snap from unstable to stable.

### Things to try

- Start below the criterion and watch the inverted pendulum fall.
- Raise the drive amplitude or frequency past $a^2\omega^2 = 2gl$ and
  watch it lock upright, wiggling slightly but not falling.
- Push the stabilized pendulum and watch it return: it is a real
  potential well now.

### Where this comes from

The driven equation of motion, the slow-plus-fast averaging, the
effective potential, and the $a^2\omega^2 > 2gl$ stability criterion
follow Landau and Lifshitz, *Mechanics*, 3rd ed., Section 30, and the
original analysis by Kapitza (1951).

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
