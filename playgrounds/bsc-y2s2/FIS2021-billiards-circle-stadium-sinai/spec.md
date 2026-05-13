---
title: Billiards - Circle, Stadium, Sinai
slug: billiards-circle-stadium-sinai
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
---

# Billiards: circle, stadium, Sinai

## Physical setup

A free particle of unit speed bouncing elastically off the walls of a 2D shape. Three classical geometries: circle (integrable), Bunimovich stadium (chaotic), Sinai billiard (chaotic with convex scatterer). Used to study quantum-classical correspondence and the onset of chaos under purely geometric constraints.

## Governing equations

Equation of motion: free straight-line motion between walls, specular reflection at each contact: v -> v - 2 (v . n) n with n the inward-pointing unit normal.

Boundaries:
  circle:  x^2 + y^2 = 1.
  stadium: |x| <= L = 1, |y| <= 1, plus two semicircles of radius 1 capping each end.
  sinai:   |x| <= 1 and |y| <= 1, with an inner circle of radius R = 0.4 cut out.

## Numerical method

Ray-trace each step: find the smallest positive t at which the particle hits a boundary segment, advance to that point, reflect. No time-stepping; bounces are exact analytic intersections.

## Controls

- geometry: circle, stadium (default), sinai
- speed: bounces per render frame, 1 - 20, default 6
- Reset: re-initialize from canonical IC
- Pause / Play

## Expected qualitative features

1. Circle: trajectory traces a closed caustic (an inner circle of unvisited region); never fills the disc.
2. Stadium: trajectory rapidly fills the entire region; trail looks "random".
3. Sinai: also fills the region; the inner disc carves visible scattering events.

## Invariants and acceptance thresholds

- Speed |v| = 1 exactly across 500 bounces (< 1e-10 deviation).
- Position on boundary at each bounce, within < 1e-9.
- Circle: angle-of-incidence relative to outward radial invariant across 50 bounces (< 1e-6).
- Stadium: bounce-velocity angles span > 2 rad over 200 bounces.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Circle: integrable; even for any IC, angle relative to radial is conserved.
- Sinai R = 0: no scatterer; reduces to a square (still integrable as a separable rectangle).
- Stadium L = 0: reduces to a circle (integrable).

## Visual fallback

Canvas2D only.

## Citations

- Berry 1981, Eur. J. Phys. 2, 91 (`berry1981`).
- Tabachnikov 2005, Geometry and Billiards (American Mathematical Society).
- Bunimovich 1979 (Stadium); Sinai 1970 (Sinai billiard).

## Stretch goals

- Add a Poincare section (perimeter coordinate vs angle of incidence) for each geometry.
- Add a near-trajectory cloud to visualize Lyapunov divergence for the chaotic cases.
- Add a "color by bounce count" overlay.

## Risk register

- Numerical sliver bounces: very nearly tangential trajectories can produce sub-1e-9 t values that the next step misses. The current `t > 1e-9` cutoff is safe for all standard ICs but a very pathological IC could regress.
- The trail accumulates up to 1500 points; longer runs look like noise rather than the underlying geometry. The "Reset" button starts a fresh trail.
