---
title: Brachistochrone: Why the Cycloid Wins
slug: brachistochrone-cycloid
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
---

# Brachistochrone: why the cycloid wins

## Physical setup

Three frictionless beads of equal mass slide from A = (0, 0) to B = (4, -2)
under uniform gravity g = 9.81. The paths are:
- Cycloid: x = R (theta - sin theta), y = -R (1 - cos theta), with R fixed
  by the endpoint.
- Straight line.
- Circular arc through A, tangent to the horizontal at A, passing through B.

## Governing equations

Energy conservation: v(s) = sqrt(2 g y(s)) where y(s) is the depth below
the starting height. Time to traverse: T = integral 0..L ds / v(s).

For the cycloid: theta(t) = sqrt(g / R) t (constant angular velocity in the
cycloid parameter). T_cycloid = sqrt(R / g) theta_B.

For the line: T_line = sqrt(2 L / a) where a = g sin(alpha), L = line length.

For the arc: T_arc by numerical integration of d phi / dt = v(phi) / R.

Endpoint constraint solved by bisection on theta_B for the cycloid.

## Numerical method

Closed form for cycloid (theta linear in t) and line (s quadratic in t).
Tabulated phi(t) for the arc via trapezoidal integration on 5000 nodes,
with analytic asymptotic starting condition near phi = 0 to handle the
v -> 0 singularity.

## Controls

- speed: animation speed.
- Reset / Pause / Play.

## Expected qualitative features

1. All three beads start at A, but the cycloid bead pulls ahead immediately
   because it dives more steeply.
2. The arc bead is in second place; the line bead trails.
3. Order of arrival: cycloid < arc < line.

## Invariants and acceptance thresholds

1. T_cycloid < T_line and T_cycloid < T_arc (cycloid is optimal).
2. Each curve reaches the endpoint at its calculated time.
3. Each curve starts at A = (0, 0).
4. Cycloid parametrization matches closed form to 1e-10.
5. T_cycloid = sqrt(R / g) theta_B to 1e-9.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Y_B = 0: degenerate (no descent), times all blow up.
- X_B = 0: vertical drop, all three coincide.

## Visual fallback

Canvas2D only. Top: the three curves overlaid with current bead positions.
Bottom: three horizontal time bars showing progress relative to total
traversal time.

## Citations

- Marion and Thornton, Classical Dynamics 5e Ch. 6 (`marion-thornton`).
- Lemos, Analytical Mechanics, Ch. 2 (`lemos-analytical`).

## Stretch goals

- Live time-of-arrival readout per bead.
- Drag endpoint B interactively.
- Tautochrone overlay (same time independent of release height on cycloid).

## Risk register

- Arc speed integration is singular at phi = 0; handled with analytic
  series near the start.
- The straight line is geodesic in Euclidean space but not the
  brachistochrone; this is the whole point of the demo.
