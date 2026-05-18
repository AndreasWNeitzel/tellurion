---
title: Gauss Law in 2D
slug: gauss-law-flux-through-surface
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffithsem2017
primary_chapter: 2
hook: 'Wrap any loop you like around a charge and the flux through it is the same number; slide the charge outside and it drops to zero, no matter how you bend the loop.'
one_paragraph: 'Gauss''s law says the electric flux through a closed surface depends only on the charge enclosed, never on the shape or size of the surface. Here a point charge sits in a plane and you draw a closed curve around it (a circle, an ellipse, or a wobbly blob); the playground integrates E.n around the curve by Simpson quadrature and shows the flux live. Drag the charge or reshape the loop: while the charge stays inside, the flux holds fixed at q/epsilon_0; the instant it crosses outside, the flux collapses to zero. That shape independence is the entire content of Gauss''s law, and it is what lets you trade a hard field integral for a trivial charge count.'
tags: [electromagnetism, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Gauss's law in 2D: flux invariant under deformation

## Physical setup

A 2D point charge $q$ at user-set position generates the planar Coulomb field $\mathbf{E} = q / (2 \pi \epsilon_0 r) \hat r$. A user-controlled closed curve (ellipse or perturbed-ellipse blob) is drawn around the charge, and the flux $\oint \mathbf{E} \cdot \hat n\,ds$ is computed numerically via Simpson quadrature.

By Gauss's theorem in 2D, the flux equals $q / \epsilon_0$ whenever the charge sits inside, and zero whenever it sits outside, independent of the shape of the curve.

## Numerical method

Simpson 1/3 quadrature at $n = 400$ subintervals on the parameter $t \in [0, 2\pi]$ along the curve. The outward-normal integrand is $E_x \dot y - E_y \dot x$ for counterclockwise parameterization.

## Controls

- Shape selector (ellipse, blob).
- Ellipse semi-axes $a$ and $b$.
- Charge x-position (charge always at $y = 0$).

## Expected qualitative features

1. Flux exactly $q / \epsilon_0$ for any ellipse aspect ratio enclosing the charge.
2. Flux drops to zero when the charge crosses the boundary.
3. Blob (3-lobed perturbation) gives the same flux as the unperturbed ellipse.
4. E-field arrows visibly diverge from the charge; the loop color flips between accent (inside) and muted (outside).

## Invariants and acceptance thresholds

| invariant | threshold | location |
| flux through enclosing unit circle equals $q/\epsilon_0$ | within $10^{-6}$ | invariants test |
| flux invariant under aspect ratio (still enclosing) | within $10^{-6}$ | invariants test |
| flux zero when charge is outside | within $10^{-6}$ relative | invariants test |
| flux invariant under blob deformation | within $10^{-6}$ | invariants test |
| flux scales linearly with charge | within $10^{-6}$ | invariants test |
| insideEllipse correctly classifies points | exact | invariants test |
| field is repulsive for positive charge | $E_x > 0$ right of origin | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $q = 0$: flux is zero everywhere.
- Curve degenerates to a point: numerical instability; the sliders keep the curve macroscopic.
- Multiple charges (not implemented): flux equals total enclosed charge.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Griffiths, *Introduction to Electrodynamics*, 5e, Ch. 2 (`griffithsem2017`).

## Stretch goals

- Add a second charge (positive or negative) and show flux = sum of enclosed charges.
- Switch to 3D with a deformable closed surface; integrate over the surface.
- Show Gauss's law in differential form via the divergence-arrow visualization.

## Risk register

- The 2D blob shape can pinch through itself at extreme aspect ratios; sliders are bounded to keep it convex.
- Numerical flux integrand diverges as the charge approaches the curve. The sampler skips arrows of distance < 0.2 from the charge to keep the rendering legible.
