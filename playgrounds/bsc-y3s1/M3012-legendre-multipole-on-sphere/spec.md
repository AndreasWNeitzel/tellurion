---
title: Legendre Polynomials and Multipoles
slug: legendre-multipole-on-sphere
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M3012
curriculum_year: bsc-y3s1
primary_citation: jackson-em
primary_chapter: 3
hook: "Far from any charge, the potential becomes a sum of multipoles, and each one's angular shape is a Legendre polynomial with its own nodal cones."
one_paragraph: "The multipole expansion of a potential carries the angular dependence P_l(cos theta): the monopole is isotropic, the dipole is cos theta with one nodal cone, the quadrupole has two, and in general P_l has l zeros in (-1,1), the l nodal cones separating l+1 lobes of alternating sign. The playground draws the angular shape as a polar lobe diagram about the symmetry axis, red where P_l is positive and blue where negative, with the nodal cones marked, and a probe sweeping the polar angle ties the lobe radius to the polynomial; the diagnostic plots P_l(x) with x = cos theta and its l roots."
tags: [math-methods, legendre-polynomials, multipole-expansion, complex-analysis, animation, interactive]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [l]
invariants:
  - key: cones
    label: P_l has exactly l nodal cones (roots in (-1,1)), giving l+1 lobes
    tolerance: 0.0
  - key: endpoints
    label: P_l(1) = 1 and P_l(-1) = (-1)^l
    tolerance: 1e-6
  - key: orthogonal
    label: the Legendre polynomials are orthogonal on [-1,1]
    tolerance: 1e-2
what_to_try:
  - Step the multipole; each increment of l adds one nodal cone and one lobe.
  - Compare the dipole (one equatorial node) and the quadrupole (two cones).
  - Watch the probe: the lobe radius is |P_l(cos theta)|, read off the curve at x = cos theta.
references:
  - "Jackson, Classical Electrodynamics, 3rd ed., Sec. 3.2-3.3 (multipole expansion)."
  - "Arfken, Weber, Harris, Mathematical Methods for Physicists, 7th ed., Sec. 15."
---

# Legendre polynomials and multipoles

## Mathematical setup

The potential of a localised charge expands far away in multipoles, whose angular
shapes are the Legendre polynomials P_l(cos theta).

## Equations

By Bonnet's recurrence $(l+1)P_{l+1} = (2l+1)x P_l - l P_{l-1}$. Each $P_l$ has l
roots in $(-1,1)$, the nodal cones, separating $l+1$ alternating lobes, with
$P_l(1) = 1$, $P_l(-1) = (-1)^l$, and the orthogonality
$\int_{-1}^1 P_l P_m\,dx = \tfrac{2}{2l+1}\delta_{lm}$.

## Numerical method

No engine. Legendre polynomials by Bonnet recurrence; roots by scanning and
bisection; the lobe diagram is the polar plot of |P_l(cos theta)|.

## Controls

- Next multipole (l = 0 to 5).

## Expected qualitative features

1. The number of nodal cones is l, and the number of lobes is l+1.
2. Lobes alternate in sign across each cone.
3. The polynomial is normalized to 1 at the pole and (-1)^l at the antipode.

## Invariants and acceptance thresholds

- P_l has l nodal cones.
- $P_l(1) = 1$, $P_l(-1) = (-1)^l$.
- Orthogonality on $[-1,1]$.

## Citations

Jackson, Classical Electrodynamics, 3rd ed., Sec. 3.2-3.3. Arfken, Weber, Harris,
Mathematical Methods for Physicists, 7th ed., Sec. 15.
