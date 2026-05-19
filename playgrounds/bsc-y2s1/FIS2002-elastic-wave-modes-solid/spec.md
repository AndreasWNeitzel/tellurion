---
title: Elastic Waves: P and S Modes in a Solid
slug: elastic-wave-modes-solid
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Strike a solid and two waves leave the source: a fast compressional P front and a slower shear S front, the seismogram catching both with the textbook delay.'
one_paragraph: 'An isotropic elastic solid carries two independent body waves: a compressional P wave at v_P = sqrt((lambda + 2 mu)/rho), in which the material is alternately squeezed and stretched along the travel direction, and a slower shear S wave at v_S = sqrt(mu/rho), a transverse distortion. A point source launches both; the scene colours the compression (divergence of the displacement) and strains a reference grid, with the analytic P and S wavefront rings overlaid, while a station at 45 degrees records a seismogram where the P arrival leads the S by d(1/v_S - 1/v_P), the basis of earthquake distance ranging. Lowering the shear modulus toward zero (a fluid) makes the S wave vanish, which is why a liquid outer core casts an S-wave shadow. Reference: Landau and Lifshitz, Theory of Elasticity, Chapter 3; Aki and Richards, Quantitative Seismology.'
tags: [waves, elasticity, seismology, animation, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2002
share_state_keys: []
---

# Elastic Waves: P and S Modes in a Solid

## Explainer

### What you are looking at

Strike a solid and two different waves race out from the impact: a fast
push-pull wave (P) and a slower shake-sideways wave (S). A detector off
to the side records the P arrival first, then the S arrival some time
later. That P-minus-S delay is exactly how seismologists locate
earthquakes.

### The equation

An isotropic elastic solid obeys the Navier-Cauchy elastodynamic
equation:

$$\rho\,\ddot{\mathbf u} = (\lambda + \mu)\,\nabla(\nabla\cdot\mathbf u)
  + \mu\,\nabla^2\mathbf u,$$

where $\mathbf u$ is the displacement and $\lambda, \mu$ are the Lame
elastic constants. Split the motion into its divergence part and its
curl part and it separates into two independent waves.

### Two wave speeds

- P (primary, compressional): carries $\nabla\cdot\mathbf u$, the
  material is pushed and pulled along the travel direction. Speed
  $v_P = \sqrt{(\lambda + 2\mu)/\rho}$, the faster one.
- S (secondary, shear): carries $\nabla\times\mathbf u$, the material
  shakes transverse to travel. Speed $v_S = \sqrt{\mu/\rho}$, always
  slower (and zero in a fluid, which is why fluids transmit no S
  waves).

At a station a distance $d$ away the shear arrival lags the
compressional one by

$$\Delta t = d\left(\frac{1}{v_S} - \frac{1}{v_P}\right).$$

Read $\Delta t$ off a single seismogram and you get the distance $d$ to
the source; combine several stations and you triangulate the
epicenter. The playground excites a source and shows the expanding P
and S fronts and the station record.

### Things to try

- Watch the P front outrun the S front, the gap widening with
  distance.
- Change the Lame parameters and see both speeds shift while
  $v_P > v_S$ always holds.
- Note the station trace: a first P kick, then a larger S arrival,
  separated by $\Delta t$.

### Where this comes from

The Navier-Cauchy equation and the P and S wave speeds follow Landau
and Lifshitz, *Theory of Elasticity* (Course of Theoretical Physics,
Vol. 7), Sections 22 to 24.

## Physical setup

A homogeneous isotropic elastic medium. A localised source (point
force, explosive, or shear couple) excites body waves; a seismograph
station off-axis records the ground motion.

## Governing equations

The Navier-Cauchy elastodynamic equation

`rho u_tt = (lambda + mu) grad(div u) + mu lap(u)`,

with Lame parameters `lambda, mu`. Compressional (P) waves carry the
divergence and travel at `v_P = sqrt((lambda + 2 mu)/rho)`; shear (S)
waves carry the curl and travel at `v_S = sqrt(mu/rho)`. At a station
a distance `d` from the source the S arrival lags the P arrival by
`d (1/v_S - 1/v_P)`.

## Numerical method

Explicit leapfrog on a collocated grid, `dx = 1`, central differences
for `grad(div u)` and the Laplacian, stable at
`dt < dx / (v_P sqrt 2)` (safety 0.85). A quadratic sponge absorbs the
edges so the wavefronts are not contaminated by box reflections.
Reference: Landau and Lifshitz, *Theory of Elasticity* (Vol. 7),
Sec. 22-24 (`landau-elasticity`).

## Controls

- source: point force, explosive (P only), or shear couple (S).
- lambda (Lame): with mu sets `v_P`.
- mu (shear modulus): sets `v_S`; at `mu = 0` there is no S wave.
- Reset, Pause.

## Expected qualitative features

- Two expanding fronts: the fast P ring (red) ahead of the slower S
  ring (blue); the grid strains as they pass.
- The seismogram shows the P arrival, then the S arrival, matching the
  predicted markers.
- Raising lambda speeds P (the rings separate more); lowering mu slows
  and finally removes S.
- The explosive source makes pure P; the shear couple makes pure S.

## Invariants and acceptance thresholds

- `v_P = sqrt((lambda+2mu)/rho)`, `v_S = sqrt(mu/rho)`; `v_P > v_S`.
- The P (divergence) front radius exceeds the S (curl) front radius
  by more than 1.4x.
- Measured front speeds match `v_P` and `v_S` within 10%.
- As `mu to 0` the shear front radius collapses below 45% of its
  finite-mu value.
- Seismograph: `(t_S - t_P)` matches `d (1/v_S - 1/v_P)` within 20%.
- Bounded at the CFL `dt`, divergent well above it.

## Limiting cases for verification

- `mu = 0`: no shear restoring force, no S wave (fluid-like).
- Explosive source: divergence only (pure P, `v_P`).

Source: Landau and Lifshitz, *Theory of Elasticity* (Vol. 7),
Sec. 22-24 (`landau-elasticity`).
