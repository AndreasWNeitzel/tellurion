---
title: Gradient and Directional Derivative
slug: gradient-directional-derivative
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: M1015
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: stewart2015
primary_chapter: 14
hook: "The gradient points straight uphill and sits perpendicular to the contour; the directional derivative is its projection onto whichever way you walk, a cosine that peaks along the gradient and vanishes along the level set."
one_paragraph: "For a scalar field f(x,y) the gradient grad f = (f_x, f_y) points in the direction of steepest ascent, has length equal to that steepest slope, and is perpendicular to the contour. The slope felt walking along a unit direction u is the directional derivative D_u f = grad f . u = |grad f| cos(theta - theta_grad). The playground draws f as a heatmap with contours and gradient arrows, a draggable probe with its gradient vector and a chosen direction u, and the directional derivative as the green projection of the gradient onto u. The diagnostic is D_u f versus direction angle, a cosine peaking along the gradient (value |grad f|), crossing zero ninety degrees off (along the level set) and reaching its minimum in the downhill direction. Pick the gaussian hill, the saddle, the ripple or a two-hill landscape."
tags: [calculus, vector-calculus, interactive, live-readout]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: []
invariants:
  - key: maxalong
    label: the directional derivative along the gradient equals |grad f|
    tolerance: 1e-6
  - key: perpzero
    label: the directional derivative perpendicular to the gradient is zero
    tolerance: 1e-6
  - key: gradient-check
    label: the analytic gradient matches central finite differences
    tolerance: 1e-5
what_to_try:
  - Drag the probe to a steep flank; the gradient arrow lengthens and the cosine curve grows taller.
  - Swing the direction onto the gradient; the green projection reaches the full gradient length and D_u f peaks.
  - Turn the direction perpendicular to the gradient; the projection collapses to zero (walking along a contour).
references:
  - "Stewart, Calculus, 8e, Sec. 14.6 (directional derivatives and the gradient)."
  - "Marsden and Tromba, Vector Calculus, 6e, Ch. 2."
---

# Gradient and directional derivative

## Physical setup

A scalar field $f(x, y)$ over the square $[-2.2, 2.2]^2$, drawn as a heatmap
with contour lines (level sets) and a coarse field of gradient arrows. A
draggable probe sits at a point $(x_0, y_0)$; a slider sets a unit direction
$\mathbf{u} = (\cos\theta, \sin\theta)$.

## Equations

The gradient is $\nabla f = (f_x, f_y)$. It points in the direction of steepest
ascent, $|\nabla f|$ is the maximum slope, and $\nabla f \perp$ the contour. The
directional derivative along $\mathbf{u}$ is

$$D_{\mathbf{u}} f = \nabla f \cdot \mathbf{u}
  = f_x \cos\theta + f_y \sin\theta = |\nabla f|\cos(\theta - \theta_{\text{grad}}),$$

so it is maximal ($=|\nabla f|$) along the gradient, zero perpendicular to it
(along the level set), and minimal ($=-|\nabla f|$) in the opposite direction.

The four fields and their exact gradients: the gaussian hill
$e^{-(x^2+y^2)/2\sigma^2}$, the saddle $\tfrac12(x^2 - y^2)$, the ripple
$\sin(1.3x)\cos(1.3y)$, and a sum of two gaussian bumps.

## Numerical method

Closed form; no engine. Each field exports its exact gradient (verified against
central finite differences in the tests). The directional derivative and its
cosine curve are evaluated directly. The heatmap is a normalised viridis image
of $f$, the contours are marching squares at evenly spaced levels.

## Controls

- Field selector (two hills, gaussian, saddle, ripple), direction angle slider,
  and a draggable probe on the field. Reset.

## Expected qualitative features

1. The gradient arrow is perpendicular to the contour through the probe and
   points toward higher values.
2. The directional-derivative cosine peaks where the direction aligns with the
   gradient and is zero perpendicular to it.
3. At a maximum, minimum or saddle centre the gradient vanishes and every
   direction is level.

## Invariants and acceptance thresholds

- The analytic gradients match central finite differences within $10^{-5}$.
- $D_{\mathbf{u}} f = \nabla f \cdot \mathbf{u}$ exactly.
- $\max_\theta D_{\mathbf{u}} f = |\nabla f|$ at $\theta = \theta_{\text{grad}}$;
  $D_{\mathbf{u}} f = 0$ at $\theta_{\text{grad}} \pm 90^\circ$.

## Citations

Stewart, Calculus, 8th ed., Sec. 14.6. Marsden and Tromba, Vector Calculus,
6th ed., Ch. 2.
