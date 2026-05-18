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

## Explainer

### What you are looking at

Two big bodies (a star and a planet, the Earth and the Moon) orbit each
other. A lightweight third object feels both pulls. In the frame that
rotates with the pair, there are five points where it can sit and not
drift away: the Lagrange points. Real spacecraft park at them. The
playground shows the rotating frame, the five points, and how stable
each one is.

### The equations

Work in the synodic (co-rotating) frame, scaled so the total mass,
separation, and angular velocity are all 1. With mass ratio
$\mu = m_2/(m_1+m_2)$, the primaries sit fixed at $(-\mu, 0)$ and
$(1-\mu, 0)$, and the test particle obeys

$$\ddot x = 2\dot y + x
  - \frac{(1-\mu)(x+\mu)}{r_1^3} - \frac{\mu\,(x-1+\mu)}{r_2^3},$$

$$\ddot y = -2\dot x + y
  - \frac{(1-\mu)\,y}{r_1^3} - \frac{\mu\,y}{r_2^3}.$$

The $\pm2\dot{}$ terms are the Coriolis force, the $x$ and $y$ terms
the centrifugal force, both artifacts of working in a rotating frame.
There is one conserved quantity, the Jacobi integral

$$C = 2\left[\frac{x^2+y^2}{2} + \frac{1-\mu}{r_1}
  + \frac{\mu}{r_2}\right] - (\dot x^2 + \dot y^2),$$

the rotating-frame analogue of energy; it bounds where the particle
can go (the zero-velocity curves).

### The five points and their stability

Setting all velocities and accelerations to zero gives five
equilibria. $L_1, L_2, L_3$ lie on the line through the primaries and
are always saddle points, linearly unstable (a craft there needs small
station-keeping nudges). $L_4$ and $L_5$ sit at the apexes of
equilateral triangles with the two primaries, at
$(\tfrac12-\mu, \pm\tfrac{\sqrt3}{2})$, and are linearly stable provided
the mass ratio is small,

$$\mu < \mu_R \approx 0.0385 \quad (\text{Routh, 1875}).$$

This is why the Sun-Jupiter $L_4/L_5$ points hold the Trojan
asteroids: Jupiter is light enough relative to the Sun.

### Things to try

- Drop the test particle near $L_4$ with small $\mu$ and watch it
  librate (tadpole orbit) rather than fall away.
- Increase $\mu$ past 0.0385 and watch $L_4/L_5$ turn unstable.
- Note the collinear points always shed the particle: they are
  saddles, not wells.

### Where this comes from

The circular restricted three-body problem in the synodic frame, the
Jacobi integral, the five Lagrange points and the Routh stability
criterion follow Binney and Tremaine, *Galactic Dynamics*, 2nd ed.,
Section 3.3, and Murray and Dermott, *Solar System Dynamics*,
Chapter 3.

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
