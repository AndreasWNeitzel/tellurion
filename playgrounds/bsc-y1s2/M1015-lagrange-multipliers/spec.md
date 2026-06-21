---
title: Lagrange Multipliers
slug: lagrange-multipliers
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: M1015
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: stewart2015
primary_chapter: 14
hook: "To extremise f on a constraint g = c, the constraint curve must be tangent to a level set of f, so the gradients of f and g line up. Sweep the point and watch them align exactly at the peaks and valleys."
one_paragraph: "Constrained optimisation by Lagrange multipliers: extremising f(x,y) subject to g(x,y) = c happens where grad f = lambda grad g, equivalently where the constraint curve is tangent to a level set of f and the directional derivative of f along the constraint vanishes. The playground shows the contours of f, the constraint curve, and a point sweeping it with the gradients of f and g drawn; the green markers are the constrained optima, where the two gradients align. The diagnostic plots f measured along the constraint, whose peaks and valleys are exactly those optima. Four problems are included: x + y and x y on the unit circle, x^2 + 3 y^2 on a line, and the distance from a point to an ellipse."
tags: [calculus, vector-calculus, optimisation, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: []
invariants:
  - key: parallel
    label: at every constrained optimum grad f is parallel to grad g
    tolerance: 1e-3
  - key: tangency
    label: the tangency slope is the derivative of f along the constraint
    tolerance: 1e-4
  - key: known-optima
    label: the known analytic optima are recovered (e.g. sqrt(2) for x+y on the circle)
    tolerance: 1e-3
what_to_try:
  - Let it sweep and watch the gradient arrows line up only at the green markers, the constrained optima.
  - At an optimum the constraint just grazes a contour (tangent); away from it the constraint crosses the contours.
  - The green markers sit exactly at the peaks and valleys of f along the constraint in the lower plot.
references:
  - "Stewart, Calculus, 8e, Sec. 14.8 (Lagrange multipliers)."
  - "Marsden and Tromba, Vector Calculus, 6e, Sec. 3.4."
---

# Lagrange multipliers

## Physical setup

A scalar objective $f(x,y)$ drawn as contours over a square domain, with a
constraint curve $g(x,y) = c$ parametrised by $t$. A point sweeps the constraint
and carries the gradients $\nabla f$ and $\nabla g$.

## Equations

A constrained extremum of $f$ on $g = c$ satisfies the Lagrange condition

$$\nabla f = \lambda\,\nabla g,$$

so $\nabla f \parallel \nabla g$ (their cross product vanishes). Equivalently the
directional derivative of $f$ along the constraint is zero,
$\nabla f \cdot \mathbf{r}'(t) = 0$, which is just $\frac{d}{dt} f(\mathbf{r}(t))
= 0$: the optima are the stationary points of $f$ measured along the curve, and
there the constraint is tangent to a level set of $f$.

Problems: $f = x+y$ and $f = xy$ on $x^2 + y^2 = 1$; $f = x^2 + 3y^2$ on
$x + y = 1$; and $f = (x-1.3)^2 + (y-0.4)^2$ (squared distance to a point) on an
ellipse.

## Numerical method

Closed form; no engine. Objectives have exact gradients. The constrained optima
are the sign changes of the tangency slope $\nabla f \cdot \mathbf{r}'(t)$,
refined by bisection. The contours are marching squares of $f$.

## Controls

- Problem selector, a position slider that sweeps the constraint (auto-animates
  on Play). Reset and Pause.

## Expected qualitative features

1. The gradients $\nabla f$ and $\nabla g$ align only at the constrained optima.
2. At an optimum the constraint is tangent to a level set of $f$.
3. The optima coincide with the peaks and valleys of $f$ plotted along the
   constraint.

## Invariants and acceptance thresholds

- $\nabla f \times \nabla g = 0$ at every found optimum.
- The tangency slope equals $\frac{d}{dt} f(\mathbf{r}(t))$ (central differences).
- $x+y$ on the unit circle gives $\pm\sqrt{2}$; $x^2+3y^2$ on $x+y=1$ is
  minimised at $(0.75, 0.25)$.

## Citations

Stewart, Calculus, 8th ed., Sec. 14.8. Marsden and Tromba, Vector Calculus,
6th ed., Sec. 3.4.
