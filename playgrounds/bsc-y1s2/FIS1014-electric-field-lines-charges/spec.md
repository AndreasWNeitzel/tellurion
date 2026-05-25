---
title: Electric Field Lines from Point Charges
slug: electric-field-lines-charges
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1014
primary_citation: taylor-mech
supporting_ucs: []
curriculum_year: bsc-y1s2
hook: "Electric field lines make the invisible field visible: each line is everywhere tangent to E, and where the lines crowd together the field is strong. Watch the classic patterns appear, a dipole's bridge, two like charges pushing apart, the four-lobed quadrupole, a lone charge's starburst."
one_paragraph: "The field of a set of point charges is the vector sum E = sum_i q_i (r - r_i) / |r - r_i|^3. This draws its field lines as the curves everywhere tangent to E, seeded around each charge: they stream out of positive charges and into negative ones, and by Gauss's law their local density tracks the field strength. Step through four canonical layouts (dipole, two like charges, quadrupole, a single monopole) or drag any charge and the lines retrace live. Shoot a test charge from the left and it follows F = qE, accelerating toward unlike charges and recoiling from like ones. The invariants pin the physics: one charge's far field falls as 1/r^2, the dipole midpoint field is purely axial, two equal like charges give a zero-field point at their midpoint, and higher multipoles fall off faster."
tags: [electromagnetism, animation, live-readout]
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
references:
  - "Taylor, Classical Mechanics."
---

# Electric field lines from point charges

## Explainer

### What you are looking at

Field lines are the picture Faraday invented to make an invisible
force field visible: lines that start on positive charges, end on
negative ones, and whose density tells you the field strength. The
playground draws them live for a handful of point charges you can
move around.

### The field and superposition

Each point charge contributes a Coulomb field, and the total is the
vector sum (superposition):

$$\mathbf E(\mathbf r) = \frac{1}{4\pi\varepsilon_0}
  \sum_i q_i\,
  \frac{\mathbf r - \mathbf r_i}{|\mathbf r - \mathbf r_i|^3}.$$

A field line is a curve everywhere tangent to $\mathbf E$; the
playground traces it by integrating $d\mathbf r/ds = \hat{\mathbf E}$
outward from each charge.

### What the picture encodes

The drawing rules carry real physics:

- Lines begin on $+$ charges and end on $-$ charges (or run to
  infinity); the number attached to a charge is proportional to its
  magnitude, so a $2q$ charge sprouts twice as many lines.
- Line density is proportional to $|\mathbf E|$: where lines crowd,
  the field is strong; where they spread, it is weak. This is Gauss's
  law made visual, the flux through any closed surface counts the
  enclosed charge.
- Field lines never cross (the field has one direction at each
  point), and they meet conductors at right angles.
- Points where the field vanishes (between like charges) are null
  points where lines split: separatrices of the flow.

Equipotential surfaces are everywhere perpendicular to the lines, so
the same picture also shows how the potential is organized. The
playground updates the lines, nulls, and equipotentials in real time
as you drag the charges, turning the abstract $1/r^2$ law into a
readable flow.

### Things to try

- Make a dipole ($+$ and $-$) and see the classic curved lines from
  plus to minus.
- Set two equal positive charges and find the null point between
  them where lines avoid and split.
- Increase one charge's magnitude and watch proportionally more
  lines emanate from it (the flux/Gauss bookkeeping).

### Where this comes from

The field-line construction, superposition, and the link to Gauss's
law follow Griffiths, *Introduction to Electrodynamics*, Chapter 2.

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
