---
title: Multipole Expansion: Exact vs Truncated Potential
slug: multipole-expansion-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Far away, even a messy charge cluster looks like one number. The error map shows exactly how far away "far" has to be.'
one_paragraph: 'Far from a localized charge cluster the potential can be expanded in inverse powers of distance, V(r) = (1/4 pi eps0)[q/r + p.rhat/r^2 + quadrupole/r^3 + ...], the multipole expansion: a far observer sees first the net charge, then the dipole, then finer structure. The three field maps show the exact potential, the expansion truncated at a chosen order, and their difference. The error is large near the charges (where the expansion does not converge) and falls off rapidly with distance, and each extra term tightens it further out; a sweeping probe traces the relative error against distance so the 1/r, 1/r^2, 1/r^3 hierarchy is explicit. Reference: Griffiths, Introduction to Electrodynamics, Chapter 3; Jackson, Classical Electrodynamics, Chapter 4.'
tags: [electromagnetism, field-visualization, interactive-drag, animation]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
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

# Multipole Expansion: Exact vs Truncated Potential

## Explainer

### What you are looking at

Far from a clump of charges you do not need every charge to know the
field; a few summary numbers (total charge, dipole, quadrupole) are
enough. The playground shows the exact potential, the multipole
approximation truncated at a chosen order, and the error between them,
so you watch the approximation get better as you add terms and worse as
you move closer.

### The expansion

Outside the charges, the potential can be written as a series in
decreasing powers of distance $r$:

$$V(\mathbf r) = K\left[\frac{Q}{r}
  + \frac{\mathbf p\cdot\hat{\mathbf r}}{r^2}
  + \frac12\frac{Q_{ij}\,\hat r_i\hat r_j}{r^3} + \dots\right].$$

Each term is one multipole:

- Monopole $Q = \sum q$: the net charge, field falls as $1/r^2$.
- Dipole $\mathbf p = \sum q\,\mathbf r$: dominates when $Q=0$, field
  falls faster, as $1/r^3$.
- Quadrupole $Q_{ij} = \sum q\,(3x_i x_j - r^2\delta_{ij})$: the
  leading term when both $Q$ and $\mathbf p$ vanish, $1/r^4$.

### Why it works (and when it fails)

Each successive term falls off one power of $r$ faster, so far away the
first non-zero moment dominates and the rest are negligible. That is
why a distant ion looks like a point charge and a neutral molecule
looks like a dipole. Up close, near or inside the charge cluster, the
series is slow or divergent and you need the exact sum. The error map
shows exactly this: small and shrinking far out as you raise the order,
large and stubborn near the charges.

### Things to try

- Use a neutral pair (zero monopole) and watch the dipole term carry
  the field, falling as $1/r^3$.
- Raise the truncation order and watch the error map fade far from the
  cluster but stay bright close in.
- Move the evaluation ray inward and see where the expansion stops
  being trustworthy.

### Where this comes from

The multipole expansion and the Cartesian monopole, dipole, and
quadrupole moments follow Griffiths, *Introduction to Electrodynamics*,
5th ed., Chapter 3 (multipole expansion).

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
Sec. 3.4; Jackson, *Classical Electrodynamics*,
Sec. 4.1.
