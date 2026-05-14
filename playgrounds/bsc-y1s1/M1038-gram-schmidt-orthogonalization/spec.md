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
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Gram-Schmidt orthogonalization in 2D

## Physical setup

Two input vectors $v_1, v_2$ in the plane, set by polar (angle, length) sliders. The playground displays the inputs (faded), the projection of $v_2$ onto $u_1 = v_1 / |v_1|$ (dashed), the residual $v_2 - \langle v_2, u_1 \rangle u_1$ (orange dashed), and the resulting orthonormal pair $u_1, u_2$ (bold accent and red).

## Governing equations

Modified Gram-Schmidt: $u_1 = v_1 / |v_1|$; then for $i = 2, ..., k$,
$$w_i = v_i - \sum_{j < i} \langle v_i, u_j \rangle u_j, \qquad u_i = w_i / |w_i|.$$

The "modified" variant uses the iteratively updated $u_i$ for each subtraction, which is numerically stabler than classical Gram-Schmidt.

## Numerical method

Closed-form. Handles linear dependence by returning the zero vector for $u_i$ if $|w_i| < 10^{-15}$.

## Controls

- $v_1$ angle (0 to 360 deg) and length (0.5 to 3).
- $v_2$ angle and length.

## Expected qualitative features

1. Whatever the inputs, $\langle u_1, u_2 \rangle$ stays at machine zero (the readout shows $\sim 10^{-16}$).
2. The dashed cyan projection lies on the $u_1$ line; the orange dashed residual is perpendicular to it.
3. Bringing $v_2$ collinear with $v_1$ collapses the residual; $|u_2| \to 0$ and the readout flags the degenerate case.
4. With $v_2$ already perpendicular to $v_1$, the projection is zero and $u_2 = v_2 / |v_2|$ immediately.

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

- Arfken-Weber, *Mathematical Methods for Physicists*, 7e, Ch. 3 (`arfken-weber`).

## Stretch goals

- 3D extension with a draggable third vector.
- Show the QR decomposition decomposition: $V = Q R$ where $Q = [u_1, u_2]$ and $R$ is upper triangular.
- Add a numerical-stability comparator (classical vs modified) on near-degenerate input.

## Risk register

- Stays in 2D for visualization; the engine itself handles arbitrary dimension and the 4D test confirms it.
- Very small input vectors (length 0.5) give a noisy display because the projection cone is narrow; mitigated by the slider lower bound.
