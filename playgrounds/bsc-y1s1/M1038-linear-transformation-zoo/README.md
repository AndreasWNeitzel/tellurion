# The linear transformation zoo

A 2x2 matrix is a recipe for bending the whole plane, and the recipe is short: it only says where the two basis vectors land. Everything else follows from linearity, so grid lines stay straight and evenly spaced, the origin stays fixed, and parallel lines stay parallel. The two columns of $M$ are the landing spots of $\hat\imath$ and $\hat\jmath$, drawn as the draggable red and green arrows; dragging them is the same as typing a matrix. The faint grid is the original plane, the blue grid is its image, the green parallelogram is the image of the unit square, and the gold ellipse is the image of the unit circle.

Three numbers read the deformation off at a glance. The determinant is the signed area of the parallelogram, how much the map scales areas: negative when the plane flips over (a reflection), zero when the plane is crushed onto a line (a projection). The singular values are the longest and shortest stretch, the semi-axes of the ellipse, and they multiply to the absolute determinant. A real eigenvector is a direction the map leaves pointing the same way, only scaled, drawn as the purple invariant lines; a pure rotation has none, because it turns every direction. The bottom panel plots the stretch $|M\mathbf{u}|$ as the input direction sweeps around, a curve that rises and falls between the two singular values, touching $\sigma_1$ along the ellipse's long axis and $\sigma_2$ along its short one.

Next map cycles a gallery: identity, rotation, scaling, shear, reflection, rotation with scale, and a projection. Watch the reflection drive the determinant negative, the projection collapse the ellipse to a segment with one singular value going to zero, and the rotation leave the circle a circle with no eigenlines at all.

## Reference

Strang, *Introduction to Linear Algebra*, 5th ed., Ch. 6 (eigenvalues) and Sec. 7.1 (the SVD and the image of the unit circle); Lay, *Linear Algebra and Its Applications*, Ch. 5.

## Verification

- Strong invariants: the singular values multiply to the absolute determinant (the ellipse area over pi); real eigenvectors are invariant directions, $M\mathbf{v} = \lambda\mathbf{v}$; the stretch in every direction lies between the two singular values.
- Visual gate: SSIM against committed golden frames at both folds.
