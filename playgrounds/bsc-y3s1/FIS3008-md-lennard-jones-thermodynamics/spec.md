---
title: Lennard-Jones Molecular Dynamics
slug: md-lennard-jones-thermodynamics
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Watch a cold dense lattice of Lennard-Jones disks melt into a liquid, the radial distribution function growing its first peak while velocity-Verlet holds the energy flat.'
one_paragraph: 'A 2D Lennard-Jones fluid of 300 disks in a periodic box, reduced units (sigma = epsilon = m = kB = 1), integrated by velocity-Verlet using the verified shared symplectic engine with a shifted-force cutoff so the force and energy are continuous and the energy is conserved. Particles are coloured by kinetic energy; the temperature is read from the kinetic energy by 2D equipartition, the pressure from the virial, and the structure from the radial distribution g(r) computed with the minimum-image convention. Cold and dense it crystallizes into a triangular lattice with sharp g(r) peaks; hot it is a gas with g(r) -> 1. The headless sim.js is gate-tested for the analytic LJ landmarks and shifted-force continuity, velocity-Verlet energy conservation, momentum conservation, the repulsive no-overlap core, the kinetic temperature, the g(r) structure, the no-interaction ideal-gas pressure limit and determinism.'
tags: [molecular-dynamics, statistical-mechanics, n-body, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 7
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3008
share_state_keys: []
---

# Lennard-Jones Molecular Dynamics

## Physical setup

`N = 300` particles in a periodic `L x L` box (`rho = N/L^2`),
pairwise `U(r) = 4[(1/r)^12 - (1/r)^6]`, cutoff `rc = 2.5` with the
shifted-force construction so `F` and `U` vanish continuously at
`rc`.

## Governing equations

Newton with velocity-Verlet. Shifted-force LJ:
`F_sf(r) = F(r) - F(rc)`, `U_sf(r) = U(r) - U(rc) - (rc - r) F(rc)`.
Kinetic temperature (2D, dof = 2N): `T = KE / N`. Virial pressure
(2D): `P = rho T + (1/2V) sum_{i<j} r_ij . F_ij`. Radial distribution
`g(r) = hist(r) / [rho * 2 pi r dr * N]`.

## Numerical method

Velocity-Verlet from the shared `symplectic` engine (gate-tested
separately); minimum-image convention; lattice initial positions,
Maxwell-Boltzmann velocities with the net momentum removed;
deterministic at the supplied seed. `dt = 0.004` for the live run.
Reference: Allen and Tildesley, Computer Simulation of Liquids
(2nd ed.), Ch. 1-3 (`allen-tildesley`).

## Controls

- temperature T: thermostat target (periodic velocity rescale).
- density rho: rebuilds the box at the new density.
- steps / frame: integration speed.
- Reset, Pause.

## Expected qualitative features

- The right panel is labelled in plain words: g(r) is the local
  neighbour density divided by the bulk density. The first
  coordination-shell peak is annotated with its r (with a leader
  line to the curve), the small-r region as the excluded repulsive
  core, and the g = 1 line as the structureless ideal gas, so it is
  not a mystery plot. A bottom caption ties the peaks to the shells
  visible in the box.
- Cold and dense: a triangular crystal, sharp split g(r) peaks.
- Warm and moderate rho: a liquid, one broad first peak near
  `r = 2^{1/6}`, decaying oscillations to `g -> 1`.
- Hot or dilute: a gas, `g(r) -> 1` with a small excluded core.
- The `dE/N` readout stays near zero (energy conservation).

## Invariants and acceptance thresholds

- `U(1) = 0`, `U(2^{1/6}) = -1`, `F(2^{1/6}) = 0`; shifted-force
  `F(rc) = U(rc) = 0`.
- Velocity-Verlet per-particle energy drift `< 1e-3` over the run.
- Total momentum stays `< 1e-8`.
- Minimum pair distance `> 0.7` (no overlap).
- Kinetic temperature matches the rescaled target within 18 percent.
- `g(r)`: excluded core `< 0.15` for `r < 0.8`, a first peak
  `> 1.3` at `1.0 < r < 1.4`, tail `-> 1` within 0.25.
- No-interaction limit: `P = rho T` to `1e-9` when no pair is within
  `rc`.
- Determinism: identical trajectory for the same seed.

## Limiting cases for verification

- No pairs within `rc`: `P = rho T` exactly (ideal gas).
- `r = 2^{1/6}`: zero force, potential minimum `-epsilon`.
- High T / low rho: structureless `g(r) ~ 1`.

## Visual fallback

Static frame: the particle box (KE-coloured) plus the current
`g(r)` curve at the captured time.

## Citations

- Allen and Tildesley, Computer Simulation of Liquids (2nd ed.),
  Ch. 1-3 (`allen-tildesley`).

## Stretch goals

- Andersen or Nose-Hoover thermostat instead of velocity rescaling.
- A live equation-of-state `P(rho)` isotherm trace.

## Risk register

- A plain truncated LJ leaks energy at the cutoff; the shifted-force
  form makes `F` and `U` continuous so Verlet conserves energy.
- `|dE/E|` is ill-conditioned because total `E = KE + PE` passes
  through zero; the invariant uses per-particle absolute drift.
- `O(N^2)` pair loop: `N = 300` sustains 60 fps in Canvas2D; the
  headless tests use smaller `N` for speed.
