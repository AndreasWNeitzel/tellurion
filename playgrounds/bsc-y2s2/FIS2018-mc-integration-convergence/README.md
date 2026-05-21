# Monte Carlo integration and 1/sqrt(N) convergence

Estimate the area of a shape by hit-or-miss Monte Carlo. A shape sits
in the unit square; uniform random darts are thrown and accumulate
continuously, green inside the shape and red outside. The fraction
inside estimates the area, which is the integral of the shape's
indicator function. The hit count is Binomial, so the standard error
shrinks as 1/sqrt(N).

Look for: the absolute-error panel on the right plots error against N
on log-log axes, tracking the dashed 1/sqrt(N) reference, a straight
line of slope -1/2. The quarter disk has area pi/4, so four times the
hit fraction estimates pi. Switching shapes restarts the estimate and
it re-converges to the new exact area.

Use the shape dropdown to choose the region, the darts/frame slider to
set the throw rate, and Reset to clear the accumulated darts.

## Reference

- MacKay, Information Theory, Inference, and Learning Algorithms, Ch. 29.
- Press et al., Numerical Recipes 3e, Ch. 7.6.

## Verification

- Strong invariant: each shape estimate matches its exact area within
  0.01 at N = 4e5; the standard error scales as 1/sqrt(N).
- Visual gate: SSIM > 0.92 across 5 frames sweeping the dart count.
- Last verified: see `.verified`.
