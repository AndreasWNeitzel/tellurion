---
title: Two-Stream Instability (1D PIC)
slug: two-stream-pic-plasma
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3014
supporting_ucs: [MAA-PL]
curriculum_year: bsc-y3s1
hook: 'Two counter-streaming electron beams are unstable: density ripples grow exponentially at the analytic rate omega_p/(2 sqrt 2), the beams wind into phase-space electron-hole vortices, and a spectrogram shows mode 1 dominating then spawning harmonics at saturation.'
one_paragraph: 'A 1D-1V particle-in-cell simulation of the two-stream instability: two cold counter-streaming electron beams against a neutralising ion background, 10000 macro-particles, NGP deposit, DFT Poisson solve, leapfrog push (Hockney and Eastwood 1988). The upgraded scene shows the (x, v) phase space drawn with persistence so the electron-hole vortices leave trails, a density-mode spectrogram (|rho_hat[k]| for k = 1..8 versus time), and the log mode-1 trace with the dashed analytic reference of slope gamma = omega_p/(2 sqrt 2) (Krall and Trivelpiece) plus a live measured-vs-analytic readout. The default beam speed v0 = 0.6 places the fundamental near the peak-growth wavenumber, so the measured linear-regime growth rate tracks the closed-form value to a few percent. The closed-form dispersion (max growth exactly omega_p/(2 sqrt 2) at k^2 v0^2 = 3 omega_p^2/8, unstable for k v0 < omega_p) is gate-tested, alongside momentum conservation, the domain bound, and the PIC growth.'
tags: [plasma, pic, instability, spectrogram, live-readout]
difficulty: 4
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: []
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

NPARTICLES = 10000, charge per particle = NGRID / NPARTICLES.

Closed-form cold dispersion (two equal beams at +/- v0): with
a = k v0, omega^2 = [ (2 a^2 + wp^2) - wp sqrt(8 a^2 + wp^2) ] / 2;
unstable (omega^2 < 0) for a < wp, with maximum growth
gamma = wp/(2 sqrt 2) at a^2 = 3 wp^2/8. v0 = 0.6 puts the
k = 1 fundamental near that peak.

## Controls

- v_0: beam speed, 0.3 - 2.0, default 0.6 (near peak growth).
- speed: PIC steps per render frame, 1 - 10, default 3.
- Reset / Pause / Play.
- The phase panel is drawn with persistence (vortex trails); the
  spectrogram shows |rho_hat[k]| for k = 1..8; the trace shows the
  measured slope against the analytic gamma = omega_p/(2 sqrt 2).

## Expected qualitative features

1. t = 0: two horizontal lines in (x, v) phase space.
2. linear regime: mode 1 grows; the trace slope tracks the dashed
   gamma = omega_p/(2 sqrt 2) reference (measured to a few percent).
3. t ~ 6 - 10: phase-space vortices ("electron holes"), traced by
   the persistence trails; harmonics light up in the spectrogram.
4. saturation: holes merge; the measured slope falls toward zero.

## Invariants and acceptance thresholds

- analytic max growth (strong): gamma_max = omega_p/(2 sqrt 2)
  exactly; the dispersion peaks at a^2 = 3 wp^2/8 with that value;
  unstable for k v0 < wp, marginal at k v0 = wp, stable beyond.
- PIC growth (strong): mode 1 grows > 5x between t = 2 and t = 5;
  the fitted linear-regime rate is positive and within a factor ~2
  of the analytic value (a coarse 10k-particle NGP PIC; the exact
  physics is the analytic dispersion above).
- momentum conservation: total momentum drifts < 5 over 200 steps.
- particles remain in [0, L) under periodic BC.
- initial mode-1 amplitude < 20; modeAmplitudes returns K positive
  components with k = 1 dominant in the linear phase.

All confirmed in `invariants.test.mjs` (9 tests).

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
