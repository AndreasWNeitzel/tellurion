---
title: Lennard-Jones Molecular Dynamics
slug: md-lennard-jones-thermodynamics
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Watch a cold dense lattice of Lennard-Jones disks melt into a liquid, the radial distribution function growing its first peak while velocity-Verlet holds the energy flat.'
one_paragraph: 'A two-dimensional fluid of disks interacting through the Lennard-Jones potential V(r) = 4 epsilon[(sigma/r)^12 - (sigma/r)^6] (steeply repulsive core, weak attractive tail), in a periodic box and reduced units. Orbits are advanced with a symplectic (velocity-Verlet) step so the total energy is conserved over long runs. Particles are coloured by kinetic energy; the temperature follows from the kinetic energy by equipartition, the pressure from the virial theorem, and the structure from the pair-correlation function g(r). Cold and dense the system freezes into a triangular crystal with sharp g(r) peaks; warm it melts into a liquid and then a gas where g(r) approaches 1, so the equation of state and the phases emerge directly from the microscopic forces. Reference: Frenkel and Smit, Understanding Molecular Simulation, Chapters 3 to 4; Allen and Tildesley.'
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

## Explainer

### What you are looking at

A box of atoms that attract weakly when far apart and repel hard when
squeezed together. Just that one pair force, integrated for hundreds of
atoms, produces gas, liquid, and solid, and lets you read off
temperature and pressure from the motion itself. This is molecular
dynamics, the in-silico microscope of statistical physics.

### The interaction

Every pair feels the Lennard-Jones potential

$$U(r) = 4\left[\left(\tfrac1r\right)^{12}
  - \left(\tfrac1r\right)^{6}\right],$$

a steep $r^{-12}$ repulsion (electron clouds cannot overlap) and a
gentler $r^{-6}$ attraction (van der Waals). It is truncated at
$r_c = 2.5$ with a shifted-force form so the force and energy go
continuously to zero there (no spurious kicks at the cutoff). Atoms
move by velocity-Verlet, the same time-reversible symplectic stepper
used throughout, so total energy is conserved over long runs.

### Reading thermodynamics off the motion

The macroscopic state variables are statistical averages over the
microscopic trajectories:

$$T = \frac{\langle\text{KE}\rangle}{N}\ \text{(2D)},
  \qquad P = \rho T + \frac{1}{2V}\Big\langle
  \sum_{i<j}\mathbf r_{ij}\!\cdot\!\mathbf F_{ij}\Big\rangle,$$

the second being the virial pressure. The radial distribution function
$g(r)$ (the probability of finding a neighbor at distance $r$)
fingerprints the phase: a gas is nearly flat, a liquid has a broad
first shell, a solid has sharp periodic peaks. The playground shows the
particles, $g(r)$, and the live $T, P$ so you watch a gas condense and
freeze as you cool it.

### Things to try

- Cool the box and watch a disordered gas condense into a liquid drop
  and then crystallize, with $g(r)$ growing sharp peaks.
- Compress it and watch the virial pressure climb (the repulsive core
  dominating).
- Confirm the conserved total energy holds while kinetic and potential
  trade.

### Where this comes from

The Lennard-Jones potential, shifted-force truncation, velocity-Verlet
integration, and virial/$g(r)$ diagnostics follow Allen and Tildesley,
*Computer Simulation of Liquids*, and Frenkel and Smit, *Understanding
Molecular Simulation*.

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
