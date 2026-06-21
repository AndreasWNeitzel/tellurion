---
title: Critical Points and the Hessian Test
slug: critical-points-hessian
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: M1015
curriculum_year: bsc-y1s2
primary_citation: stewart2016
primary_chapter: 14
hook: "Where the gradient vanishes a surface can peak, dip, or saddle. The Hessian eigenvalues decide which, and the panel below shows the surface curving up or down along each axis."
one_paragraph: "A function of two variables has a critical point where grad f = 0, classified by the Hessian H = [[f_xx, f_xy],[f_xy, f_yy]]: det H > 0 with positive trace is a minimum, det H > 0 with negative trace is a maximum, det H < 0 is a saddle, and det H = 0 is degenerate. The playground shows f as a heatmap with contours and its critical points coloured by type, a draggable probe with the gradient arrow (vanishing at the critical points) and the Hessian eigenvector axes, and a panel plotting f along those two principal axes: it curves up along a positive eigenvalue and down along a negative one, which is the second-derivative test made visual. Functions include a bowl, a saddle, one with a minimum, a maximum, and two saddles, and a monkey saddle whose Hessian is degenerate at the origin."
tags: [calculus, multivariable, optimization, interactive, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [func]
invariants:
  - key: crit
    label: the gradient vanishes at the marked critical points
    tolerance: 1e-9
  - key: class
    label: the Hessian classification matches the eigenvalue signs
    tolerance: 0.0
  - key: eig
    label: the product of the eigenvalues equals det H
    tolerance: 1e-6
what_to_try:
  - Drag the probe onto each marked point: the gradient vanishes and the lower panel shows a valley, a peak, or a saddle.
  - det H > 0 with eigenvalues of the same sign is a min or max; det H < 0 is a saddle.
  - The monkey saddle is degenerate at the origin (det H = 0) so the test is inconclusive.
references:
  - "Stewart, Calculus, Eighth ed., Sec. 14.7 (maximum and minimum values, the second-derivative test)."
  - "Marsden and Tromba, Vector Calculus, Sixth ed., Sec. 3.3."
---

# Critical points and the Hessian test

## Physical setup

A scalar function $f(x,y)$ over a region, shown as a heatmap with contour lines.
Critical points are where $\nabla f = 0$.

## Equations

The Hessian and its determinant and trace classify a critical point:

$$ H = \begin{pmatrix} f_{xx} & f_{xy} \\ f_{xy} & f_{yy} \end{pmatrix}, \quad \det H = f_{xx} f_{yy} - f_{xy}^2, \quad \operatorname{tr} H = f_{xx} + f_{yy}. $$

With eigenvalues $\lambda_1, \lambda_2$ (so $\lambda_1\lambda_2 = \det H$ and
$\lambda_1+\lambda_2 = \operatorname{tr} H$): both positive is a local minimum,
both negative a local maximum, opposite signs a saddle, and a zero determinant is
degenerate. The eigenvectors are the principal directions; $f$ curves up along a
positive eigenvalue and down along a negative one.

## Numerical method

No engine. The gradient and Hessian are analytic for each function; the
classification uses the determinant and the eigenvalues, and the eigenvectors
give the principal axes for the cross-section plot.

## Controls

- Cycle the function; drag the probe across the surface. Reset.

## Expected qualitative features

1. Critical points are coloured by type (minimum blue, maximum red, saddle gold).
2. The gradient arrow points uphill and vanishes at the critical points.
3. The cross-section curves up along a positive-eigenvalue axis and down along a
   negative one.

## Invariants and acceptance thresholds

- $\nabla f = 0$ at the marked critical points.
- The Hessian classification matches the eigenvalue signs.
- $\lambda_1 \lambda_2 = \det H$.

## Citations

Stewart, Calculus, 8th ed., Sec. 14.7. Marsden and Tromba, Vector Calculus,
6th ed., Sec. 3.3.
