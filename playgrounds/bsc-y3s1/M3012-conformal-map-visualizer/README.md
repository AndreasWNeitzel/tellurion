# Conformal maps of the complex plane

An analytic function $w = f(z)$ is a map of the plane onto itself, and it is a remarkably gentle one: wherever its derivative is nonzero it bends and stretches the plane but never tears an angle. Two curves that cross at some angle in the $z$-plane have images that cross at the very same angle in the $w$-plane. This is conformality, and it falls straight out of the derivative, because near a point $f$ acts as multiplication by the complex number $f'(z)$, which is just a rotation by $\arg f'(z)$ together with a uniform scaling by $|f'(z)|$, and a rotation-plus-scale leaves every angle alone. The left panel draws a square grid in the $z$-plane; the right panel draws its image, the same grid bent into curves but still meeting at right angles wherever the original did. Drag the probe and its little perpendicular cross maps to another perpendicular cross, rotated and resized but square.

The spell breaks only at a critical point, where $f'(z) = 0$. There the linear term vanishes, the cross collapses, and angles are not preserved but multiplied: $w = z^2$ opens a right angle into a straight line at the origin, doubling it. The bottom panel plots the local magnification $|f'(z)|$ along the probe's row on a log scale, so you can read off where the map stretches (large $|f'|$, near a pole) and where it pinches to a point (zero, at a critical point). Move the probe onto the row through a critical point and the curve plunges to the floor.

Next map cycles squaring, inversion $1/z$, the exponential (which turns vertical lines into circles and horizontal lines into rays), a Mobius map, and the Joukowski map $z + 1/z$ that famously carries a circle into an aerofoil. Each one redraws the image grid and the magnification, all still meeting at right angles away from their critical points and poles.

## Reference

Needham, *Visual Complex Analysis*, Ch. 4 (conformal mapping); Ablowitz and Fokas, *Complex Variables*, 2nd ed., Ch. 5.

## Verification

- Strong invariants: angles are preserved where $f'(z) \ne 0$ (a right angle stays a right angle); local area scales by $|f'(z)|^2$; the analytic derivative matches the finite-difference limit and vanishes at the listed critical points, where angles double.
- Visual gate: SSIM against committed golden frames at both folds.
