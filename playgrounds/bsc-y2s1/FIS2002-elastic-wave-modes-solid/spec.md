---
title: Elastic Waves: P and S Modes in a Solid
slug: elastic-wave-modes-solid
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Strike a solid and two waves leave the source: a fast compressional P front and a slower shear S front, the seismogram catching both with the textbook delay.'
one_paragraph: 'A 2D isotropic elastic solid solved by an explicit leapfrog scheme for the vector displacement. A source launches a compressional P wave at v_P = sqrt((lambda+2mu)/rho) and a shear S wave at v_S = sqrt(mu/rho). The primary scene is the physical medium: the divergence (compression) coloured, a reference grid straining, and the analytic P and S wavefront rings; the side panel is the seismogram at a 45-degree station where the P arrival precedes the S arrival by d (1/v_S - 1/v_P). Lowering the shear modulus toward zero removes the S wave entirely. The headless sim.js is gate-tested for the analytic speeds, P faster than S, the measured front speeds, the vanishing shear front as mu to 0, the seismograph delay, and CFL stability.'
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
