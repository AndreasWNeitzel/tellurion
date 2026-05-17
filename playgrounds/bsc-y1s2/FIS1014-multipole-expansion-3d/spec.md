---
title: Multipole Expansion: Exact vs Truncated Potential
slug: multipole-expansion-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Far away, even a messy charge cluster looks like one number. The error map shows exactly how far away "far" has to be.'
one_paragraph: 'The exact electrostatic potential of a charge cluster, its multipole expansion truncated at a chosen order, and the error between them, shown as three field maps. The error blows up near the charges and collapses far away, and each extra term tightens it; a sweeping probe traces the relative error against distance. Exact and multipole come from the headless sim.js.'
tags: [electromagnetism, field-visualization, interactive-drag, animation]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
share_state_keys: []
---

# Multipole Expansion: Exact vs Truncated Potential

## Physical setup

A small cluster of point charges. Three maps of the `z = 0`
potential slice are shown: the exact Coulomb sum, the multipole
expansion truncated at the selected order, and the absolute error.

## Governing equations

$$V(\mathbf r)=K\!\left[\frac{Q}{r}+\frac{\mathbf p\cdot\hat{\mathbf r}}{r^2}
+\frac{1}{2}\frac{Q_{ij}\hat r_i\hat r_j}{r^3}+\dots\right],$$

with `Q = sum q`, `p = sum q r`, `Q_ij = sum q (3 x_i x_j - r^2 d_ij)`.

## Numerical method

Exact potential is the direct sum over point charges; the multipole
potential uses the Cartesian moments to the chosen order. The error
field is sampled on a grid and the relative error along a ray traced
into a side panel.

## Controls

- distribution selector (single off-centre charge, dipole,
  quadrupole, octupole, offset pair).
- expansion-order selector (monopole, +dipole, +quadrupole).
- source-size slider; click a map to add a charge; Reset, Pause.

## Expected qualitative features

- The error map is near-zero everywhere except a hot spot at the
  charges.
- Higher truncation order visibly shrinks the error.
- Far field decays as 1/r (net charge), 1/r^2 (dipole), 1/r^3
  (quadrupole).

## Invariants and acceptance thresholds

- Single charge at the origin: monopole term exact.
- Net charge: monopole dominates far away within 2%.
- Pure dipole: zero monopole, far field ~ 1/r^2.
- Pure quadrupole: zero monopole and dipole, far field ~ 1/r^3.
- Truncation error decreases with distance and with added order.
- A pure dipole has a vanishing quadrupole moment.

## Limiting cases for verification

- Centred single charge: exact at monopole order.
- `r -> infinity`: leading nonzero multipole dominates.

Source: Griffiths, *Introduction to Electrodynamics*, 4th ed.,
Sec. 3.4 (`griffithsem2017`); Jackson, *Classical Electrodynamics*,
Sec. 4.1.
