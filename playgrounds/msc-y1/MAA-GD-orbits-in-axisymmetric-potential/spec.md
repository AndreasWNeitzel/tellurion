---
title: Orbits in an Axisymmetric Potential
slug: orbits-in-axisymmetric-potential
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-GD
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: binney-tremaine
primary_chapter: 3
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [galactic, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Orbits in a disk potential
Miyamoto-Nagai potential; generic orbits are rosettes. Source: Binney-Tremaine Ch. 3 (`binney-tremaine`).

## Explainer

### What you are looking at

A star orbiting in a disk galaxy does not trace a closed ellipse like
a planet around the Sun. Because the gravitational potential is not a
point mass, the orbit fails to close and slowly fills an annulus,
drawing a rosette. The playground integrates such an orbit in a
realistic disk potential and shows the rosette and its conserved
quantities.

### The disk potential

A flattened galaxy is well described by the Miyamoto-Nagai potential

$$\Phi(R,z) = -\,\frac{G M}
  {\sqrt{R^2 + \big(a + \sqrt{z^2 + b^2}\big)^2}},$$

with $R$ the cylindrical radius, $z$ the height, $a$ a disk scale
length and $b$ a thickness. As $a\to0$ it becomes a point mass; with
$a\gg b$ it is a thick disk. It is axisymmetric (no $\phi$
dependence), which is the crucial structural fact.

### Why orbits are rosettes

Axisymmetry means the energy $E$ and the angular momentum about the
symmetry axis $L_z$ are conserved:

$$E = \tfrac12\big(\dot R^2 + R^2\dot\phi^2 + \dot z^2\big)
  + \Phi(R,z),
  \qquad
  L_z = R^2\dot\phi = \text{const}.$$

The conserved $L_z$ lets you reduce the radial motion to a 1D problem
in the effective potential

$$\Phi_\mathrm{eff}(R,z) = \Phi(R,z) + \frac{L_z^2}{2R^2},$$

whose centrifugal wall keeps the star between a minimum and maximum
radius. The star oscillates radially while it revolves; because the
radial and azimuthal periods are generally incommensurate, the orbit
never closes and instead fills a 2D annulus (the rosette), confined
between its peri- and apo-galactic radii. Only special potentials
(Kepler, harmonic) give closed orbits. The playground integrates the
orbit symplectically and shows energy and $L_z$ conserved while the
rosette fills in.

### Things to try

- Watch the orbit precess and fill an annulus rather than close
  (the rosette), bounded by peri- and apocenter.
- Read the live energy and $L_z$ holding constant (the symplectic
  integrator and the axisymmetry).
- Lower the disk thickness $b$ and start off-plane: the star also
  oscillates vertically through the disk.

### Where this comes from

The Miyamoto-Nagai potential, the conserved $E$ and $L_z$, the
effective potential, and rosette orbits follow Binney and Tremaine,
*Galactic Dynamics*, 2nd ed., Chapter 3, and Miyamoto and Nagai,
PASJ 27, 533 (1975).
