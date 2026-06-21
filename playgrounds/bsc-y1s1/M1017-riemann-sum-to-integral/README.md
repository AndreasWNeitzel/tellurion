# Riemann sums and the integral

The definite integral is not defined by a formula but by a limit: chop the interval $[a,b]$ into $n$ thin slices, stand a rectangle on each one whose height is the function sampled somewhere in the slice, add up their areas, and ask what that sum approaches as the slices get thinner. That sum is the Riemann sum $S_n = \sum_i f(x_i^*)\,h$, and as $n\to\infty$ the jagged staircase of rectangles is squeezed onto the curve and $S_n$ converges to $\int_a^b f\,dx$. The top panel draws the curve, the rectangles, and the exact area; the bottom panel tracks how the error shrinks as you add rectangles.

Which point inside each slice you sample is the whole story for accuracy. Sampling the left endpoint of every slice makes the rectangles lean one way (they undershoot a rising function and overshoot a falling one); the right endpoint leans the other way; either way the error only halves when you double the number of rectangles, so it falls as $1/n$. The midpoint sits the rectangle so its over- and under-shoots cancel, and the trapezoid replaces the flat top with a sloped line joining the two heights; both kill the leading error and converge twice as fast, as $1/n^2$, so at the same number of slices they are dramatically more accurate. The log-log error plot makes the difference unmistakable: the endpoint rules ride parallel to the $1/n$ reference line, the midpoint and trapezoid along the steeper $1/n^2$ line. There is a pretty exception worth hunting for: take the sine over a half period, where the function returns to zero at both ends, and the endpoint rules suddenly become second order too, because the bias at one end is exactly undone at the other.

The n slider sets the number of rectangles, Next rule cycles left, right, midpoint, and trapezoid, Next function cycles the curves, and Reset returns to the start. Each function has a known exact integral, so the error is computed against the true value, not estimated.

## Reference

Stewart, *Calculus*, 8th ed., Sec. 5.2 (the definite integral) and 7.7 (approximate integration); Rudin, *Principles of Mathematical Analysis*, Ch. 6.

## Verification

- Strong invariants: the Riemann sum converges to the exact integral as n grows; the endpoint rules are first order (error $\sim 1/n$ when $f(a)\neq f(b)$); the midpoint and trapezoid rules are second order (error $\sim 1/n^2$).
- Visual gate: SSIM against committed golden frames at both folds.
