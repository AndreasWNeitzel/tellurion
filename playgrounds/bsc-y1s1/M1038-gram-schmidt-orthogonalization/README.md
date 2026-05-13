# Gram-Schmidt orthogonalization

Given two non-collinear input vectors $v_1, v_2$ in the plane, the modified Gram-Schmidt procedure returns an orthonormal pair $u_1, u_2$: take $u_1 = v_1 / |v_1|$, subtract the projection of $v_2$ onto $u_1$, then normalize what is left. The playground shows the inputs (faded), the projection (dashed), the residual (dashed), and the orthonormal output (bold).

Look for $\langle u_1, u_2 \rangle$ in the readout: regardless of slider values, it stays at machine zero ($\sim 10^{-16}$). Slide $v_2$ until it lines up with $v_1$ to collapse the residual; the second output unit vector goes to zero.

Four sliders set the polar coordinates (angle and length) of $v_1$ and $v_2$.

## Reference

Primary citation: Arfken-Weber, *Mathematical Methods for Physicists*, 7e, Ch. 3 (`arfken-weber`).

## Verification

- Strong invariant: $u_i \cdot u_j = \delta_{ij}$ within $10^{-12}$ for arbitrary inputs in any dimension.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
