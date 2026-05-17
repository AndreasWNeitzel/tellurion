---
title: The 2D Ising Phase Transition
slug: ising-2d-gpu-phase-transition
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Cool a lattice of spins through the Onsager temperature and watch a disordered fizz lock into magnetic domains, the order parameter rising as the exact m = [1 - sinh^{-4}(2J/T)]^{1/8}.'
one_paragraph: 'A square lattice of Ising spins with energy H = -J sum_<ij> s_i s_j, evolved by single-spin Metropolis updates in checkerboard (red-black) order using the shared, separately gate-tested lattice-MC engine. Above the Onsager temperature Tc = 2J/ln(1+sqrt2) the lattice is paramagnetic with no net magnetization; below it the Z2 symmetry breaks and ordered domains form, the magnetization following the exact Onsager-Yang curve with exponent beta = 1/8. The scene is the live 144x144 lattice beside the exact m(T) curve with the measured operating point and a trail of measured samples; the susceptibility, computed from magnetization fluctuations, peaks at Tc and the dynamics critically slow down there. The headless engine is gate-tested in tests/engines for the exact Tc and m(T), the T->0 saturation and E/spin -> -2J, the high-T disorder, the ferromagnetic phase against Onsager, ergodicity and determinism; the playground sim.js adds the susceptibility peak and the beta = 1/8 exponent.'
tags: [statistical-mechanics, monte-carlo, phase-transition, lattice, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 7
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3008
share_state_keys: []
---

# The 2D Ising Phase Transition

## Physical setup

An L x L periodic square lattice of spins `s_i = +-1`, energy
`H = -J sum_<ij> s_i s_j` (J = 1, zero field). The control is the
temperature `T = kT/J`.

## Governing equations

Metropolis acceptance for a single flip: `dE = 2 s_i (J*nb + h)`,
accept with probability `min(1, exp(-dE/T))`. Exact 2D results
(Onsager 1944, Yang 1952): `Tc = 2J/ln(1+sqrt2) ~ 2.2692`,
`m(T) = [1 - sinh(2J/T)^{-4}]^{1/8}` for `T < Tc` (else 0), so the
order-parameter exponent is `beta = 1/8`. Susceptibility from
fluctuations: `chi = N (<M^2> - <|M|>^2)/T`.

## Numerical method

Checkerboard single-spin Metropolis: all `(x+y)` even sites then all
odd, exact for the nearest-neighbour Ising coupling because a
sublattice couples only to the other. Deterministic at a fixed seed
(`mulberry32` via `rng.js`). The sweep, energy and magnetization are
the shared `lattice-mc` engine; the playground adds the running
estimators. Reference: Newman and Barkema, Monte Carlo Methods in
Statistical Physics, Ch. 3 (`newman-barkema`); Onsager,
Phys. Rev. 65, 117 (1944) (`onsager1944`).

## Controls

- temperature T: the order/disorder knob (quenches/anneals live).
- sweeps / frame: simulation speed.
- start: hot (random) or cold (aligned) initial state.
- Reset, Pause.

## Expected qualitative features

- `T >> Tc`: salt-and-pepper, `|M| ~ 0`, `E/spin ~ 0`.
- `T -> 0`: a single ordered domain, `|M| -> 1`, `E/spin -> -2J`.
- Near `Tc`: clusters of every size, the measured point sits on the
  Onsager curve's knee, susceptibility spikes, relaxation slows.
- The measured-sample trail traces out the Onsager curve as T varies.

## Invariants and acceptance thresholds

- Onsager `Tc` within 0.5 percent and exact to 1e-9.
- `M -> +-1` as `T -> 0` (`|M| > 0.95` at T = 1), `E/spin -> -2J`.
- Disordered at high T (`|M| < 0.12` at T = 6).
- Susceptibility peaks near `Tc` (`chi(Tc) > 3 chi` off-critical).
- Measured `|M|` below `Tc` tracks Onsager within 0.08-0.10.
- Magnetization exponent `beta = 1/8` (5e-3).
- Engine suite (tests/engines/lattice-mc): saturation, hot disorder,
  ferromagnetic phase vs Onsager, ergodicity, determinism, snapshot.

## Limiting cases for verification

- `T -> 0`: ground state, `|M| = 1`, `E/spin = -2J`.
- `T -> infinity`: random spins, `|M| -> 0`, `E/spin -> 0`.
- `T < Tc`: `|M|` matches the exact Onsager-Yang magnetization.

## Visual fallback

Static frame: the lattice at the captured temperature beside the
Onsager curve and the measured operating point.

## Citations

- Onsager, Phys. Rev. 65, 117 (1944) (`onsager1944`).
- Newman and Barkema, Monte Carlo Methods in Statistical Physics,
  Ch. 3 (`newman-barkema`).

## Stretch goals

- Wolff cluster updates to beat critical slowing down.
- Binder cumulant crossing for a finite-size `Tc` estimate.

## Risk register

- Critical slowing down means single-spin dynamics relax slowly near
  `Tc`; the capture thermalizes 700 sweeps per frame and the live
  view is honest about the sluggishness (it is the physics).
- A 512^2 GPU lattice is out of scope under the Canvas2D stack rule;
  144^2 sustains 60 fps and shows the same universal behaviour.
