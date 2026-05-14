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
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [relativity, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Parallel transport on a sphere

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
