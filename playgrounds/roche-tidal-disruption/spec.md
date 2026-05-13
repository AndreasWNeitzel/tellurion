---
title: Tidal Disruption Near a Massive Primary
slug: roche-tidal-disruption
status: verified
audience: portfolio
created: 2026-05-13
---

# Tidal disruption near a massive primary

## Physical setup

A cloud of 80 self-gravitating test particles ("a fluid satellite") on an eccentric orbit around a heavy point-mass primary. When the orbit takes the cloud inside the Roche radius, the tidal force from the primary overwhelms the satellite's self-gravity and stretches it into a stream. Outside the Roche radius the cloud holds together.

## Governing equations

Equations of motion for particle i:
  d^2 r_i / dt^2 = -G M_p (r_i / |r_i|^3) - cohesion (r_i - r_cm) / |r_i - r_cm|^3_softened

with softening epsilon = 0.2 r_cloud to prevent singular collapse. r_cm is the cloud center of mass.

The Roche limit for an equal-density fluid satellite is r_R = 2.44 R_primary (Roche 1849). In our code units M_primary = G = 1, "R_primary" = 1, so r_R = 2.44.

## Numerical method

Velocity-Verlet for each particle; one acceleration evaluation per half-step. Fixed dt = 0.005.

## Controls

- a: orbit semi-major axis, 2.0 - 6.0, default 3.5
- e: eccentricity, 0.0 - 0.85, default 0.55
- cohesion: self-gravity coupling, 0.0 - 0.20, default 0.05
- speed: integration multiplier, 0.1 - 2.0, default 0.5

## Expected qualitative features

1. Far orbit (a >> 2.44) with moderate cohesion: cloud stays compact.
2. Eccentric orbit with pericenter inside Roche: cloud stretches into a stream during each pericenter passage.
3. Very low cohesion: differential Kepler motion alone spreads the cloud over time even at large radius.
4. Very high cohesion (> 0.20): cloud over-cohesive; self-gravity dominates and cloud bounces (slider capped).

## Invariants and acceptance thresholds

- Initial stream length matches the configured cloud radius (within 0.2 to 0.35 for rCloud = 0.3).
- Pericenter-inside-Roche orbits (a=3, e=0.6, cohesion=0.01) spread > 2x in 4000 steps.
- Zero cohesion: cloud always spreads over time (differential Kepler).
- CoM follows an elliptical orbit between roughly a(1-e) and a(1+e).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- cohesion = 0: pure test-particle Kepler motion; spread driven only by initial-velocity dispersion.
- a > 6: pericenter > Roche; cloud always survives.
- High N: smoother stream; not exposed as a slider for performance.

## Visual fallback

Canvas2D only.

## Citations

- Roche 1849, on the disruption of fluid satellites (historical).
- Binney and Tremaine 2008, Galactic Dynamics 2e, Section 8.2 (`binneytremaine2008`).
- Hurley and Tout 1998, MNRAS 300 (tidal-disruption framework, binary stars).

## Stretch goals

- Add a "rotational support" toggle (initial rigid rotation) to show bound vs unbound spin states.
- Add a stream-coloring overlay tracing particles by orbital energy.

## Risk register

- Self-gravity softening can let particles pass close to CoM and accelerate fast; cohesion is capped at 0.20.
- The simulation does not include particle-particle gravity; treating only attraction to the cloud CoM is a soft-body approximation, not a full N-body simulation. Acceptable for visualization.
