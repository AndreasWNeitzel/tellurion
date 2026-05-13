# SVD as rotate, scale, rotate

The singular value decomposition factors any real 2x2 matrix $M$ into $U S V^T$ where $U, V$ are rotations and $S = \mathrm{diag}(s_1, s_2)$ with $s_1 \ge s_2 \ge 0$. The four-panel display shows the unit circle being transformed step by step: rotate by $V^T$, axis-aligned scale by $s_1, s_2$, then rotate by $U$. The last panel is the same ellipse the eigenvector playground draws, just decomposed into its rotation-scaling-rotation pieces.

Look for the rotation case ($a = d$, $b = -c$): all four panels look like the same circle. The pure-scaling case ($b = c = 0$): the rotations vanish and the third panel reveals the diagonal stretch. The symmetric case ($b = c$): $V = U$, so the first and last panels match.

Four sliders set $a, b, c, d$ in $[-3, 3]$. Readout reports the singular values and the condition number $\kappa = s_1 / s_2$.

## Reference

Primary citation: Arfken-Weber, *Mathematical Methods for Physicists*, 7e, Ch. 3 (`arfken-weber`).

## Verification

- Strong invariant: $M = U S V^T$ reconstructs original within $10^{-12}$.
- $\det U = +1$ (rotation, not reflection).
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
