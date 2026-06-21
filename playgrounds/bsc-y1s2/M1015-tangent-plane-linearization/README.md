# The tangent plane and linear approximation

Zoom far enough into any smooth surface and it flattens into a plane, just as a curve straightens into its tangent line. That plane is the tangent plane, and it is the best linear approximation to the surface at the point where it touches: $L(x,y) = f(x_0,y_0) + f_x(x_0,y_0)(x-x_0) + f_y(x_0,y_0)(y-y_0)$. It is the only plane that agrees with the surface in both height and slope at the point, which is what makes it the linearization used to propagate small changes, $\Delta f \approx f_x\,\Delta x + f_y\,\Delta y$. The top panel shows the surface in oblique 3D with the tangent plane riding on it; drag the white point and the plane re-tilts to stay flush.

The match is exact only at the point. Away from it the surface and the plane separate, and the gap, the approximation error, grows quadratically with distance, set by the curvature (the second derivatives). The bottom panel makes this visible: it slices the surface along the steepest direction and plots the surface curve in blue against its tangent line in green. The two share a value and a slope where they meet, then the line peels away, slowly at first and then faster, the error scaling as distance squared. On the saddle the curve bends above the line one way and below it the other, the two curvatures of opposite sign.

Next surface cycles through a bowl, a saddle, a Gaussian bump, and a ripple; Reset returns the point to its start. The gradient readout vanishes when the point sits at a peak, a valley, or the flat centre of the bump, and there the tangent plane lies horizontal.

## Reference

Stewart, *Calculus*, 8th ed., Sec. 14.4 (tangent planes and linear approximations); Marsden and Tromba, *Vector Calculus*, 6th ed., Sec. 2.3.

## Verification

- Strong invariants: the tangent plane matches f in value and in both slopes at the point, so the error is zero there; the error grows quadratically with distance (halving the offset quarters it).
- Visual gate: SSIM against committed golden frames at both folds.
