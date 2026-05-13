---
title: Frustrated Triangular Antiferromagnet
slug: frustrated-triangular-af
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2014
supporting_ucs: [FIS2018, MAA-NM]
curriculum_year: bsc-y2s1
---

# Frustrated triangular antiferromagnet

## Physical setup

Antiferromagnetic Ising spins on a 2D triangular lattice with periodic boundaries. Each spin prefers to be opposite to its 6 neighbors. Geometric frustration: on every 3-spin plaquette, you cannot satisfy all three anti-alignments at once. Wannier 1950 showed there is no finite-T phase transition; the T = 0 ground state has extensive residual entropy.

## Governing equations

  E = +J sum_{<i, j>} s_i s_j,   J = 1,  s in {+1, -1}.

Single-spin Metropolis with dE_flip = -2 J s_ij sum_neighbors.

## Numerical method

Pure-JS Int8Array spin grid; PCG64 RNG; one sweep = L^2 attempted updates. Slim per-playground implementation matching ising-triangular's pattern, with sign flip for AF.

## Controls

- T: temperature, 0.05 - 5.0, default 0.5
- L: lattice size 32 - 96, default 64
- speed: sweeps per render frame, 1 - 8, default 3
- Cold (stripe) / Hot (random): initialization choice

## Expected qualitative features

1. Low-T sea of competing domains, never settling to long-range order.
2. Random patches of three same-spin "frustrated" plaquettes always present.
3. No critical slowing-down or order-parameter onset as T decreases.

## Invariants and acceptance thresholds

- |m| bounded by 1, e bounded by +/- 3 J.
- High-T disorder: |m| < 0.05 at T = 5.0 after 200 sweeps.
- Cold-start stripe at T = 0.05: e < -0.8.
- Frustrated-plaquette fraction at T = 1.0: in (0, 0.5).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- T -> infinity: random spins, m = 0 within O(N^{-1/2}), e -> 0.
- T -> 0: ground-state manifold; single-spin Metropolis gets stuck.
- Ferromagnetic sign (J -> -J) recovers the ising-triangular playground.

## Visual fallback

Canvas2D only.

## Citations

- Wannier 1950, "Antiferromagnetism. The triangular Ising net", Phys. Rev. 79, 357.
- Newman and Barkema 1999, Monte Carlo Methods in Statistical Physics, Section 5.4 (`newmanbarkema1999`).
- Diep 2013, Frustrated Spin Systems, Chapter 1 (background only).

## Stretch goals

- Add Wolff cluster algorithm.
- Add a structure-factor plot to show absence of Bragg peaks.

## Risk register

- Single-spin Metropolis has very long autocorrelation at low T; the simulation looks stuck past T < 0.2.
- The displayed row-offset is a visual hint; the underlying lattice is a rectangular array with the standard triangular neighbor map.
