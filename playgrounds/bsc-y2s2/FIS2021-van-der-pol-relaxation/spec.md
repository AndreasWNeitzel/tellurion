---
title: "Van der Pol: Limit Cycle to Relaxation Oscillator"
slug: van-der-pol-relaxation
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: [FIS1013]
curriculum_year: bsc-y2s2
hook: 'Add damping that is negative for small swings and positive for large ones and any start spirals onto the same loop; crank it up and the loop becomes a jerky relaxation tick.'
one_paragraph: 'The Van der Pol oscillator has nonlinear damping that pumps energy in when the amplitude is small and drains it when large, so every trajectory converges onto a single self-sustained limit cycle no matter how it starts. For small mu the cycle is nearly sinusoidal; as mu grows it deforms into a relaxation oscillation, slow charging punctuated by fast jumps, like a heartbeat or a flashing neon tube. The playground shows the phase portrait and the waveform as you sweep mu from harmonic to strongly relaxational. It is the textbook self-oscillator. Reference: Strogatz, Nonlinear Dynamics and Chaos, Ch. 7.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Van der Pol: limit cycle to relaxation oscillator

## Physical setup

The Van der Pol equation:
  x'' - mu (1 - x^2) x' + x = 0

with mu a positive damping parameter. For mu = 0 it reduces to a harmonic
oscillator. For mu > 0 the nonlinear term acts like positive damping when
|x| > 1 and negative damping when |x| < 1; the result is a unique stable
limit cycle attracting all non-trivial initial conditions.

## Governing equations

Above. As a first-order system:
  x' = v
  v' = mu (1 - x^2) v - x

## Numerical method

Fourth-order Runge-Kutta, dt = 0.01.

## Controls

- mu: nonlinearity parameter, 0 to 8.
- speed: integrator steps per frame.
- Reset / Pause / Play.

## Expected qualitative features

1. mu = 0: pure harmonic oscillator; phase orbit is a circle.
2. mu = 1: near-circular limit cycle with peak |x| approx 2.
3. mu = 4-8: pronounced relaxation oscillation; phase orbit becomes
   D-shaped; time series shows slow drift followed by sudden jumps.
4. Asymptotic period for large mu: T approx (3 - 2 ln 2) mu approx 1.614 mu.

## Invariants and acceptance thresholds

1. Limit cycle is unique: different ICs converge to the same peak |x|
   within 5 percent.
2. Peak |x| approaches 2 for moderate mu.
3. mu = 0 gives pure SHO with period 2 pi.
4. Asymptotic relaxation period formula exact in symbolic form.
5. Measured period at mu = 10 within 25 percent of leading-order
   asymptotic.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- mu -> 0: harmonic oscillator.
- mu -> infinity: relaxation oscillation with T proportional to mu.

## Visual fallback

Canvas2D only. Left: phase portrait (x, v). Right: time series x(t).

## Citations

- Strogatz, Nonlinear Dynamics and Chaos 2e Ch. 7.
- van der Pol 1926, Phil. Mag.

## Stretch goals

- Forced Van der Pol (entrainment regions).
- Coupled Van der Pol oscillators (synchrony).

## Risk register

- Very large mu (>10) requires smaller dt for stability; slider capped at 8.
