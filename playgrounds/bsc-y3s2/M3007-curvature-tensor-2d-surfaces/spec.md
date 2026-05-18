---
title: Gaussian Curvature of 2D Surfaces
slug: curvature-tensor-2d-surfaces
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: M3007
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: riley-hobson
primary_chapter: 26
hook: 'A sphere curves the same way everywhere, a cylinder not at all, a saddle the opposite way: one number, the Gaussian curvature, captures the difference.'
one_paragraph: 'Gaussian curvature K measures how a surface bends in two directions at once: positive where it domes (a sphere), zero where it can be unrolled flat (a cylinder), negative where it saddles (the hyperbolic plane), and varying in sign across a torus. It is intrinsic, a flat creature living in the surface could measure it without ever leaving, which is the content of Gauss''s Theorema Egregium. The playground shows K across these four surfaces. It is the foundation of differential geometry and of general relativity''s curved spacetime. Reference: Riley, Hobson and Bence, Mathematical Methods, Ch. 26.'
tags: [relativity, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Gaussian curvature
Sphere, cylinder, hyperbolic plane, and torus. Source: Riley-Hobson Ch. 26 (`riley-hobson`).

## Explainer

### What you are looking at

Some surfaces curve, some do not, and the difference is a single number
at each point: the Gaussian curvature. A sphere has it positive
everywhere, a cylinder exactly zero, a saddle negative, and a torus all
three. The playground shows it on those four surfaces. The deep point
is that a flat creature living in the surface could measure it without
ever leaving.

### Two principal curvatures, one product

At any point a surface bends by different amounts in different
directions. The extreme bending rates are the two principal curvatures
$\kappa_1, \kappa_2$. The Gaussian curvature is their product:

$$K = \kappa_1\,\kappa_2.$$

- Sphere of radius $R$: $\kappa_1=\kappa_2=1/R$, so $K = 1/R^2 > 0$
  (a dome, curving the same way both ways).
- Cylinder: one direction curves ($1/R$), the axial direction is
  straight ($0$), so $K = 0$. It is intrinsically flat, you can unroll
  it onto paper without stretching.
- Hyperbolic (saddle): the two curvatures have opposite sign, so
  $K < 0$.
- Torus: $K > 0$ on the outer rim, $K < 0$ on the inner throat,
  $K = 0$ on the top and bottom circles.

### Theorema Egregium

Gauss's "remarkable theorem": $K$ is intrinsic. It can be computed
purely from distances measured within the surface (the metric), with no
reference to how the surface sits in 3D. That is why a flat map of the
spherical Earth must distort areas or angles ($K\ne0$ cannot be flattened
to $K=0$ without stretching), and it is the conceptual seed of general
relativity, where intrinsic curvature of spacetime is gravity. The
playground colors $K$ across each surface so the sign pattern is
visible.

### Things to try

- Compare sphere ($K>0$ everywhere) and cylinder ($K=0$): the cylinder
  unrolls flat, the sphere cannot.
- On the torus, find the positive-$K$ outer rim, negative-$K$ inner
  throat, and the zero-$K$ circles between.
- Note the saddle's opposite-sign principal curvatures giving $K<0$.

### Where this comes from

Principal curvatures, the Gaussian curvature $K=\kappa_1\kappa_2$, and
the Theorema Egregium follow Riley, Hobson and Bence, *Mathematical
Methods for Physics and Engineering*, Chapter 26.
