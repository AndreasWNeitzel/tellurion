---
title: Two-Stream Instability (1D PIC)
slug: two-stream-pic-plasma
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3014
supporting_ucs: [MAA-PL]
curriculum_year: bsc-y3s1
---

# Two-stream instability via 1D-1V PIC

## Physical setup

Two counter-streaming electron beams at +/- v_0 against a uniform neutralizing ion background. Small density perturbations grow exponentially at the linear rate omega_p / (2 sqrt 2). The beams eventually form phase-space vortices and saturate.

## Governing equations

  m d^2 x_i / dt^2 = -e E(x_i, t)
  partial^2 phi / partial x^2 = -rho / epsilon_0
  E = -partial phi / partial x

Units: epsilon_0 = m = e = 1, omega_p = 1.

Linear growth rate (Krall-Trivelpiece 1973): gamma_max = omega_p / (2 sqrt 2) ~ 0.354.

## Numerical method

PIC scheme:
1. NGP charge deposit onto NGRID = 64 periodic grid.
2. Direct DFT inversion for Poisson: phi_hat[k] = rho_hat[k] / k^2.
3. Centered finite difference for E.
4. NGP interpolation; leapfrog particle push.

NPARTICLES = 2000, charge per particle = NGRID / NPARTICLES = 0.032.

## Controls

- v_0: beam speed, 0.5 - 2.0, default 1.0
- speed: PIC steps per render frame, 1 - 10, default 3
- Reset / Pause / Play

## Expected qualitative features

1. t = 0: two horizontal lines in (x, v) phase space.
2. t ~ 3: small mode-1 wiggle.
3. t ~ 5 - 7: phase-space vortices ("electron holes").
4. t > 10: holes merge; thermalization.

## Invariants and acceptance thresholds

- Mode 1 amplitude grows > 5x between t = 2 and t = 5.
- Total momentum drifts < 5 over 200 steps.
- Particles remain in [0, L) under periodic BC.
- Initial mode-1 amplitude < 20.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- v_0 -> 0: no streams; no instability.
- v_0 large: still unstable but kinetic effects.

## Visual fallback

Canvas2D only.

## Citations

- Hockney and Eastwood 1988, Computer Simulation Using Particles, Chapters 5 - 8 (`hockneyeastwood1988`).
- Krall and Trivelpiece 1973, Principles of Plasma Physics.
- Birdsall and Langdon 1985, Plasma Physics via Computer Simulation.

## Stretch goals

- CIC deposit to reduce noise.
- FFT instead of O(N^2) DFT.
- Bump-on-tail variant.

## Risk register

- Numerical heating: NGP + leapfrog drifts particle KE up slowly.
- O(N^2) DFT at NGRID = 64 is fine; would need a real FFT at larger NGRID.
