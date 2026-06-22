---
title: Least Squares as Projection
slug: least-squares-projection
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M1038
curriculum_year: bsc-y1s1
primary_citation: strang-linalg
primary_chapter: 4
hook: "The best-fit line is the projection of the data onto the model plane. Tilt it off the optimum and watch the squared residuals, and the parabola, climb."
one_paragraph: "Fitting a line to scattered points is projecting the data vector b onto the column space of A = [x | 1]: the best fit is the closest point in that plane, so the residual r = b - A x_hat is orthogonal to it, A^T r = 0, the normal equations. For a line this gives slope Sxy/Sxx through the centroid. The playground draws the data, the fit line with its vertical residuals, and the optimal line as a ghost when tilted; the diagnostic is the sum of squared residuals against slope, a parabola whose vertex is the least-squares fit, with a ball that sits at the bottom only when the residual is orthogonal."
tags: [linear-algebra, least-squares, projection, regression, interactive]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: []
invariants:
  - key: normal
    label: at the optimum the residual is orthogonal to the columns (sum r x = 0)
    tolerance: 1e-6
  - key: centroid
    label: the fit line passes through the centroid of the data
    tolerance: 1e-9
  - key: minimum
    label: the SSR parabola is minimised at slope Sxy/Sxx
    tolerance: 1e-9
what_to_try:
  - Tilt the line off the best fit; the residual bars and the total SSR grow, and the ball climbs out of the parabola.
  - Snap back; the residual is orthogonal (sum r x = 0) and the ball sits at the vertex.
  - Drag a point into an outlier and watch the squared residual pull the line toward it.
references:
  - "Strang, Introduction to Linear Algebra, 5th ed., Sec. 4.3 (least squares and the normal equations)."
  - "Lay, Linear Algebra and Its Applications, Sec. 6.5 and 6.6."
---

# Least squares as projection

## Mathematical setup

A line y = m x + c is fitted to points (x_i, y_i) by minimising the sum of
squared vertical residuals.

## Equations

Stacking the data into b and the model into the columns of $A = [\mathbf{x}\ \
\mathbf{1}]$, the best fit is the orthogonal projection of b onto the column
space, so the residual is orthogonal to it,

$$ A^\top(\mathbf{b} - A\hat{\mathbf{x}}) = 0 \quad\Longleftrightarrow\quad A^\top A\,\hat{\mathbf{x}} = A^\top\mathbf{b}, $$

the normal equations. For a line, $\hat m = S_{xy}/S_{xx}$ and the line passes
through the centroid. The SSR is a parabola in the slope,
$\mathrm{SSR}(m) = S_{yy} - 2mS_{xy} + m^2 S_{xx}$, minimised at $\hat m$.

## Numerical method

No engine. Closed-form normal equations; the displayed line is the centroid line
of the chosen slope, optimal unless tilted by the handle.

## Controls

- Drag the data points; drag the slope handle to tilt the line; Snap to best fit;
  Reset data.

## Expected qualitative features

1. The best-fit line passes through the centroid and minimises the SSR.
2. Tilting the line off the optimum grows every residual and the total SSR.
3. The SSR-vs-slope curve is a parabola with its vertex at the least-squares slope.

## Invariants and acceptance thresholds

- $\sum r_i x_i = 0$ at the optimum (orthogonal residual).
- The line passes through the centroid.
- The SSR parabola is minimised at $S_{xy}/S_{xx}$.

## Citations

Strang, Introduction to Linear Algebra, 5th ed., Sec. 4.3. Lay, Linear Algebra
and Its Applications, Sec. 6.5 and 6.6.
