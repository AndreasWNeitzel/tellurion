# Lagrange multipliers

To find the largest or smallest value of f(x,y) while staying on a constraint curve g(x,y) = c, walk along the curve and watch f rise and fall. At a peak or valley your motion is momentarily level, so f has no rate of change along the constraint: the gradient of f has no component along the curve and must point straight across it, parallel to the gradient of g. That is the Lagrange condition, grad f = lambda grad g, and geometrically the constraint just kisses a level set of f there, tangent rather than crossing. The top panel draws the contours of f, the constraint curve, a sweeping point with the two gradient arrows, and green markers at the optima; the bottom panel plots f along the constraint.

Let it sweep and the gold (grad f) and blue (grad g) arrows swing relative to each other; they line up only at the green markers, which are exactly the peaks and valleys of f along the constraint below. Switch problems to see the classics: maximising x + y on the unit circle gives the forty-five-degree point with value sqrt(2); x squared plus three y squared on a line is minimised where the elongated contours first touch the line; and the distance problem finds the nearest and farthest points of an ellipse from a given point.

The problem selector chooses the objective and constraint; the position slider sweeps the point (it auto-animates on Play). Everything is closed-form with exact gradients, so the tangency, the gradient alignment, and the optima are exact.

## Reference

Stewart, *Calculus*, 8th ed., Sec. 14.8 (Lagrange multipliers); Marsden and Tromba, *Vector Calculus*, 6th ed., Sec. 3.4.

## Verification

- Strong invariants: grad f is parallel to grad g at every found optimum; the tangency slope equals the derivative of f along the constraint; the known analytic optima are recovered (sqrt(2) for x+y on the circle, (0.75, 0.25) for the line problem).
- Visual gate: SSIM against committed golden frames at both folds.
