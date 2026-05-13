# Eigenvectors of a 2x2 matrix

A real 2x2 matrix $M$ acts on the unit circle by stretching it into an ellipse. The eigenvectors of $M$ point along directions that $M$ scales without rotating, and their magnitudes scale the eigenvector by the corresponding eigenvalue. The discriminant of the characteristic polynomial decides whether the eigenvalues are real or complex.

Look for the symmetric case ($b = c$): the eigenvectors snap to the ellipse axes and are orthogonal. The rotation case ($a = d$, $b = -c$, nonzero): no real eigenvectors and the readout flips to "complex". The diagonal case ($b = c = 0$): eigenvectors stay axis-aligned regardless of $a, d$.

Four sliders set the matrix entries $a, b, c, d$. Eigenvalues and eigenvectors recompute on every drag.

## Reference

Primary citation: Arfken-Weber, *Mathematical Methods for Physicists*, 7e, Ch. 3 (`arfken-weber`).

## Verification

- Strong invariants: $M v = \lambda v$ exact; $\mathrm{tr}\,M = \sum \lambda$, $\det M = \prod \lambda$; symmetric $M$ has orthogonal eigenvectors.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
