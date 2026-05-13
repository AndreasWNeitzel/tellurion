---
title: 2D XY Model and the BKT Vortex Transition
slug: xy-model-bkt
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2014
supporting_ucs: [FIS2018, MAA-NM]
curriculum_year: bsc-y2s1
---

# 2D XY model: BKT vortex unbinding

## Physical setup

Classical XY model: each site of an L x L periodic square lattice holds a continuous angle theta in [0, 2 pi). Bond energy -J cos(theta_i - theta_j); J = 1. The 2D XY model has no spontaneous symmetry breaking at finite T (Mermin-Wagner), but it does have a finite-temperature Berezinskii-Kosterlitz-Thouless (BKT) transition at T_BKT ~ 0.893 J (Hasenbusch 2005, Phys. Rev. B 71, 094507).

Below T_BKT: bound vortex-antivortex pairs; algebraic order; correlations decay as power laws.
Above T_BKT: free vortices; exponential decay; no order.

## Governing equations

  E = -J sum_{<i, j>} cos(theta_i - theta_j),  J = 1.

Metropolis proposal: theta -> theta + delta, delta uniform in [-pi, +pi].

Vortex charge around a 2x2 plaquette (i, j), (i+1, j), (i+1, j+1), (i, j+1): sum of wrap(theta_next - theta_curr) over the loop; +2 pi gives a vortex, -2 pi an antivortex.

## Numerical method

Pure-JS Float64Array spin grid; PCG64 RNG. Vortex map recomputed each frame from current angles.

## Controls

- T: temperature, 0.1 - 2.5, default 0.7
- L: lattice size, 32 - 96, default 64
- speed: sweeps per render frame, 1 - 8, default 3
- Cold / Hot init

## Expected qualitative features

1. T = 0.2: smooth color gradients; almost no vortices.
2. T = T_BKT: scattered vortex-antivortex pairs ("bound").
3. T = 1.5: many free vortices; random-looking angle field.
4. Vortex pairs always have equal n+ and n- counts (topological constraint on the torus).

## Invariants and acceptance thresholds

- Cold init: m = 1, e = -2 per site (to 6 sig figs).
- Hot init: |m| < 0.1.
- High-T thermalization: |m| < 0.10 at T = 2.5.
- Vortex charge conservation: n+ = n- exactly.
- Vortex density grows with T.
- T_BKT ~ 0.893.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- T -> 0: ground state has all theta equal modulo a global shift; m -> 1.
- T -> infinity: random spins, m -> 0, every plaquette equally likely to host a vortex.

## Visual fallback

Canvas2D only.

## Citations

- Kosterlitz and Thouless 1973, "Ordering, metastability and phase transitions in two-dimensional systems", J. Phys. C 6, 1181.
- Hasenbusch 2005, "The two-dimensional XY model at the transition temperature: a high-precision Monte Carlo study", Phys. Rev. B 71, 094507.
- Newman and Barkema 1999, Monte Carlo Methods in Statistical Physics, Section 5.5 (`newmanbarkema1999`).

## Stretch goals

- Add Wolff cluster algorithm to speed equilibration.
- Add the helicity modulus measurement to detect the BKT transition quantitatively.

## Risk register

- Single-spin Metropolis is slow at low T; the simulation may look frozen for several sweeps before relaxing.
- Vortex detection by winding number is exact on the lattice (sum of wrapped angle differences); no missed vortices for the current grid resolution.
