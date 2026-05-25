---
title: Damped, Driven Oscillator and Resonance
slug: damped-driven-oscillator
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
primary_citation: taylor-mech
supporting_ucs: [FIS2016, FIS1015]
curriculum_year: bsc-y1s1
hook: "Push a swing at just the right rhythm and small pushes build huge swings; push off-rhythm and almost nothing happens. That selectivity is resonance, and how sharp it is depends on one number: the damping."
one_paragraph: "A single mass on a spring with linear damping is driven by a sinusoidal force, x'' + 2 gamma x' + omega_0^2 x = F0 cos(omega t). After a transient the oscillator forgets its start and settles into a steady oscillation at the drive frequency, with an amplitude that peaks when the drive is tuned near the natural frequency omega_0. The top panel shows the live response x(t) against the drive; the bottom panel is the steady-state amplitude-versus-frequency curve with a cursor at the current drive frequency, so you watch the response grow as you approach the resonance peak. Light damping (high quality factor Q) makes that peak tall and narrow; heavy damping flattens it. The readout reports omega, gamma, Q and the resonant frequency. This is the physics behind tuning a radio and why marching troops break step on a bridge."
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

# Damped, driven oscillator and the resonance curve

## Explainer

### What you are looking at

A mass on a spring, with friction, pushed by a steady sinusoidal force.
Sweep the push frequency and the steady swing amplitude rises to a
sharp peak then falls away. That peak is resonance, the reason a swing
goes high when you push it in time and the reason bridges, glasses, and
circuits have frequencies you must not hit.

### The equation

Newton's law for the displacement $x$ gives a driven, damped
oscillator:

$$\ddot x + 2\gamma\,\dot x + \omega_0^2\,x = F_0\cos(\omega t).$$

The terms are: $\omega_0^2 x$ the spring restoring force (natural
frequency $\omega_0$), $2\gamma\dot x$ the friction (damping rate
$\gamma$), and $F_0\cos(\omega t)$ the external push at frequency
$\omega$.

### The steady-state response

After transients die, the mass oscillates at the *drive* frequency
$\omega$, not its own, with amplitude

$$A(\omega) = \frac{F_0}
  {\sqrt{(\omega_0^2 - \omega^2)^2 + (2\gamma\omega)^2}},$$

and it lags the force by

$$\varphi(\omega) = \operatorname{atan2}\!\big(2\gamma\omega,\;
  \omega_0^2 - \omega^2\big).$$

When the drive is slow the mass moves with the force (small lag). Near
$\omega_0$ the denominator of $A$ gets small and the amplitude spikes.
Well above $\omega_0$ the mass cannot keep up and lags by half a cycle.

### Resonance and the quality factor

The amplitude peak is not exactly at $\omega_0$ but slightly below, at

$$\omega_r = \omega_0\sqrt{1 - 2(\gamma/\omega_0)^2},$$

and the sharpness of the peak is set by the quality factor

$$Q = \frac{\omega_0}{2\gamma}.$$

High $Q$ (weak damping) gives a tall, narrow resonance that rings for
a long time; low $Q$ gives a broad, flat hump. The playground draws
$A(\omega)$ and $\varphi(\omega)$ live as you change $\gamma$, so you
watch the peak sharpen and the phase flip through $90^\circ$ at
resonance.

### Things to try

- Lower the damping and watch the resonance peak grow tall and narrow
  (high $Q$).
- Drive exactly at $\omega_0$ and note the response lags the force by
  a quarter cycle ($90^\circ$).
- Drive far above $\omega_0$ and see the amplitude collapse with a
  half-cycle lag.

### Where this comes from

The driven-damped equation, the amplitude and phase response, the
resonance frequency, and the quality factor follow Marion and
Thornton, *Classical Dynamics of Particles and Systems*, Chapter 3,
and Strogatz, *Nonlinear Dynamics and Chaos*, 2nd ed., Chapter 7.

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
- Marion and Thornton, Classical Dynamics Ch. 3.

## Stretch goals

- Phase Lissajous (x vs F_drive over one period).
- Bode-plot complement (phase curve).
- Beating before steady state visible at startup.

## Risk register

- Driving force depends on absolute time; if reset incorrectly the phase
  jumps. rebuild() resets sim.t to 0.
