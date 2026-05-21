---
title: Parallel Transport on a Sphere
slug: parallel-transport-on-sphere
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M3007
supporting_ucs: [AST3017]
curriculum_year: bsc-y3s2
primary_citation: carroll2019
primary_chapter: 3
hook: 'Carry an arrow around a triangle on a globe, always keeping it parallel, and it comes back rotated by exactly the area you enclosed.'
one_paragraph: 'Parallel transport slides a vector along a path without ever turning it relative to the surface. On a flat plane a round trip returns it unchanged; on a sphere it comes back rotated, and the rotation angle equals the solid angle (area) enclosed by the loop. For a spherical triangle this is the angle excess A + B + C - pi, the Gauss-Bonnet theorem made tactile. The playground transports a vector around a spherical triangle and shows the leftover rotation (the holonomy). This rotation-from-curvature is the geometric core of gauge theory and general relativity. Reference: Carroll, Spacetime and Geometry, Ch. 3.'
tags: [relativity, animation, live-readout]
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

# Parallel transport on a sphere

## Explainer

### What you are looking at

Carry an arrow around a triangle drawn on a globe, always keeping it
"as parallel as possible" to itself. On a flat plane it returns
unchanged. On the sphere it comes back rotated, by an angle exactly
equal to the area you enclosed. That rotation-from-curvature is the
geometric heart of gauge theory and general relativity.

### Parallel transport and holonomy

Parallel transport moves a vector along a path without turning it
relative to the surface (zero covariant derivative along the path). On
a curved surface a round trip leaves a leftover rotation, the holonomy.
For a spherical triangle with one vertex at the pole, the other two at
colatitude $\alpha$ separated by longitude $\beta$, the rotation is the
enclosed solid angle

$$\Omega = (1 - \cos\alpha)\,\beta.$$

### Gauss-Bonnet: curvature = angle excess

This is the Gauss-Bonnet theorem in miniature. A triangle's interior
angles sum to more than $\pi$ on a sphere, and that excess equals the
integrated curvature over the enclosed region:

$$A + B + C - \pi = \iint K\,dA = \Omega,$$

which on the unit sphere ($K = 1$) is simply the enclosed area. So the
arrow's leftover rotation, the triangle's angle excess, and the
enclosed area are all the same number. Flat space has zero excess and
zero holonomy; the deviation measures curvature intrinsically. The same
idea (a vector rotated by transport around a loop) is how curvature is
defined in general relativity and how the Berry phase arises in quantum
mechanics. The playground transports a vector around an adjustable
spherical triangle and shows the holonomy match the area.

### Things to try

- Shrink the triangle: the holonomy shrinks toward zero (small patches
  look flat).
- Grow it toward a hemisphere and watch the rotation approach a large
  fraction of a full turn.
- Confirm the leftover rotation equals the angle excess $A+B+C-\pi$.

### Where this comes from

Parallel transport, holonomy, and the Gauss-Bonnet angle-excess result
follow Carroll, *Spacetime and Geometry*, Chapter 3.

## Physical setup

A spherical triangle on the unit sphere with one vertex at the north pole and the other two at colatitude $\alpha$ separated by longitude $\beta$. Parallel-transporting a vector around the triangle rotates it by the enclosed solid angle
$$\Omega = (1 - \cos\alpha) \beta.$$

This is Gauss-Bonnet on a constant-curvature surface: angle excess $A + B + C - \pi$ equals the integrated curvature, which on the unit sphere is just the enclosed area.

## Numerical method

Closed-form. The 3D sphere is rendered as an oblique-projection wireframe; the three great-circle arcs are slerp interpolations.

## Controls

- $\alpha$ (colatitude) from 5 to 90 deg.
- $\beta$ (longitude span) from 10 to 180 deg.

## Expected qualitative features

1. Full hemisphere ($\alpha = 90, \beta = 360$): holonomy = $2\pi$ (full rotation).
2. Quarter octant ($\alpha = \beta = 90$): holonomy = $\pi/2$.
3. Tiny triangle: holonomy ~ enclosed area $\to 0$.
4. The Gauss-Bonnet identity $A + B + C - \pi = \Omega$ matches the directly computed solid angle.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| hemisphere holonomy = $2\pi$ | within $10^{-12}$ | invariants test |
| quarter octant holonomy = $\pi/2$ | within $10^{-12}$ | invariants test |
| degenerate $\alpha = 0$ gives zero holonomy | within $10^{-12}$ | invariants test |
| $A + B + C - \pi = \Omega$ (Gauss-Bonnet) | within $10^{-12}$ | invariants test |
| sphericalToCartesian round-trips standard points | exact | invariants test |
| holonomy monotonic in $\beta$ at fixed $\alpha$ | strict | invariants test |
| holonomy monotonic in $\alpha$ at fixed $\beta$ | strict | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- Foucault pendulum: rotates by $2\pi (1 - \cos\theta)$ per day at latitude $\theta$; that is the parallel-transport holonomy on a circle of constant latitude. The companion `foucault-pendulum` playground demonstrates it dynamically.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Carroll, *Spacetime and Geometry*, Ch. 3 (`carroll2019`) for the GR-textbook treatment.
- do Carmo, *Differential Geometry of Curves and Surfaces*, for the rigorous derivation.

## Stretch goals

- Animate the transported vector around the triangle.
- Show the comparison to the Foucault-pendulum holonomy at a given latitude.
- Switch to a hyperbolic geometry (constant negative curvature) and show defect of $A + B + C$ below $\pi$.

## Risk register

- The oblique-orthographic projection makes the sphere render as an ellipse; this is intentional for visual clarity and is the standard graphics-textbook orthographic view.
