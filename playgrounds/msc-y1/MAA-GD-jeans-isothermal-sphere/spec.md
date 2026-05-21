---
title: Jeans Isothermal Sphere
slug: jeans-isothermal-sphere
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-GD
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: binney-tremaine
primary_chapter: 4
hook: 'The simplest model that explains why galaxy rotation curves are flat (the original dynamical case for dark matter): a self-gravitating ball whose particle speeds are the same everywhere.'
one_paragraph: 'Treat the stars or dark matter as an isothermal self-gravitating fluid with a constant velocity dispersion sigma acting like a fixed temperature. Hydrostatic equilibrium against its own gravity (equivalently the isotropic Jeans equation) has the exact singular solution rho(r) = sigma^2 / (2 pi G r^2). Because the enclosed mass then grows linearly with radius, M(r) proportional to r, the circular speed v_c = sqrt(G M(r)/r) = sqrt(2) sigma is independent of radius: a flat rotation curve with no fine tuning, which is exactly what extended dark halos reproduce in real galaxies. The playground plots the density, enclosed mass and the resulting flat rotation curve as sigma is varied. Reference: Binney and Tremaine, Galactic Dynamics 2e, Chapter 4.'
tags: [galactic, animation, live-readout]
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
---
# Singular isothermal sphere
$\rho \propto r^{-2}$ gives a flat rotation curve $v_c = \sqrt 2 \sigma$. Source: Binney-Tremaine Ch. 4 (`binney-tremaine`).

## Explainer

### What you are looking at

The simplest model that explains why galaxy rotation curves are flat
(the original dynamical evidence for dark matter) is the singular
isothermal sphere: a self-gravitating ball of "gas" where the
particle speeds are the same everywhere. The playground shows its
density, enclosed mass, and the resulting flat rotation curve.

### The model

Treat the stars (or dark matter) as an isothermal self-gravitating
fluid: constant velocity dispersion $\sigma$ acting like a constant
"temperature". Hydrostatic equilibrium against the body's own gravity
(equivalently the isotropic Jeans equation) has the exact singular
solution

$$\rho(r) = \frac{\sigma^2}{2\pi G\,r^2}.$$

The $r^{-2}$ density falloff is the key: density drops outward but
mass keeps accumulating.

### Why the rotation curve is flat

Integrate the density to get the mass inside radius $r$:

$$M(<r) = \int_0^r 4\pi r'^2\rho\,dr'
  = \frac{2\sigma^2}{G}\,r,$$

which grows linearly with radius forever. The circular speed of a
test star is then

$$v_c(r) = \sqrt{\frac{G\,M(<r)}{r}}
  = \sqrt{2}\,\sigma = \text{constant}.$$

The radius cancels: the rotation curve is flat at $v_c=\sqrt2\,\sigma$
at all radii. That is exactly the behavior observed in real galaxies
far beyond the visible disk, and it requires mass that keeps growing
($M\propto r$) where there is little light, the halo. The cost of
the model is that the central density diverges (hence "singular"),
fixed in practice by a finite core. The playground sweeps $\sigma$
and shows $\rho\propto r^{-2}$, $M\propto r$, and the flat
$v_c=\sqrt2\,\sigma$.

### Things to try

- Confirm the rotation curve is flat at all radii (the dark-matter
  signature) rather than Keplerian $v\propto r^{-1/2}$.
- Change $\sigma$ and watch the flat level move as $\sqrt2\,\sigma$.
- Note the enclosed mass rising linearly with $r$ while the density
  falls as $r^{-2}$.

### Where this comes from

The singular isothermal sphere, its $r^{-2}$ density, and the flat
$v_c=\sqrt2\,\sigma$ rotation curve follow Binney and Tremaine,
*Galactic Dynamics*, 2nd ed., Chapter 4.
