---
title: Driven Damped Duffing Oscillator
slug: duffing-oscillator
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: [FIS1013]
curriculum_year: bsc-y2s2
hook: 'Drive a particle in a double well harder and harder and its steady rhythm splits, splits again, then shatters into chaos, all from one knob.'
one_paragraph: 'The driven damped Duffing oscillator, a mass in a double-well potential with friction and a periodic push, is the textbook route to chaos. As the drive amplitude rises the periodic response undergoes a period-doubling cascade (period 1, 2, 4, ...) and then becomes chaotic, while a Poincare section sampled once per drive cycle turns from a few dots into a fractal strange attractor. The playground integrates the trajectory and builds the stroboscopic Poincare section as you change the drive, so the cascade and the strange attractor emerge live. It is one of the cleanest demonstrations of deterministic chaos. Reference: Strogatz, Nonlinear Dynamics and Chaos, Ch. 12.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Driven damped Duffing oscillator

## Physical setup

A particle in a symmetric double-well potential V(x) = -x^2/2 + x^4/4, subject to linear damping and a periodic external drive. The Duffing equation is the textbook system that exhibits a complete period-doubling cascade to chaos under a single control parameter (the drive amplitude gamma). It is also one of the cleanest examples for visualizing a Poincare stroboscopic section.

## Governing equations

  x'' + delta x' - x + x^3 = gamma cos(omega t)

First-order form with y = (x, v):

  dx/dt = v
  dv/dt = x - x^3 - delta v + gamma cos(omega t)

## Numerical method

Classical RK4 from `shared/js/engine/ode-rk.js`, fixed step dt = T/200 with T = 2 pi / omega. Stroboscopic sampling: one point per drive period in the phase portrait, and in the bifurcation diagram.

## Controls

- delta: damping, slider 0.05 - 0.6, default 0.3
- gamma: drive amplitude, slider 0.0 - 0.8, default 0.5
- omega: drive angular frequency, slider 0.6 - 2.0, default 1.2
- speed: integration steps per render frame, 0.1 - 2.0, default 0.6

The bifurcation diagram refreshes when delta or omega changes; the gamma slider rapidly re-anchors the integrator and shows the current vertical line in the bifurcation diagram.

## Expected qualitative features

1. At gamma = 0 the particle settles in one of the two wells.
2. Small gamma yields period-1 oscillation; the strobe places a single dot in the phase portrait.
3. Increasing gamma triggers a period-doubling cascade: 1 dot -> 2 -> 4 -> chaotic cloud.
4. The bifurcation diagram resolves the cascade as gamma sweeps the horizontal axis from 0.20 to 0.70.

## Invariants and acceptance thresholds

- Undriven, undamped Duffing (delta = gamma = 0): conserves H = v^2/2 - x^2/2 + x^4/4 to within 5e-3 over 4000 RK4 steps at dt = 0.01.
- Weak-drive (delta = 0.5, gamma = 0.05): strobed x converges to a single point with sigma_x < 0.02 across 30 cycles.
- Classical chaos (delta = 0.3, gamma = 0.5, omega = 1.2): strobed points occupy at least 6 of 16 bins in [-1.6, 1.6].

All three confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- delta = 0, gamma = 0: integrable, energy conservation provides the gold-standard regression.
- omega -> 0 (DC limit): system becomes a static double well plus a slow gamma forcing.
- gamma above the snap-back threshold (around 0.65 at default omega, delta): chaotic attractor extends across both wells.

## Visual fallback

Canvas2D only; no fallback needed.

## Citations

- Strogatz 2024, Nonlinear Dynamics and Chaos, 2e, Section 12.5 (`strogatz2024`).
- Ott 2002, Chaos in Dynamical Systems, 2e, Section 7.2 (`ott2002`).
- Guckenheimer and Holmes 1983, Nonlinear Oscillations, Dynamical Systems, and Bifurcations of Vector Fields, Section 2.2 (background only).

## Stretch goals

- Lyapunov exponent overlay on the bifurcation diagram.
- Replace the strobe-color band with a basin-of-attraction colour-coding inset.

## Risk register

- Long warmup (~ 180 cycles) needed before sampling the strobe to avoid transient contamination.
- The bifurcation diagram rebuild is 220 columns * 45 cycles ~ 2 s; the playground caches it per (delta, omega) pair and updates only on those slider changes.
