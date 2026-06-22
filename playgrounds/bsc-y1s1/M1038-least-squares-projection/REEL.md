# Reel script: Least Squares as Projection

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: The best-fit line is the projection of the data onto the model plane.
Caption: The best-fit line is the projection of th…

## Beat 2, the reveal (3 to 10s)
VO: Fitting a line to scattered points is a projection in disguise.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Stack the measured heights into a vector $\mathbf{b}$ and the model values $mx_i + c$ into the column space of $A = [\,\mathbf{x}\ \ \mathbf{1}\,]$: no line passes exactly through noisy data, so $\mathbf{b}$ lies off that plane, and the best fit is the point in the plane closest to it, the orthogonal projection. Closest means the residual $\mathbf{r} = \mathbf{b} - A\hat{\mathbf{x}}$ is perpendicular to the plane, $A^\top\mathbf{r} = 0$, which is exactly the normal equations $A^\top A\,\hat{\mathbf{x}} = A^\top\mathbf{b}$.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag the blue handle to tilt the line off the best fit: the red residual bars and the total SSR grow, and in the panel below the residual e tips away from perpendicular and lengthens.
VO: Snap back to the best fit: e stands perpendicular to the column-space plane (the right-angle mark), which is $A^\top e = 0$, the normal equations.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: Drag the gold points to reshape the data and the fit re-solves at once.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- The best-fit line is the projection of th…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Strang, Introduction to Linear Algebra, 5th ed.
