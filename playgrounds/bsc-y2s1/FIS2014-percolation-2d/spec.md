---
title: 2D Site Percolation
slug: percolation-2d
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2014
supporting_ucs: [FIS2018, MAA-NM]
curriculum_year: bsc-y2s1
hook: 'Fill a grid one random site at a time; nothing connects across it until a sharp threshold, then a single cluster suddenly spans the whole thing.'
one_paragraph: 'Each site of the lattice is occupied independently with probability p. Below the critical p_c (about 0.5927 for the square lattice) only small isolated clusters exist; right at p_c a giant cluster first spans the system and the size of the largest cluster jumps sharply. The playground occupies sites, labels the connected clusters, and highlights the largest as you tune p, so the percolation transition and the scale-free critical cluster appear directly. Percolation is the minimal model of a connectivity transition, from fluid through porous rock to the robustness of networks and the spread of fire. Reference: Stauffer and Aharony, Introduction to Percolation Theory; Newman and Ziff 2000.'
tags: [thermodynamics, statistical-physics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# 2D site percolation

## Physical setup

Each site of an L x L square lattice is independently occupied with probability p (the "site occupation probability"). We label all connected clusters of occupied sites (4-neighbor connectivity) and highlight the largest cluster. As p crosses the critical value p_c = 0.59274621, a giant spanning cluster appears (Newman-Ziff 2000).

## Governing equations

  P(site occupied) = p, independent across sites
  cluster = maximal connected set of occupied sites (Hoshen-Kopelman labeling)
  P_inf(p) = (largest-cluster size) / L^2

## Numerical method

Union-find (Hoshen-Kopelman 1976) for cluster labeling. PCG64 RNG.

## Controls

- p: occupation probability, 0.30 - 0.85, default 0.59
- L: lattice size, 32 - 128, default 80
- Resample: regenerate occupation with new seed
- Snap to p_c

## Expected qualitative features

1. p < 0.4: small isolated puddles.
2. p = p_c: scale-free domain structure.
3. p > 0.65: one giant cluster + thin strands.
4. The "spans" indicator flips from "no" to "yes" near p_c.

## Invariants and acceptance thresholds

- Trivial limits p = 0, 1.
- Below p_c: no spanning cluster (high probability over 5 trials).
- Above p_c: spanning cluster exists.
- Largest-cluster fraction monotone in p.
- p_c = 0.59274621 (Newman-Ziff 2000).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- p = 0: empty lattice.
- p = 1: full lattice, single cluster.
- p = p_c: critical scaling, P_inf ~ (p - p_c)^beta with beta = 5/36 (not measured here).

## Visual fallback

Canvas2D only.

## Citations

- Stauffer and Aharony 1994, Introduction to Percolation Theory, Chapter 2 (`staufferaharony1994`).
- Newman and Ziff 2000, "Efficient Monte Carlo algorithm and high-precision results for percolation", Phys. Rev. Lett. 85, 4104.
- Hoshen and Kopelman 1976, Phys. Rev. B 14, 3438 (cluster labeling algorithm).

## Stretch goals

- Add a P_inf(p) curve in an inset that the user can sweep through.
- Add bond percolation as a toggle.

## Risk register

- Union-find with path compression is O(N alpha(N)) ~ O(N); for L = 128 that is 16384 sites, ~ 10 ms per recomputation. Recomputed on every slider input event; debouncing would help on slow devices but is not implemented.
