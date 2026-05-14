---
title: Eigenvector Rotation in 2x2
slug: eigenvector-rotation-2x2
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

# Eigenvectors of a 2x2 matrix as you drag the entries

## Physical setup

Real 2x2 matrix $M = \begin{pmatrix}a & b \\ c & d\end{pmatrix}$ visualized as a linear transformation of the unit circle in $\mathbb{R}^2$. Sliders set each of the four matrix entries. The image of the unit circle is generally an ellipse; the eigenvectors (when real) point along directions that $M$ leaves invariant up to scaling by an eigenvalue.

## Governing equations

Eigenvalues:
$$\lambda_\pm = \frac{a + d}{2} \pm \sqrt{\frac{(a + d)^2}{4} - (a d - b c)}.$$

Discriminant $\Delta = \tfrac{(a+d)^2}{4} - (ad - bc)$. If $\Delta \ge 0$ both eigenvalues are real; otherwise complex conjugate pair.

Eigenvector for $\lambda$: any nonzero vector in $\ker(M - \lambda I)$.

## Numerical method

Closed-form. Special cases handled:

- $M$ proportional to the identity: any nonzero vector is an eigenvector; canonical basis returned.
- Diagonal $M$ ($b = c = 0$): canonical basis eigenvectors.
- Degenerate row pick: choose the row of $M - \lambda I$ with the largest off-diagonal magnitude for numerical stability.

## Controls

- $a, b, c, d$ sliders, each in $[-3, 3]$ with step 0.05.

## Expected qualitative features

1. Symmetric $M$ ($b = c$): eigenvectors orthogonal, ellipse axes coincide with eigendirections.
2. Rotation $M$ ($a = d, b = -c$): complex eigenvalues, eigenvectors disappear, readout flags "complex".
3. $b = c = 0$: eigenvectors axis-aligned regardless of $a, d$.
4. Eigenvector tip marker at distance $|\lambda|$ along the eigenvector line.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| identity matrix gives $\lambda = 1, 1$ | exact | invariants test |
| symmetric matrix: eigenvectors orthogonal | dot product $< 10^{-12}$ | invariants test |
| rotation matrix: complex spectrum | $r.real = $ false | invariants test |
| $M v = \lambda v$ holds | within $10^{-12}$ per component (real $M$) | invariants test |
| $\mathrm{tr}\,M = \lambda_1 + \lambda_2$, $\det M = \lambda_1 \lambda_2$ | within $10^{-12}$ | invariants test |
| eigenvectors normalized $|v| = 1$ | within $10^{-12}$ | invariants test |
| diagonal $M$: axis-aligned eigenvectors | sorted descending | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $M = I$: every vector eigenvector; canonical basis returned.
- Degenerate ($\det = 0$): one eigenvalue zero; image of unit circle is a line segment.
- Negative eigenvalue: image arrow points opposite to eigenvector.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders remain functional.

## Citations

- Arfken-Weber, *Mathematical Methods for Physicists*, 7e, Ch. 3 (`arfken-weber`).

## Stretch goals

- Click-and-drag the corners of the ellipse to set $M$ implicitly.
- Show the singular-value decomposition decomposition: rotate, scale, rotate.
- Animate a parameter sweep to show how eigenvalues collide and become complex.

## Risk register

- For $M$ extremely close to a multiple of identity, the row-pick heuristic could give noisy eigenvectors; mitigated by the explicit identity-branch and the canonical-basis fallback.
