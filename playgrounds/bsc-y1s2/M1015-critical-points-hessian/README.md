# Critical points and the Hessian test

Finding where a function of two variables is largest or smallest starts by setting its gradient to zero, but a vanishing gradient only marks a critical point; it does not say whether you have found a peak, a valley, or a saddle where the surface rises one way and falls another. The second-derivative test answers that with the Hessian, the matrix of second partial derivatives. Its determinant and its two eigenvalues do the classifying: two positive eigenvalues mean the surface curves upward in every direction (a local minimum), two negative mean it curves downward everywhere (a local maximum), one of each sign is a saddle, and a zero determinant means the test is inconclusive. The top panel shows the function as a heatmap with contour lines and marks every critical point by its type; the bottom panel turns the test into a picture.

Drag the white probe across the landscape. The orange gradient arrow points straight uphill, across the contour lines, and shrinks to nothing exactly at the critical points. The two coloured lines through the probe are the Hessian eigenvector axes, the principal directions of curvature, blue where the surface curves up and red where it curves down. The lower panel plots the function along those two axes: at a minimum both curves are valleys, at a maximum both are hills, and at a saddle one is a valley and the other a hill, the unmistakable signature that gives the saddle its name. The four-critical-point function shows all three types at once, and the monkey saddle is the cautionary case, with a zero determinant at the origin where three valleys and three ridges meet and the simple test gives up.

Next function cycles the surfaces and the probe jumps to a critical point; drag it anywhere to read the gradient, the determinant, and the eigenvalues live. Every gradient and Hessian is exact, so the classification is computed, not eyeballed.

## Reference

Stewart, *Calculus*, 8th ed., Sec. 14.7 (the second-derivative test); Marsden and Tromba, *Vector Calculus*, 6th ed., Sec. 3.3.

## Verification

- Strong invariants: the gradient vanishes at the marked critical points; the Hessian classification matches the eigenvalue signs; the product of the eigenvalues equals $\det H$.
- Visual gate: SSIM against committed golden frames at both folds.
