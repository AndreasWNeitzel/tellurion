# Change of variables and the Jacobian

Switching coordinates inside a double integral is not free: a small rectangle of area $du\,dv$ in the source plane is carried by the map into a small parallelogram in the target plane, and that parallelogram is bigger or smaller by the Jacobian determinant $|J| = |\partial(x,y)/\partial(u,v)|$. That single fact is the content of $dx\,dy = |J|\,du\,dv$ and of the change-of-variables theorem. The playground pushes a real grid through a real map and paints every mapped cell by its local $|J|$, so the stretch is something you can see: bright cells where the map expands area, dark cells where it compresses. The top panel is the source grid, the middle panel is its deformed image, and the bottom panel accumulates the area to check the theorem numerically.

Drag the orange probe around the source grid and the parallelogram spanned by the two Jacobian columns appears in the mapped plane; its area is exactly $|J|$ times the area of the source cell, which is what the determinant measures. On the polar map the outer cells are bright and large because $|J| = r$ grows with radius, the geometric reason the area element is $r\,dr\,d\theta$ and not $dr\,d\theta$. The linear shear colours every cell the same, since an affine map scales all areas by one constant $|\det|$; the complex square $z\mapsto z^2$ scales as $4|z|^2$; the sinusoidal warp stretches and squeezes unevenly. Raise the grid resolution and the bottom plot makes the punchline quantitative: the area summed with the $|J|$ factor converges to the true mapped area, while the area summed without it stays stuck at the wrong source-area value.

Next map cycles the four maps, the grid slider sets the resolution, and Reset returns to the polar default. The Jacobian shown at the probe is checked against a central-difference derivative of the map, so the agreement between the closed-form $|J|$ and the actual local area stretch is a computed result.

## Reference

Stewart, *Calculus*, 8th ed., Sec. 15.10 (change of variables in multiple integrals); Marsden and Tromba, *Vector Calculus*, 6th ed., Sec. 6.2.

## Verification

- Strong invariants: the analytic $|J|$ equals the central-difference Jacobian; the integral of $|J|$ over the source region equals the true mapped area (shoelace); the polar mapped area equals $\tfrac12(r_1^2-r_0^2)(\theta_1-\theta_0)$.
- Visual gate: SSIM against committed golden frames at both folds.
