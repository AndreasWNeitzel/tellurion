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
references:
  - "Griffiths, Introduction to Electrodynamics, Fourth ed., Ch. 2."
---

# Gauss's law in 2D: flux invariant under deformation

## Explainer

### What you are looking at

Draw any closed loop around a charge and count the electric field lines
poking out through it. The number depends only on the charge inside,
not on the loop's size or shape, and is exactly zero if the charge sits
outside. Drag the charge in and out of the loop and watch the flux
readout snap between a fixed value and zero. That is Gauss's law, made
tactile.

### The field and the flux

A 2D point charge produces the planar Coulomb field

$$\mathbf E = \frac{q}{2\pi\epsilon_0\, r}\,\hat{\mathbf r},$$

pointing radially, falling off as $1/r$ (the 2D analogue of the
familiar $1/r^2$). The flux through a closed curve is the field
component crossing it, summed all the way around:

$$\Phi = \oint \mathbf E \cdot \hat{\mathbf n}\, ds.$$

### Why the shape does not matter

Gauss's law (the divergence theorem applied to Coulomb's field) says
this integral collapses to just the enclosed charge:

$$\Phi = \begin{cases}
  q/\epsilon_0, & \text{charge inside the curve},\\[2pt]
  0, & \text{charge outside}.
\end{cases}$$

Stretch the loop, dent it, make it a blob: as long as the charge stays
inside, the flux is unchanged, because field lines that leave must come
back. The playground evaluates the loop integral numerically with
Simpson quadrature and you watch the number stay pinned at
$q/\epsilon_0$, then drop to zero the instant the charge crosses the
boundary. That shape-independence is what makes Gauss's law a
calculation shortcut for any symmetric problem.

### Things to try

- Resize and distort the loop with the charge inside: the flux
  readout does not move.
- Drag the charge across the boundary and watch the flux jump to zero.
- Add the realization that the same law, in 3D, gives the field of a
  sphere or an infinite plane in one line.

### Where this comes from

The Coulomb field, the flux integral, and Gauss's law (shape
independence, charge enclosed) follow Griffiths, *Introduction to
Electrodynamics*, 5th ed., Chapter 2.

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

- Griffiths, *Introduction to Electrodynamics*, 5e, Ch. 2.

## Stretch goals

- Add a second charge (positive or negative) and show flux = sum of enclosed charges.
- Switch to 3D with a deformable closed surface; integrate over the surface.
- Show Gauss's law in differential form via the divergence-arrow visualization.

## Risk register

- The 2D blob shape can pinch through itself at extreme aspect ratios; sliders are bounded to keep it convex.
- Numerical flux integrand diverges as the charge approaches the curve. The sampler skips arrows of distance < 0.2 from the charge to keep the rendering legible.
