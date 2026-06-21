# Gradient and directional derivative

Stand on a hilly surface f(x,y) and two questions arise: which way is uphill, and how steep is the climb if I walk in some chosen direction? The gradient grad f = (f_x, f_y) answers the first: it points in the direction of steepest ascent, its length is that steepest slope, and it is always perpendicular to the contour you are standing on. The directional derivative answers the second: along a unit direction u, the slope you feel is the projection of the gradient onto u, D_u f = grad f . u = |grad f| cos(theta - theta_grad). The top panel draws the field as a heatmap with contours and gradient arrows, a draggable probe with its gradient vector and the chosen direction, and D_u f as the green projection. The bottom panel is D_u f as a cosine of the direction angle.

Drag the probe to a steep flank and the gradient grows, lifting the whole cosine curve. Swing the direction onto the gradient and the projection reaches the full gradient length, the maximum slope. Turn it perpendicular and the projection collapses to zero, because walking along a contour gains no height. Park the probe on a hilltop or the saddle centre and the gradient vanishes, flattening the cosine to zero: every direction is level there.

Choose among four fields (two hills, a gaussian hill, a saddle, a ripple), drag the probe anywhere on the field, and swing the direction slider. Everything is closed-form with exact gradients, so the projection and the cosine curve are exact.

## Reference

Stewart, *Calculus*, 8th ed., Sec. 14.6 (directional derivatives and the gradient vector); Marsden and Tromba, *Vector Calculus*, 6th ed., Ch. 2.

## Verification

- Strong invariants: the analytic gradients match central finite differences; the directional derivative along the gradient equals |grad f| and vanishes perpendicular to it; it follows the cosine law exactly.
- Visual gate: SSIM against committed golden frames at both folds.
