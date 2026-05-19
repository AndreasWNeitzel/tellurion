---
title: Exoplanet Interior (Hero)
description: Pick a composition, watch the cutaway. A layered terrestrial planet (iron core, silicate mantle, optional water and gas envelope) at chosen mass; the central pressure, the mass-radius position, and the pressure profile are computed live from a constant-density hydrostatic balance.
caption: Figure 1. Layered planet cutaway with the mass-radius curve and the pressure profile. Source: Seager et al. ApJ 669 (2007) 1279; Zapolsky and Salpeter ApJ 158 (1969) 809.
slug: exoplanet-interior-3d
status: verified
audience: portfolio
created: 2026-05-20
program: EVF
course: EVF Planets / IA exoplanets
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: seager-massradius
primary_chapter: 1
hook: 'Pick a composition. The cutaway reorganises and the central pressure jumps an order of magnitude.'
one_paragraph: 'Layered terrestrial planet under the constant-density approximation: an iron core, a silicate mantle, an optional water/ice layer, an optional H/He envelope, each at its characteristic density. Mass conservation fixes the interface radii, hydrostatic equilibrium gives a closed-form central pressure, and the mass-radius curve falls on the standard families (pure iron is the densest, an H/He envelope inflates the planet). The 3D cutaway shows the layered structure as the planet rotates; the side panels track the mass-radius position and the pressure profile from centre to surface.'
tags: [planetary, mass-radius, hydrostatic, animation, hero]
difficulty: 4
tier: single
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [Mearth, fIron, fSil, fWater, fGas]
---

# Exoplanet Interior

## Explainer

### What you are looking at

A terrestrial-to-mini-Neptune planet decomposed into concentric layers
of (in order from the centre): an iron core, a silicate mantle, an
optional water/ice layer, an optional H/He envelope. The big panel is
a 3D cutaway sphere that rotates so you can see the layered structure;
the side panels show where this planet falls on a family of mass-
radius curves and the pressure profile from the centre to the
surface.

### The physics under the hood

Each layer has a characteristic density (`iron 8300, silicate 4100,
water 1460, gas 220 kg/m^3`). Mass conservation gives the next layer's
outer radius:

$$R_i^3 = R_{i-1}^3 + \frac{3 M_i}{4\pi \rho_i},$$

so the user-set mass fractions completely determine the radii.

Hydrostatic equilibrium $dP/dr = -\rho g(r)$ with $g(r) = G m(r)/r^2$
and $m(r)$ cumulative is exactly integrable within a uniform-density
layer; the closed-form central pressure is

$$P_c = \sum_k G\,\rho_k \left[\frac{M_{<,k}}{r}
        - \frac{4\pi \rho_k}{6}\,r^2 \right]_{R_{k,\text{outer}}}^{R_{k,\text{inner}}}.$$

The constant-density approximation drops the compression term in the
equation of state. Compared to the full polytropic equations of state
of Seager+ (ApJ 669, 2007, 1279) it gets the qualitative ordering
right (pure iron is the densest, water inflates the radius, an H/He
envelope inflates it more) and reproduces Earth's radius to about
10 %.

### Things to try

- Drag the iron and silicate sliders: the cutaway re-layers, the
  central pressure jumps, and the mass-radius dot snaps to a new
  family.
- Add a water layer. The radius grows but the central pressure
  drops because the average density falls.
- Add a H/He envelope. The radius can double; this is the
  mini-Neptune branch.
- Pick the "Mercury-like" preset (70 % iron). Notice the much smaller
  radius for the same mass: a strong stamp on the mass-radius plane.

### Invariants

- Mass conservation: the sum of layer masses equals the input mass.
- Hydrostatic monotonicity: pressure is non-increasing from the
  centre to the surface (no inversions).
- Mass-radius monotonicity: at fixed composition, radius grows with
  mass.

### Acceptance thresholds

- Earth-like (32 % iron / 68 % silicate) at 1 $M_\oplus$ returns a
  radius in $[0.9, 1.1]\,R_\oplus$.
- Central pressure is strictly positive for every composition.
- Pure iron is denser than silicate is denser than water is denser
  than H/He, reflected in the mass-radius curves.

### References

- Seager et al., ApJ 669 (2007) 1279.
- Zapolsky and Salpeter, ApJ 158 (1969) 809.
- Fortney et al., ApJ 659 (2007) 1661 (gas envelopes).
