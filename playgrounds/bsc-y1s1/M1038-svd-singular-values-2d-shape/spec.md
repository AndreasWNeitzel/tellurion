---
title: SVD as Rotate-Scale-Rotate
slug: svd-singular-values-2d-shape
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M1038
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: arfken-weber
primary_chapter: 3
hook: "Every matrix, no matter how lopsided, is just rotate, then stretch along clean perpendicular axes, then rotate again. The stretch factors are the singular values. Watch a circle become an ellipse in three honest steps."
one_paragraph: "The singular value decomposition writes M = U S V^T: a first rotation V^T, a pure axis-aligned scaling S by the singular values sigma_1 >= sigma_2, and a final rotation U. The playground shows this as four panels: the unit circle, then after V^T, then after S (a circle stretched into an axis-aligned ellipse), then after U (rotated into the final image of M). The singular values are the semi-axis lengths of that final ellipse, and their ratio sigma_1/sigma_2 is the condition number, which measures how close M is to singular. The readout reports sigma_1, sigma_2 and cond(M). SVD is the backbone of least squares, low-rank compression and principal component analysis."
tags: [numerics, animation, live-readout]
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

# Singular value decomposition of a 2x2 matrix

## Explainer

### What you are looking at

Feed a unit circle through a 2x2 matrix and it comes out an ellipse.
The singular value decomposition (SVD) says that every matrix, no
matter how it shears or skews, does only three simple things in
sequence: rotate, stretch along axes, rotate again. The four panels
show exactly those three steps turning the circle into the ellipse.

### The decomposition

Any real matrix $M$ factors as

$$M = U\,S\,V^{T},$$

where $U$ and $V$ are rotations (orthogonal matrices) and
$S = \operatorname{diag}(s_1, s_2)$ with $s_1 \ge s_2 \ge 0$ holds the
singular values. Read right to left, applying $M$ to a vector means:
rotate by $V^{T}$, scale the axes by $s_1$ and $s_2$, rotate by $U$.
The ellipse you see has semi-axes $s_1$ and $s_2$ pointing along the
columns of $U$.

### How the pieces are found

Build the symmetric matrix $M^{T}M$. It is positive semi-definite, so
its eigenvalues are non-negative; they are exactly the squared
singular values, and their eigenvectors are the columns of $V$:

$$M^{T}M\,v_i = s_i^2\,v_i, \qquad
  u_i = \frac{M v_i}{s_i}\ \ (s_i > 0).$$

When a singular value is zero the matrix squashes that direction flat
(the ellipse degenerates to a segment); the second $u$ is then filled
in by a $90^\circ$ rotation and the sign fixed so $\det U = +1$.

### Why the singular values matter

The ratio of the largest to smallest singular value is the condition
number

$$\kappa(M) = \frac{s_1}{s_2}\quad (s_2 > 0),
  \qquad \infty\ \text{if } s_2 = 0.$$

A large $\kappa$ means the matrix stretches one direction far more than
another, so solving $M x = b$ amplifies error: it is the single number
that tells you whether a linear system is numerically safe. The
playground shows $s_1, s_2$ and $\kappa$ live as you change $M$, and
the ellipse going thin as $\kappa \to \infty$.

### Things to try

- Set $M$ to a pure rotation: $s_1 = s_2 = 1$, the circle stays a
  circle, $\kappa = 1$.
- Make $M$ nearly singular and watch the ellipse collapse toward a
  line as $\kappa$ blows up.
- Use a shear and see how $U$ and $V$ differ: the input and output
  rotations are not the same.

### Where this comes from

The SVD, the $M^{T}M$ eigenproblem, and the condition number follow
Arfken, Weber and Harris, *Mathematical Methods for Physicists*, 7th
ed., Chapter 3.

## Physical setup

A real 2x2 matrix $M$ acting on the unit circle in $\mathbb{R}^2$. The singular value decomposition writes $M = U S V^T$ with $U, V$ rotations (orthogonal, determinant $+1$) and $S = \mathrm{diag}(s_1, s_2)$ with $s_1 \ge s_2 \ge 0$. The four-panel display shows the unit circle stretched step by step: rotate by $V^T$, scale by $S$, rotate by $U$.

## Governing equations

Form $M^T M$, a symmetric positive semi-definite 2x2 matrix. Its eigenvalues are $s_1^2, s_2^2$; the eigenvectors form the columns of $V$. Then $u_i = M v_i / s_i$ for $s_i > 0$; rotate the second column by 90 deg to fill in if $s_2 = 0$. Fix the sign so $\det U = +1$.

The condition number is $\kappa(M) = s_1 / s_2$ when $s_2 > 0$, otherwise $\infty$.

## Numerical method

Closed-form. The PSD eigenvalue routine handles a corner case where $b$ (off-diagonal of $M^T M$) is exactly zero (matrix already diagonal in $V$ basis) and where the spectrum is degenerate.

## Controls

- $a, b, c, d$ sliders for $M$ entries.

## Expected qualitative features

1. Pure rotation $M$ gives $s_1 = s_2 = 1$: all four panels are circles of equal size.
2. Pure scaling $M = \mathrm{diag}(\alpha, \beta)$ gives $V = I$ (no first rotation) and the panels look like a horizontal stretch.
3. Symmetric $M$ gives $V = U$ (up to a sign): the first and last rotations match.
4. Singular $M$ ($\det M = 0$): $s_2 = 0$, the third and fourth panels collapse to a line segment.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $M = U S V^T$ reconstructs original | within $10^{-12}$ | invariants test |
| singular values non-negative and descending | strict | invariants test |
| $U$ columns orthonormal | within $10^{-12}$ | invariants test |
| $V$ columns orthonormal | within $10^{-12}$ | invariants test |
| diagonal positive $M$: $s_i = $ sorted diagonal entries | exact | invariants test |
| rotation $M$ has $s_1 = s_2 = 1$ | within $10^{-12}$ | invariants test |
| $\det U = +1$ (rotation, not reflection) | within $10^{-12}$ | invariants test |
| Frobenius norm $= \sqrt{s_1^2 + s_2^2}$ | within $10^{-12}$ | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $M = I$: $U = V = I$, $s_1 = s_2 = 1$.
- $M$ diagonal positive: $V = I$, $U = I$, $s_i = M_{ii}$ (sorted).
- $M$ rotation: $s_1 = s_2 = 1$.
- $\det M = 0$: $s_2 = 0$, image of unit circle is a line segment.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still function.

## Citations

- Arfken-Weber, *Mathematical Methods for Physicists*, 7e, Ch. 3.

## Stretch goals

- Switch to 3D: SVD of 3x3 with three panel ellipsoids.
- Show the polar decomposition $M = Q P$ (rotation times PSD scaling).
- Pseudoinverse $M^+ = V S^+ U^T$ visualizer.

## Risk register

- For nearly singular $M$, computing $u_2 = M v_2 / s_2$ when $s_2 \to 0$ is numerically unstable; the code falls back to the orthogonal complement of $u_1$ for $s_2 < 10^{-15}$.
