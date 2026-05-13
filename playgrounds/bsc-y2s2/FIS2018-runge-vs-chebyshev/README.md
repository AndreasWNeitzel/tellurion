# Runge phenomenon and the Chebyshev cure

Polynomial interpolation of the Runge function f(x) = 1 / (1 + 25 x^2)
on [-1, 1]. With equispaced nodes (orange), the interpolant oscillates
wildly near the endpoints and diverges as n grows. With Chebyshev nodes
clustered at the endpoints (cyan), the interpolant converges uniformly.
Pure Lagrange interpolation, no rational corrections or splines.

Look for: at n = 4 both look reasonable. By n = 16 the orange equispaced
curve has 6 to 8 orders of magnitude larger error than the cyan
Chebyshev curve, and at n = 30 the equispaced max error has blown up
past 10. The bottom log-error panel makes the divergence vs convergence
contrast unmistakable.

Use the n slider to set the polynomial degree. Speed auto-sweeps n.
Reset returns to n = 12.

## Reference

- Trefethen, Approximation Theory and Approximation Practice
  (`trefethen-spectral`).

## Verification

- Strong invariant: equispaced error grows >5x from n = 8 to n = 20 on
  Runge function; Chebyshev shrinks; Lagrange exact at nodes.
- Visual gate: SSIM > 0.92 across 5 frames sweeping n.
- Last verified: see `.verified`.
