---
title: Kuramoto Oscillators and Synchronization
slug: coupled-kuramoto-oscillators
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
hook: 'A crowd of oscillators each ticking at its own rate suddenly locks into one rhythm once the coupling crosses a critical strength.'
one_paragraph: 'The Kuramoto model is the canonical model of spontaneous synchronization: N oscillators with spread-out natural frequencies, each nudged toward the average phase with coupling strength K. Below a critical K they drift incoherently and the order parameter stays near zero; above it a macroscopic fraction locks to a common frequency and the order parameter jumps up. The playground evolves the phases on a circle and plots the order parameter as you turn K, so the synchronization transition appears as the population condensing into one rotating arc. This is the math behind firefly flashing, neural rhythms, and power-grid stability. Reference: Strogatz, Sync; Kuramoto 1975.'
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
---

# Kuramoto oscillators and synchronization

## Explainer

### What you are looking at

A crowd of oscillators, each ticking at its own natural rate, weakly
pulled toward the group. Below a coupling threshold they drift
independently (noise). Above it they suddenly snap into lockstep. This
is the Kuramoto model, the canonical explanation for spontaneous
synchronization: fireflies flashing together, pacemaker cells, clapping
audiences, power grids.

### The model

Each oscillator $i$ has a phase $\theta_i$ and an intrinsic frequency
$\omega_i$ (drawn from a Lorentzian of width $\gamma$). It is nudged by
the sine of its phase difference with every other:

$$\dot\theta_i = \omega_i
  + \frac{K}{N}\sum_{j}\sin(\theta_j - \theta_i).$$

Coherence is measured by the order parameter

$$r\,e^{i\psi} = \frac1N\sum_j e^{i\theta_j},
  \qquad 0 \le r \le 1,$$

where $r = 0$ means total disorder and $r = 1$ means perfect
synchrony. Using $r$ and the mean phase $\psi$, the coupling rewrites
cleanly as $\dot\theta_i = \omega_i + K r\sin(\psi - \theta_i)$: every
oscillator feels the mean field, with a pull proportional to the
current coherence $r$ itself.

### The synchronization transition

That self-consistency ($r$ drives the coupling, the coupling sets $r$)
produces a sharp phase transition at a critical coupling $K_c$
proportional to the frequency spread $\gamma$. Below $K_c$ the only
solution is $r = 0$ (incoherence). Above $K_c$ a synchronized cluster
nucleates and $r$ grows continuously from zero, exactly like an order
parameter in a second-order phase transition. The playground sweeps
$K$ so you watch $r$ jump from near zero to near one as the population
locks.

### Things to try

- Set $K$ low and watch the phases smear uniformly, $r \approx 0$.
- Raise $K$ through $K_c$ and watch a synchronized arc form, $r$
  climbing toward 1.
- Widen the frequency spread $\gamma$ and see $K_c$ rise: more diverse
  oscillators are harder to synchronize.

### Where this comes from

The Kuramoto model, the order parameter, the mean-field reduction, and
the synchronization transition follow Strogatz, *Nonlinear Dynamics and
Chaos*, 2nd ed. (synchronization), after Kuramoto (1975).

## Physical setup

N = 128 phase oscillators with intrinsic frequencies omega_i drawn from a
Lorentzian distribution with half-width-at-half-maximum gamma. Each
oscillator couples globally to the mean phase with strength K:
  theta_i' = omega_i + (K / N) sum_j sin(theta_j - theta_i)

The order parameter r = |(1 / N) sum_j e^(i theta_j)| measures coherence:
r = 0 incoherent, r -> 1 fully synchronized.

## Governing equations

Above. The mean-field form theta_i' = omega_i + K r sin(psi - theta_i) is
used internally with r, psi recomputed each step.

## Numerical method

Forward Euler with dt = 0.04. The compute time per step is O(N).

## Controls

- K: coupling, 0 to 4.
- gamma: Lorentzian HWHM, 0.1 to 1.0. K_c = 2 gamma.
- speed: integrator steps per frame.
- Reset / Pause / Play.

## Expected qualitative features

1. K << K_c: oscillators scattered uniformly around the circle; r near 0.
2. K just above K_c: small synchronized cluster forms.
3. K >> K_c: large fraction of oscillators locked at common phase psi.
4. r(t) panel shows transient then steady-state value.

## Invariants and acceptance thresholds

1. r in [0, 1] at all times.
2. K = 0: r remains < 0.3 after long time.
3. K = 4, gamma = 0.5 (K_c = 1): r > 0.5 after long time.
4. K_c = 2 gamma exact.
5. N exported and reasonable.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- K = 0: pure incoherence; r ~ 1/sqrt(N) fluctuations only.
- K -> infinity: all oscillators lock at the same phase; r -> 1.

## Visual fallback

Canvas2D only. Left: unit circle with oscillator dots and order-parameter
arrow (length = r). Right: r(t) time series.

## Citations

- Kuramoto 1984 (`kuramoto1984`).
- Strogatz, Nonlinear Dynamics 2e Ch. 8.

## Stretch goals

- Non-Lorentzian distributions (uniform, bimodal).
- Network coupling instead of mean-field.
- Chimera states.

## Risk register

- Forward Euler can drift at very large K and small gamma; the
  combination is bounded by slider ranges.
