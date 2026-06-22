# Least squares as projection

Fitting a line to scattered points is a projection in disguise. Stack the measured values into a vector $\mathbf{b}$ and the model values $mx_i + c$ into the column space of $A = [\,\mathbf{x}\ \ \mathbf{1}\,]$. No straight line passes exactly through noisy data, so $\mathbf{b}$ sits off that plane, and the best fit is the point in the plane closest to it, the orthogonal projection. Closest means the residual $\mathbf{r} = \mathbf{b} - A\hat{\mathbf{x}}$ is perpendicular to the plane, $A^\top\mathbf{r} = 0$, which is exactly the normal equations $A^\top A\,\hat{\mathbf{x}} = A^\top\mathbf{b}$. For a line they solve to slope $S_{xy}/S_{xx}$ through the centroid of the data.

The red bars in the top panel are the residuals being squared and summed. Drag the blue handle to tilt the line off the best fit and every bar, and the total, grows; the optimal line stays drawn as a green ghost so you can see what you are leaving behind. The bottom panel is that total as a function of the slope, a clean parabola whose lowest point is the least-squares answer. The ball rolls to the very bottom only when the residual is orthogonal to the data, which is what the normal equations demand. Drag the gold points to reshape the data and the fit re-solves at once, the parabola and its vertex shifting with it.

Snap to best fit returns the line to the optimum, Reset data restores the starting points. Notice two things that hold at every slope: the line always passes through the green centroid cross, and an outlier dragged far from the rest pulls the whole line toward it, because its residual is squared.

## Reference

Strang, *Introduction to Linear Algebra*, 5th ed., Sec. 4.3 (least squares and the normal equations); Lay, *Linear Algebra and Its Applications*, Sec. 6.5 and 6.6.

## Verification

- Strong invariants: at the optimum the residual is orthogonal to the columns ($\sum r_i x_i = 0$); the fit line passes through the centroid; the SSR-vs-slope parabola is minimised at $S_{xy}/S_{xx}$ and no other slope does better.
- Visual gate: SSIM against committed golden frames at both folds.
