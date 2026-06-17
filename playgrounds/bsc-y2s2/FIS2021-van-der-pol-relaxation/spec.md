---
title: "Van der Pol: Limit Cycle to Relaxation Oscillator"
slug: van-der-pol-relaxation
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
primary_citation: strogatz2015
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
  - "Griffiths, Introduction to Quantum Mechanics, Third ed."
---

# Van der Pol: limit cycle to relaxation oscillator

## Explainer

### What you are looking at

An oscillator that pumps itself. When its swing is small a built-in
negative damping feeds energy in; when the swing is large the damping
turns positive and bleeds energy out. The result: every starting
condition spirals onto the *same* loop and stays there. Turn one knob
up and that smooth loop becomes a jerky stop-go tick, the relaxation
oscillation behind heartbeats and blinking circuits.

### The equation

$$\ddot x - \mu\,(1 - x^2)\,\dot x + x = 0.$$

Look at the damping coefficient $-\mu(1 - x^2)$: for $|x| < 1$ it is
negative (anti-damping, energy in); for $|x| > 1$ it is positive
(energy out). As the first-order system
$\dot x = v,\ \dot v = \mu(1 - x^2)v - x$.

### Why a unique limit cycle

Because energy is injected at small amplitude and removed at large
amplitude, there is exactly one amplitude where injection balances
removal over a cycle. That closed orbit is a stable limit cycle: start
inside it and you spiral out to it, start outside and you spiral in.
The motion is self-sustained, requiring no external drive, and
forgetting the initial condition entirely. This is the defining
behavior of self-oscillators (clocks, lasers, pacemaker cells).

### From sine to relaxation

The single parameter $\mu$ sets the character:

- $\mu \to 0$: the term vanishes and the system is a plain harmonic
  oscillator; the limit cycle is a near-perfect circle, motion nearly
  sinusoidal.
- $\mu \gg 1$: the dynamics splits into slow charging followed by fast
  jumps, a relaxation oscillation, with period growing roughly as
  $\mu$. The phase portrait becomes a sharp, distorted loop.

The playground sweeps $\mu$ so you watch the circle deform into the
stop-go relaxation cycle.

### Things to try

- Start several different initial conditions and watch them all land
  on the same limit cycle.
- Set $\mu$ small for a near-sinusoid; raise it for the jerky
  relaxation waveform.
- Note nothing drives it: the oscillation is self-sustained.

### Where this comes from

The Van der Pol equation, the unique stable limit cycle, and the
relaxation-oscillation limit follow Strogatz, *Nonlinear Dynamics and
Chaos*, 2nd ed., Chapter 7, after van der Pol (1926).

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
