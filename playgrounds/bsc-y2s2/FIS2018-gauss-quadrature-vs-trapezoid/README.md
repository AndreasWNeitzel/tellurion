# Gauss-Legendre vs trapezoid quadrature

Two ways of computing integral_{-1}^1 f(x) dx: the trapezoidal rule with
n + 1 equispaced points (O(h^2) convergence), and Gauss-Legendre with n
optimized nodes that are exact for polynomials up to degree 2n - 1.
Gauss-Legendre gives exponential convergence for analytic f. The top
panel shows the function with both node sets; the bottom log-error
panel makes the convergence-rate gap obvious.

Look for: on cos(2x), GL reaches 1e-12 by n = 8 while trapezoid only
reaches 1e-3. On the Runge function 1/(1 + 25 x^2), GL converges
exponentially while trapezoid is still h^2. On the non-smooth sqrt(|x|),
both are stuck at algebraic rates, with GL only a constant factor
better.

Use the n and function sliders. Speed auto-sweeps n. Reset returns
n = 8.

## Reference

- Trefethen, Approximation Theory and Approximation Practice
  (`trefethen-spectral`).

## Verification

- Strong invariant: GL exact on polynomials up to 2n-1; weights sum to
  2; spectral convergence on cos.
- Visual gate: SSIM > 0.92 across 5 frames sweeping n.
- Last verified: see `.verified`.
