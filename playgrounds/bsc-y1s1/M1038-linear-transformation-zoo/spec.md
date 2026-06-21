---
title: The Linear Transformation Zoo
slug: linear-transformation-zoo
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M1038
curriculum_year: bsc-y1s1
primary_citation: strang-linalg
primary_chapter: 6
hook: "A 2x2 matrix only says where the two basis vectors land. Drag them and watch the whole plane bend: determinant, eigenvectors, singular values, all at once."
one_paragraph: "A 2x2 matrix M bends the plane linearly: grid lines stay straight and evenly spaced, the origin is fixed, and the two columns are the images of the basis vectors (drawn as draggable arrows). The determinant is the signed area of the image of the unit square (negative on a reflection, zero on a projection), the singular values are the semi-axes of the ellipse the unit circle becomes, and a real eigenvector is a direction the map only stretches. The playground draws the transformed grid, the parallelogram, the ellipse with its singular-value axes, and the eigenvector lines, and plots the stretch |M u| against input direction, bounded by the singular values."
tags: [linear-algebra, matrix, eigenvectors, svd, determinant, interactive]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [preset]
invariants:
  - key: area
    label: the singular values multiply to the absolute determinant (ellipse area)
    tolerance: 1e-6
  - key: eigen
    label: real eigenvectors are invariant directions, M v = lambda v
    tolerance: 1e-9
  - key: bounds
    label: the stretch in every direction lies between the two singular values
    tolerance: 1e-3
what_to_try:
  - Drag the red and green arrows; the grid, parallelogram, ellipse, and eigenlines all follow.
  - Cycle to the reflection; the determinant goes negative as the plane flips over.
  - Cycle to the projection; the determinant is zero, the ellipse collapses to a segment, one singular value vanishes.
references:
  - "Strang, Introduction to Linear Algebra, 5th ed., Ch. 6 (eigenvalues) and Sec. 7.1 (SVD)."
  - "Lay, Linear Algebra and Its Applications, Ch. 5."
---

# The linear transformation zoo

## Mathematical setup

A 2x2 matrix M acts on the plane. Linearity means the action is fixed by the
images of the two basis vectors, the columns of M.

## Equations

The image of the unit square is a parallelogram of signed area $\det M$; the image
of the unit circle is an ellipse whose semi-axes are the singular values
$\sigma_1 \ge \sigma_2$, with $\sigma_1\sigma_2 = |\det M|$. A real eigenvector
satisfies $M\mathbf{v} = \lambda\mathbf{v}$ (an invariant direction), and the
stretch in direction $\theta$, $|M\mathbf{u}(\theta)|$, lies between $\sigma_2$
and $\sigma_1$.

## Numerical method

No engine. Eigenvalues from the characteristic polynomial, singular values from
the eigenvalues of $M^TM$, all in closed form for the 2x2 case. Preset changes
tween the matrix entries; the basis-vector tips are draggable.

## Controls

- Next map (identity, rotation, scaling, shear, reflection, rotation+scale,
  projection); drag the basis vectors; Reset.

## Expected qualitative features

1. The transformed grid, parallelogram, and ellipse deform together as the map
   changes.
2. A reflection has negative determinant; a projection has zero determinant and a
   collapsed ellipse.
3. A pure rotation has no real eigenvectors and unit stretch in all directions.

## Invariants and acceptance thresholds

- $\sigma_1\sigma_2 = |\det M|$.
- $M\mathbf{v} = \lambda\mathbf{v}$ for real eigenpairs.
- The stretch is bounded by the singular values.

## Citations

Strang, Introduction to Linear Algebra, 5th ed., Ch. 6 and Sec. 7.1. Lay, Linear
Algebra and Its Applications, Ch. 5.
