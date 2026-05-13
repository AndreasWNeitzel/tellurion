---
title: Kuramoto Oscillators and Synchronization
slug: coupled-kuramoto-oscillators
status: verified
audience: portfolio
created: 2026-05-13
---

# Kuramoto oscillators and synchronization

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
