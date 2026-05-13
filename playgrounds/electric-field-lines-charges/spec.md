---
title: Electric Field Lines from Point Charges
slug: electric-field-lines-charges
status: verified
audience: portfolio
created: 2026-05-13
---

# Electric field lines from point charges

## Physical setup

A small set of point charges in the plane. The electric field is
  E(r) = sum_i q_i (r - r_i) / |r - r_i|^3
(units chosen so that the Coulomb constant is 1).

Four configurations:
1. Dipole: +q at (-0.8, 0), -q at (+0.8, 0).
2. Two like + charges at (plus minus 0.8, 0).
3. Quadrupole: four charges at (plus minus 0.7, plus minus 0.7) with
   alternating signs (+ -)/(- +).
4. Single + charge at origin.

## Governing equations

Above. Field lines are integral curves of E; their density on the plane
is proportional to |E| (Gauss in 2D).

## Numerical method

For each positive charge, emit 16 field lines uniformly in angle from a
small sphere of radius 0.08. Trace each line in the +E direction (or -E
from negative charges) with arc-length step 0.04 until either the line
enters a 0.1-neighborhood of any charge (sink) or leaves the bounding box.

Test charge motion (when shot) integrates dv/dt = q E with mass 1 by
explicit Euler with dt = 0.005.

## Controls

- 4 preset buttons: dipole, two +, quadrupole, monopole.
- shoot test charge: launches a test charge from the left edge.
- Reset / Pause / Play.

## Expected qualitative features

1. Dipole: lines bridge from + to -, equal in number, symmetric.
2. Two +: lines repel each other; midpoint (0, 0) has zero field.
3. Quadrupole: four lobes with alternating circulation patterns.
4. Monopole: radial lines decaying as 1 / r^2.
5. Test charge curves toward negative charges, away from positive ones.

## Invariants and acceptance thresholds

1. Monopole: |E| approaches q / r^2 within 1 percent at r = 5.
2. Dipole midpoint: E purely along axis from + to -.
3. Two + symmetric midpoint: E = 0 within 1e-12.
4. Monopole + outflow: field-line tracing exits the bounding box.
5. Quadrupole / monopole magnitude ratio decreases with r (higher multipole
   decays faster).
6. Field reverses sign with the charge: E([-q]) = -E([+q]).
7. Emission geometry: 8 points per charge at radius 0.08.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Large r from any configuration: monopole-dominant.
- Far-field of dipole: 1 / r^3 falloff (verified by ratio test).

## Visual fallback

Canvas2D only. Field lines in muted gold, arrowheads at 60 percent along
each line. Charges color-coded (warm orange = +, cool blue = -). Optional
test charge with white trail.

## Citations

- Griffiths, Introduction to Electrodynamics 4e Ch. 2.

## Stretch goals

- Drag charges interactively.
- Continuous charge distributions (rod, sphere).
- 3D field-line projection.

## Risk register

- Field magnitude diverges at the charge centers. Mitigated by 1e-6
  softening in the denominator.
- Test charge can pass straight through a negative charge if dt is too
  coarse; the demo terminates instead when it exits the box.
