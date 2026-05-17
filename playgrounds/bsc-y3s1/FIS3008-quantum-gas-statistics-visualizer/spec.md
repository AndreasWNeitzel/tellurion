---
title: Quantum Gas Statistics Visualizer
slug: quantum-gas-statistics-visualizer
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Cool an ideal Bose gas through Tc and watch a macroscopic spike erupt at zero energy while the Fermi gas freezes into a sharp step, all at fixed particle number.'
one_paragraph: 'An ideal gas of N particles in 3D with density of states g(eps) proportional to sqrt(eps). The mean occupation of a single-particle state is exp(-(eps-mu)/kT) for Maxwell-Boltzmann, 1/(exp+1) for Fermi-Dirac and 1/(exp-1) for Bose-Einstein, with the chemical potential mu(T) fixed by N = integral g n d eps. The scene overlays the three occupation curves, marks the Fermi energy, shows the Bose condensate as a spike at eps = 0 below Tc, and draws an occupation-cells cartoon. As T drops the Fermi gas sharpens into a step at E_F, the Bose chemical potential rises to zero at Tc, and below it the condensate fraction 1-(T/Tc)^{3/2} appears. The headless sim.js is gate-tested for the Fermi half-occupation identity, the T->0 step and Sommerfeld mu, BEC onset and condensate fraction, the non-degenerate classical limit, the closed-form MB mu and 3kT/2 mean energy, particle-number conservation and the BE > MB > FD ordering.'
tags: [quantum, statistical-mechanics, multi-panel, animation, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3008
share_state_keys: []
---

# Quantum Gas Statistics Visualizer

## Physical setup

A non-interacting gas of N indistinguishable particles in a 3D box,
density of states `g(eps) = C sqrt(eps)`. Temperature `tau = kT` is
the control; the chemical potential `mu(tau)` is whatever keeps the
particle number fixed.

## Governing equations

Mean occupation `n(eps)`: `exp(-(eps-mu)/tau)` (MB),
`1/(exp((eps-mu)/tau)+1)` (FD), `1/(exp((eps-mu)/tau)-1)` (BE, with
`mu < 0`). Closure: `N = integral_0^inf g(eps) n(eps) d eps`.
Fermi energy `E_F = (3N/2C)^{2/3}`. Bose condensation at
`tau_c = (N/(C Gamma(3/2) zeta(3/2)))^{2/3}`; for `tau < tau_c`,
`mu = 0` and the condensate fraction is `1 - (tau/tau_c)^{3/2}`.

## Numerical method

The number and energy integrals use the substitution
`eps = tau u^2`, which removes the `sqrt` singularity so composite
Simpson (4000 intervals) converges fast even as `mu -> 0` for the
Bose gas. `mu(tau)` is the closed form for MB and a 200-step
bisection on the monotone `N(mu)` for FD and BE; BEC is detected when
`N(mu=0)` cannot hold all particles. Reference: Pathria and Beale,
Statistical Mechanics (3rd ed.), Ch. 7-8 (`pathria`); Reif,
Fundamentals of Statistical and Thermal Physics, Ch. 9 (`reif`).

## Controls

- temperature tau: the single thermodynamic knob (= kT).
- statistics: all three overlaid, or one isolated.
- occupied g n: toggle the occupied spectral density vs occupation.
- Cool through Tc: animate a cooling sweep across the transition.
- Reset.

## Expected qualitative features

- High tau: the three curves coincide (classical, non-degenerate).
- Low tau, FD: a near-step filled up to `E_F`, `n(E_F) = 1/2`.
- BE approaching tau_c: `mu -> 0`, the low-energy occupation diverges.
- tau < tau_c: a bold condensate spike at `eps = 0`, growing as
  `1 - (tau/tau_c)^{3/2}` while the live `N` readout holds at 1.0000.

## Invariants and acceptance thresholds

- FD `n(mu) = 1/2` exactly for any T (1e-12).
- FD `T -> 0`: `mu -> E_F` (5e-3), occupation step (1e-6 each side).
- FD Sommerfeld `mu(tau)` at low T (6e-3 relative).
- BE: `mu -> 0` at `tau_c` (2e-3), `mu < 0` above, `mu = 0` below;
  condensate fraction exact.
- BE number conservation including the condensate below `tau_c` (1%).
- Quantum -> MB in the non-degenerate limit (2% relative).
- MB `mu` matches the closed form (1e-9); mean energy `= 3 tau/2`
  (1e-3); `N` conserved (1e-6).
- N conserved for MB, FD, hot BE at the solved mu (1%).
- Occupation ordering `BE > MB > FD` for `(eps-mu)/tau > 0`.

## Limiting cases for verification

- `tau >> tau_c`: all three statistics collapse to MB.
- `tau -> 0` (FD): `mu -> E_F`, occupation is a step at `E_F`.
- `tau -> tau_c^-` (BE): `mu -> 0`, condensate fraction `-> 0^+`.

## Visual fallback

Static frame: the occupation curves at the captured temperature with
the condensate spike and the occupation-cells cartoon.

## Citations

- Pathria and Beale, Statistical Mechanics (3rd ed.), Ch. 7-8
  (`pathria`).
- Reif, Fundamentals of Statistical and Thermal Physics, Ch. 9
  (`reif`).

## Stretch goals

- 2D gas (no BEC at finite T) as a contrast case.
- Heat capacity `C_V(T)` with the Bose lambda cusp.

## Risk register

- Bose integrand is singular at `eps = 0` when `mu = 0`; the
  `eps = tau u^2` substitution makes it smooth and Simpson-safe.
- Truncating the upper limit: `U^2 = max(60, 60+eta)` keeps the
  neglected tail below 1e-26 of the integral.
