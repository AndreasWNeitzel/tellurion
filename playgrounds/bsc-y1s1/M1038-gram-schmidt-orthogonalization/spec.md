---
title: Gram-Schmidt Orthogonalization
slug: gram-schmidt-orthogonalization
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M1038
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: arfken-weber
primary_chapter: 3
hook: "Take a set of skewed vectors and straighten them into a perpendicular frame without changing the space they span. Subtract off the part that overlaps what you already have; what is left is orthogonal. That is Gram-Schmidt."
one_paragraph: "Gram-Schmidt turns any basis into an orthonormal one. Keep the first vector; for the next, subtract its projection onto everything already accepted so only the perpendicular remainder survives, then normalise. The playground animates the input vectors, the projection being removed and the resulting residual, then the clean orthonormal output q1, q2; the diagnostic sweeps v2's angle and shows the residual shrink toward zero when the inputs become parallel (the degenerate, linearly dependent case). The readout reports q1 . q2 (the orthogonality check, near zero) and the residual length. This is the algorithm behind the QR decomposition and behind constructing orthogonal polynomials."
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
references:
  - "Arfken, Weber, Harris, Mathematical Methods for Physicists: A Comprehensive Guide, Seventh ed., Ch. 3."
---

# Gram-Schmidt orthogonalization in 2D

## Explainer

### What you are looking at

Gram-Schmidt turns any set of independent vectors into a clean
orthonormal set spanning the same space, by repeatedly subtracting
off the part of each vector that already lies along the directions
chosen so far. The playground shows two skewed vectors being
straightened into a perpendicular, unit-length pair, step by step.

### The procedure

Start with linearly independent vectors $\mathbf v_1,\mathbf v_2$.
Keep the first direction, then remove from $\mathbf v_2$ its
projection onto the first:

$$\mathbf u_1 = \mathbf v_1,
  \qquad
  \mathbf u_2 = \mathbf v_2
  - \frac{\langle \mathbf v_2,\mathbf u_1\rangle}
         {\langle \mathbf u_1,\mathbf u_1\rangle}\,\mathbf u_1,$$

then normalize: $\mathbf e_i = \mathbf u_i/\|\mathbf u_i\|$. The
subtraction is the key idea: $\mathbf u_2$ is exactly the component
of $\mathbf v_2$ orthogonal to $\mathbf u_1$ (the projection theorem),
so $\langle\mathbf u_2,\mathbf u_1\rangle = 0$ by construction. In
$n$ dimensions you repeat, subtracting the projections onto all
previously fixed directions.

### Why it matters

The output spans the same subspace as the input but in an orthonormal
basis, where geometry becomes trivial: coordinates are just inner
products, lengths and angles are read off directly, and the
change-of-basis matrix is its own inverse (orthogonal). This is the
constructive proof that every finite-dimensional inner-product space
has an orthonormal basis, and the algorithm behind the QR
decomposition $A = QR$ (the engine of least-squares fitting and
eigenvalue solvers). A practical caveat the visual hints at: if the
input vectors are nearly parallel, the subtracted vector is tiny and
dividing by its small norm amplifies rounding error, which is why
numerically one uses modified Gram-Schmidt or Householder
reflections. The playground animates the projection-and-subtract for
two vectors and shows the resulting right-angled unit frame.

### Things to try

- Watch $\mathbf u_2$ form by removing $\mathbf v_2$'s shadow along
  $\mathbf u_1$, leaving a right angle.
- Drag the input vectors nearly parallel and see $\mathbf u_2$ shrink
  toward zero (the ill-conditioned case).
- Confirm the final pair is orthonormal (perpendicular, unit length)
  and spans the same plane.

### Where this comes from

The Gram-Schmidt process, the projection theorem, and its link to
the QR decomposition follow Strang, *Introduction to Linear
Algebra*, Chapter 4, and Trefethen and Bau, *Numerical Linear
Algebra*, Lecture 7.

## Physical setup

Two input vectors $v_1, v_2$ in the plane, set by polar (angle, length) sliders. The playground displays the inputs, the projection of $v_2$ onto $q_1 = v_1 / |v_1|$, the residual $v_2 - \langle v_2, q_1 \rangle q_1$, and the resulting orthonormal pair $q_1, q_2$.

## Governing equations

Modified Gram-Schmidt: $u_1 = v_1 / |v_1|$; then for $i = 2, ..., k$,
$$w_i = v_i - \sum_{j < i} \langle v_i, u_j \rangle u_j, \qquad u_i = w_i / |w_i|.$$

The "modified" variant uses the iteratively updated $u_i$ for each subtraction, which is numerically stabler than classical Gram-Schmidt.

## Numerical method

Closed-form. Handles linear dependence by returning the zero vector for $u_i$ if $|w_i| < 10^{-15}$.

## Controls

- $v_1$ angle (0 to 360 deg) and length (0.5 to 3).
- $v_2$ angle and length.
- Reset, Pause. The construction plays as animated stages, then holds the
  assembled orthonormal frame.

## Expected qualitative features

1. Whatever the inputs, the output frame $q_1, q_2$ has $\langle q_1, q_2 \rangle$ at machine zero (the readout shows $\sim 10^{-16}$).
2. The projection lies on the $q_1$ line; the residual is perpendicular to it and becomes $q_2$.
3. Bringing $v_2$ collinear with $v_1$ collapses the residual; $|q_2| \to 0$ and the readout flags the degenerate case.
4. With $v_2$ already perpendicular to $v_1$, the projection is zero and $q_2 = v_2 / |v_2|$ immediately.
5. The diagnostic plots the residual and projection lengths versus $v_2$'s angle: the residual is zero where $v_2 \parallel v_1$ and largest where $v_2 \perp v_1$.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| output orthonormality $u_i \cdot u_j = \delta_{ij}$ | within $10^{-12}$ | invariants test |
| linearly dependent input gives zero residual | $|u_2| < 10^{-12}$ | invariants test |
| orthonormal input preserved (up to sign) | within $10^{-12}$ | invariants test |
| 4D extension orthonormalizes 4 vectors | dot products within $10^{-12}$ | invariants test |
| residual perpendicular to $u$ after projection | $\langle r, u \rangle < 10^{-12}$ | invariants test |
| first orthonormal vector is $v_1 / |v_1|$ | within $10^{-12}$ | invariants test |
| span preserved (any $v$ reconstructible via $u$ basis) | within $10^{-12}$ | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $v_1, v_2$ already orthonormal: $u_i = v_i$.
- $v_2$ collinear with $v_1$: $u_2 = 0$.
- $v_2$ perpendicular to $v_1$: projection zero, $u_2 = v_2 / |v_2|$ exactly.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders remain functional.

## Citations

- Arfken-Weber, *Mathematical Methods for Physicists*, 7e, Ch. 3.

## Stretch goals

- 3D extension with a draggable third vector.
- Show the QR decomposition decomposition: $V = Q R$ where $Q = [u_1, u_2]$ and $R$ is upper triangular.
- Add a numerical-stability comparator (classical vs modified) on near-degenerate input.

## Risk register

- Stays in 2D for visualization; the engine itself handles arbitrary dimension and the 4D test confirms it.
- Very small input vectors (length 0.5) give a noisy display because the projection cone is narrow; mitigated by the slider lower bound.
