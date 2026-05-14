---
title: Schwarzschild Effective Potential and the ISCO
slug: schwarzschild-effective-potential
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: [AST3017]
curriculum_year: bsc-y2s1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [stellar, exoplanets, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Schwarzschild effective potential and the ISCO

## Physical setup

Effective radial potential for geodesics outside a Schwarzschild black
hole of mass M (geometric units G = c = 1):
- Massive: V_eff = 0.5 (1 - 2M/r)(1 + L^2 / r^2) - 0.5.
- Photon:  V_eff = 0.5 (L^2 / r^2)(1 - 2M/r).

For a massive particle, the radial equation is (dr/dtau)^2 = E^2 - 1 - 2
V_eff. Circular orbits live at extrema of V_eff. Stability requires a
local minimum.

## Governing equations

Above. Critical radii:
- Photon sphere r = 3M (unstable circular photon orbit).
- ISCO r = 6M for massive particles with L = 2 sqrt(3) M.

## Numerical method

None. Closed-form V_eff and analytic turning-point quadratic.

## Controls

- L / M: angular momentum, 2.5 to 6.
- mode: massive (0) or photon (1).
- speed: auto-sweep over L.
- Reset / Pause / Play.

## Expected qualitative features

1. L > 2 sqrt(3) M (massive): V_eff has unstable max (inner) and stable
   min (outer); two turning-point markers shown.
2. L = 2 sqrt(3) M: inflection at r = 6M (ISCO).
3. L < 2 sqrt(3) M: monotonically decreasing, no stable circular orbit.
4. Photon mode: peak at r = 3M; no minimum.

## Invariants and acceptance thresholds

1. Photon-sphere peak at r = 3M.
2. Photon peak value = L^2 / (54 M^2).
3. ISCO turning points coincide at r = 6M for L = 2 sqrt(3) M.
4. Far-field V_eff_massive ~ -M/r + L^2/(2 r^2).
5. V_eff(2M) = -1/2 at horizon.
6. Turning-point formula yields two distinct radii above ISCO.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- L = 0: pure radial fall.
- L -> infinity: V_eff approaches Newtonian centrifugal barrier.

## Visual fallback

Canvas2D only. Single panel: V_eff(r) curve, dashed vertical lines at
horizon, photon sphere, and ISCO. Yellow dots mark turning points
when applicable.

## Citations

- Carroll, Spacetime and Geometry Ch. 5.
- Hartle, Gravity Ch. 9 (`schutz-firstcourse`).

## Stretch goals

- Animate radial test-particle motion in the potential.
- Kerr (rotating) extension.
- Effective potential bifurcation diagram.

## Risk register

- For L very close to L_ISCO, discriminant L^2 - 12 M^2 can go slightly
  negative numerically; turning-point function clamps to zero.
