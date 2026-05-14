---
title: Tokamak Plasma Confinement 3D (Hero, Pending)
slug: tokamak-plasma-confinement-3d
status: needs-implementation
audience: portfolio
created: 2026-05-14
primary_uc: AST3014
supporting_ucs: [FIS3020]
curriculum_year: hero
primary_citation: goedbloed-plasma
primary_chapter: 5
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [fluids-mhd, animation, live-readout]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 8
share_state_keys: [R0, a, B0, Ip, qa]
---
# Tokamak plasma confinement (3D hero, pending)

Toroidal vacuum chamber, major $R_0$, minor $a$. $B_\phi = B_0 R_0 / R$ from coils, $B_\theta$ from Grad-Shafranov approximation on a 32x32 (R, Z) grid. Safety factor $q(r) = (r B_\phi)/(R B_\theta)$. Field lines as tube geometry colored by $|B|$ via viridis. Guiding-center test particles drift and bounce (banana orbits).

## Stack exemption

WebGL2 mandatory for the field-line tube + plasma volumetric emission. CPU mirror integrates 16 representative particles for invariant tests.

## Status

Scoped, not implemented.
