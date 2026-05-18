---
title: Lagrange Points of the Circular Restricted Three-Body Problem
slug: lagrange-points-cr3bp
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: [FIS2021]
curriculum_year: bsc-y2s1
hook: 'In the rotating frame of two orbiting masses there are five places a third body can sit still: the Lagrange points, three of them unstable, two stable.'
one_paragraph: 'The circular restricted three-body problem follows a massless test particle in the gravity of two bodies that orbit their common centre. Worked in the synodic (co-rotating) frame the two primaries stand still and centrifugal plus Coriolis forces appear; the energy-like Jacobi integral is then conserved. The playground integrates a trajectory in this frame and overlays the five Lagrange points and the zero-velocity (Hill) curves set by the Jacobi constant. L1, L2, L3 lie on the line through the masses and are saddles; L4 and L5 lead and trail by 60 degrees and are stable when the mass ratio is below about 1/25, which is why Trojan asteroids park there. Reference: Murray and Dermott, Solar System Dynamics; Carroll and Ostlie, Ch. 18.'
tags: [stellar, exoplanets, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Lagrange points of the CR3BP

## Physical setup

Two heavy bodies of mass m1 and m2 orbit their common center of mass in a circular orbit. A test particle (mass negligible) moves under their combined gravity, computed in the rotating frame where the two primaries stand still. Non-dimensional units: total mass = 1, separation = 1, angular velocity = 1.

## Governing equations

Mass parameter: mu = m2 / (m1 + m2). Primaries at (-mu, 0) and (1 - mu, 0).

Equations of motion in the synodic frame:
  x'' = 2 y' + x - (1 - mu)(x + mu) / r1^3 - mu (x - 1 + mu) / r2^3
  y'' = -2 x' + y - (1 - mu) y / r1^3 - mu y / r2^3

The Coriolis term 2 y' (and -2 x') is the velocity-dependent rotating-frame force.

Jacobi integral (conserved):
  C = 2 [(x^2 + y^2)/2 + (1 - mu)/r1 + mu/r2] - (x'^2 + y'^2)

Lagrange points:
- L1, L2, L3 lie on the x-axis (collinear with the primaries); always linearly unstable.
- L4, L5 form equilateral triangles with the two primaries: (1/2 - mu, +/- sqrt(3)/2).
- L4, L5 are linearly stable iff mu < mu_R ~ 0.0385 (Routh 1875).

## Numerical method

Velocity-Verlet from `shared/js/engine/symplectic.js` with the predictor-corrector pass that handles the Coriolis (qdot-dependent) term. Fixed step dt = 0.002. Trail buffer 4000 points.

## Controls

- mu: mass parameter, slider 0.0005 - 0.4, default 0.01215 (Earth-Moon)
- speed: steps per render frame multiplier, slider 0.1 - 3.0, default 1.0
- Drop near L4 / L5: add a test particle one milli-unit off the equilateral point
- Clear trails: empty the particle buffer

Click anywhere on the plot to drop a particle at the cursor with zero rotating-frame velocity.

## Expected qualitative features

1. At low mu (Earth-Moon, Sun-Jupiter): particles at L4 or L5 librate in tight "tadpole" orbits around the equilibrium point.
2. At mu > mu_R (around 0.04): triangular Lagrange points become linearly unstable; L4/L5 particles drift away.
3. L1, L2, L3 are always unstable; tiny offset particles drift away within a few synodic periods.

## Invariants and acceptance thresholds

- L4, L5 exact coordinates verified.
- L1, L2, L3 in their expected x-intervals.
- L1 in Earth-Moon system in [0.82, 0.86].
- mu_R = 0.5 - sqrt(1 - 4/27)/2 = 0.0385... verified.
- Jacobi conservation for tight L4 orbit: |dC|/|C| < 1e-6 over 5000 steps at dt = 0.002.
- L4 librator at Earth-Moon mu stays within 0.10 of L4 over 10k steps.
- Mu = 0.2 (above Routh): particle near L4 drifts > 0.5 within 15k steps.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- mu -> 0: two-body problem; L4 = L5 sit on the unit circle exactly 60 degrees ahead and behind the secondary.
- mu = 0.5: equal masses; L4 = L5 are above and below the midpoint; system reflects across both axes.
- mu = mu_R: marginal stability for L4 / L5.

## Visual fallback

Canvas2D only.

## Citations

- Binney and Tremaine 2008, Galactic Dynamics 2e, Section 3.3 (`binneytremaine2008`).
- Murray and Dermott 1999, Solar System Dynamics, Chapter 3 (`murraydermott1999`).
- Routh 1875 (Routh stability criterion); reproduced in Szebehely 1967, Theory of Orbits, Section 4.6.

## Stretch goals

- Overlay the zero-velocity-curve (Hill region) for the current Jacobi value C.
- Add a Jacobi-integral live readout with conservation telemetry.
- Compute and display the Hill radius R_H = (mu/3)^(1/3) of the secondary.

## Risk register

- Close approach to either primary causes large dt^2 errors with fixed-step velocity-Verlet (drift can reach 1 percent over 5000 steps). The default test orbits stay near L4 so this is invisible at default parameters.
- The Coriolis term makes velocity-Verlet non-symplectic; predictor-corrector restores 2nd-order accuracy but not symplecticity.
