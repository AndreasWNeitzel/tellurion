---
title: Tidal Disruption Near a Massive Primary
slug: roche-tidal-disruption
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: [MAA-HE]
curriculum_year: bsc-y2s1
hook: 'Send a self-gravitating cloud too close to a heavy mass and tides win: it shears into a long stream the moment it crosses the Roche limit.'
one_paragraph: 'A satellite held together by its own gravity survives only while that self-gravity beats the tidal stretch from a nearby massive body. The Roche limit marks the crossover, near 2.44 primary radii for an equal-density fluid. The playground flies a cloud of 80 mutually attracting test particles on an eccentric orbit around a point-mass primary. Outside the Roche radius the cloud stays a blob; dip inside it on the close approach and the differential pull tears it into a tidal stream, the same process that grinds out ring systems and disrupts comets that stray too close. Reference: Roche 1849; Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 19.'
tags: [stellar, exoplanets, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---

# Tidal disruption near a massive primary

## Explainer

### What you are looking at

A loosely bound clump (a comet, a small moon) swings close to a massive
body. Far out it holds itself together by its own gravity; inside a
critical distance the planet's tidal pull wins and shreds it into a
stream. This is how Shoemaker-Levy 9 was torn into a string of
fragments before hitting Jupiter, and how Saturn's rings stay rings.

### Why tides pull things apart

Gravity weakens with distance, so the near side of the clump is pulled
toward the primary harder than the far side. That difference, the tidal
force, stretches the clump along the line to the primary. It is
balanced by the clump's own self-gravity holding it together. The
playground integrates 80 mutually attracting particles on an eccentric
orbit:

$$\ddot{\mathbf r}_i = -\frac{G M_p\,\mathbf r_i}{|\mathbf r_i|^3}
  \; - \; \text{(softened self-gravity toward the cloud centre)},$$

with a softening length so particles do not collapse to a singular
point.

### The Roche limit

Set the tidal stretching equal to the self-gravity at the clump's
surface and you get a critical distance, the Roche limit. For an
equal-density fluid satellite,

$$r_R \approx 2.44\,R_\text{primary}.$$

Inside $r_R$ the clump cannot hold together no matter how it is shaped;
outside it survives. The playground puts the clump on an orbit that
dips inside and back out, so you watch it stretch into a tidal stream
near perihelion and (if it stays outside) re-gather. It is why no large
moon orbits within a few planetary radii and why ring systems sit where
they do.

### Things to try

- Start the orbit so perihelion is just outside $r_R$: the clump
  survives, only mildly distorted.
- Lower perihelion inside $r_R = 2.44$ and watch it draw out into a
  stream that does not recombine.
- Note the stream leads and trails along the orbit, exactly the
  Shoemaker-Levy 9 morphology.

### Where this comes from

The tidal-versus-self-gravity balance and the Roche limit follow
Roche (1849) and Binney and Tremaine, *Galactic Dynamics*, 2nd ed.,
Section 8.2, with the tidal-disruption framework in Hurley and Tout
(1998).

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
- Binney and Tremaine 2008, Galactic Dynamics 2e, Section 8.2.
- Hurley and Tout 1998, MNRAS 300 (tidal-disruption framework, binary stars).

## Stretch goals

- Add a "rotational support" toggle (initial rigid rotation) to show bound vs unbound spin states.
- Add a stream-coloring overlay tracing particles by orbital energy.

## Risk register

- Self-gravity softening can let particles pass close to CoM and accelerate fast; cohesion is capped at 0.20.
- The simulation does not include particle-particle gravity; treating only attraction to the cloud CoM is a soft-body approximation, not a full N-body simulation. Acceptable for visualization.
