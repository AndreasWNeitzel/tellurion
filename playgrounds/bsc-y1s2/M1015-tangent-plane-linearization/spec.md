---
title: The Tangent Plane and Linear Approximation
slug: tangent-plane-linearization
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M1015
curriculum_year: bsc-y1s2
primary_citation: stewart-calculus
primary_chapter: 14
hook: "Zoom into a smooth surface and it flattens into a plane. That tangent plane is the best linear approximation; drag the point and watch it re-tilt to stay flush."
one_paragraph: "The tangent plane to z = f(x,y) at (x0, y0) is L = f(x0,y0) + f_x(x-x0) + f_y(y-y0), the unique plane matching the surface in height and in both slopes there. It is the linearization that propagates small changes, df = f_x dx + f_y dy, and the gap f - L grows quadratically with distance, set by the second derivatives. The playground shows the surface in oblique 3D with the tangent plane touching at a draggable point, and a slice along the gradient where the tangent line matches the surface curve at the point and peels away as distance squared."
tags: [multivariable-calculus, tangent-plane, linearization, gradient, interactive, 3d]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [surf]
invariants:
  - key: touch
    label: the tangent plane matches f at the point (error is zero there)
    tolerance: 1e-9
  - key: slope
    label: the plane gradient equals (f_x, f_y) at the point
    tolerance: 1e-6
  - key: order
    label: the approximation error grows quadratically with distance (halving distance quarters error)
    tolerance: 0.5
what_to_try:
  - Drag the point across the surface; the tangent plane re-tilts to stay flush and the slice keeps its tangent line tangent to the moving curve.
  - Watch the cross-section: the tangent line shares the curve's value and slope at the point, then peels away as distance squared.
  - Move the point to the bottom of the bowl or top of the bump; the gradient vanishes and the plane goes horizontal.
references:
  - "Stewart, Calculus, 8th ed., Sec. 14.4 (tangent planes and linear approximations)."
  - "Marsden and Tromba, Vector Calculus, 6th ed., Sec. 2.3."
---

# The tangent plane and linear approximation

## Physical setup

A smooth surface z = f(x,y) is probed at a point (x0, y0). The tangent plane is
the plane through that point with the surface's slopes in the x and y directions.

## Equations

The tangent plane is the linearization

$$ L(x,y) = f(x_0,y_0) + f_x(x_0,y_0)\,(x-x_0) + f_y(x_0,y_0)\,(y-y_0), $$

the only plane that matches f in value and in both partial slopes at the point.
The approximation error is second order,

$$ f(x,y) - L(x,y) \approx \tfrac{1}{2}\left[f_{xx}\,\Delta x^2 + 2 f_{xy}\,\Delta x\,\Delta y + f_{yy}\,\Delta y^2\right], $$

so it vanishes at the point and grows quadratically with distance, with the
Hessian (the second derivatives) setting the curvature.

## Numerical method

No engine. The surface is sampled on a grid and drawn as an oblique-projection
wireframe; the tangent plane is a flat quad evaluated from the analytic gradient;
the cross-section evaluates f and L along the gradient direction. Dragging maps
the pointer to the nearest projected surface point.

## Controls

- Next surface (bowl, saddle, Gaussian bump, ripple); Reset; drag the point.

## Expected qualitative features

1. The tangent plane stays flush with the surface at the point as it is dragged.
2. The cross-section tangent line matches the curve's value and slope at the
   point and diverges quadratically away.
3. At a maximum or minimum the gradient vanishes and the plane is horizontal.

## Invariants and acceptance thresholds

- L equals f at the point (error zero).
- The plane's gradient equals (f_x, f_y) at the point.
- Halving the distance quarters the error (second order).

## Citations

Stewart, Calculus, 8th ed., Sec. 14.4. Marsden and Tromba, Vector Calculus, 6th
ed., Sec. 2.3.
