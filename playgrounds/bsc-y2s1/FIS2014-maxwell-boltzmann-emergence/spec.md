---
title: Maxwell-Boltzmann Emergence from Hard-Disk Collisions
slug: maxwell-boltzmann-emergence
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2014
supporting_ucs: []
curriculum_year: bsc-y2s1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [thermodynamics, statistical-physics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Maxwell-Boltzmann emergence from hard-disk collisions

## Physical setup

A 2D box of side L = 8 containing N = 80 hard disks (radius 0.15) initially
moving with identical speed v_0 = 1 but random orientations. Walls are
reflecting; disk-disk collisions are elastic with equal masses (which
exchanges only the velocity components along the contact normal).

## Governing equations

Free flight between collisions; elastic collision at contact:
  v_n^i, v_n^j  ->  v_n^j, v_n^i
  v_t unchanged.

The initial distribution is delta(|v| - v_0). Through collisions it
relaxes toward the 2D Maxwell-Boltzmann distribution
  p(v) = (v / sigma^2) exp(-v^2 / (2 sigma^2))
with sigma^2 = v_0^2 / 2.

## Numerical method

Fixed time-step Euler with pairwise overlap detection and elastic
collision resolution. O(N^2) collision check per step (cheap at N = 80).

## Controls

- speed: simulation steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Initial: all disks at the same speed (uniform color).
2. After collisions: color spreads (some slow, some fast).
3. Histogram of |v| starts as a single tall bar at v_0 and broadens.
4. Long-time histogram matches the analytic MB curve (overlaid in orange).
5. Mean speed converges to sigma sqrt(pi/2) approx 0.886 v_0.

## Invariants and acceptance thresholds

1. Total KE conserved to 1e-9 over 200 steps.
2. Initial mean speed equals v_0.
3. Particles remain inside the box.
4. Mean speed post-thermalization in [0.7, 1.0] when v_0 = 1.
5. Analytic 2D MB integrates to 1 within 1e-3 (sanity).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- N -> infinity: histogram converges to MB more sharply.
- Density -> 1 (close-packing): qualitatively different statistics (jamming).

## Visual fallback

Canvas2D only. Left: gas box (color = speed). Right: speed histogram with
MB analytic curve overlaid.

## Citations

- Reif, Fundamentals of Statistical and Thermal Physics Ch. 1 (`reif`).
- Krauth, Statistical Mechanics: Algorithms and Computations Ch. 2.

## Stretch goals

- Event-driven collisions (exact instead of overlap-based).
- Maxwell-Boltzmann demon: split slow vs fast disks across a partition.
- 3D extension.

## Risk register

- Time-stepped collisions can cause occasional disk overlap if dt is too
  large; we push particles apart in `resolveCollision` to avoid sticking.
- For very long runs, energy drift from this push correction is < 1e-9
  per step.
