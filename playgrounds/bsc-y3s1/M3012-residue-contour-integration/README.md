# The residue theorem

Integrating a complex function around a closed loop sounds like it should depend on every twist of the path, but for an analytic function it depends on almost nothing: only on which poles the loop happens to encircle. That is the residue theorem, $\oint_C f(z)\,dz = 2\pi i \sum \mathrm{Res}(f, z_k)$ summed over the poles inside $C$, and it is the workhorse that turns hopeless real integrals into a quick tally of residues. The scene colours the plane by the phase of $f$, the hue cycling through every value around each pole so the singularities glow as little pinwheels, and marks each pole with its residue. Drag the contour around and resize it: the integral printed below is computed numerically straight from the loop, yet it always lands exactly on $2\pi i$ times the residues you have lassoed, and on nothing else.

Slide the radius outward from zero and the integral sits flat while the loop is between poles, then jumps in a single step by $2\pi i\,\mathrm{Res}$ the instant a pole crosses the boundary, which the bottom panel records as a staircase in the real and imaginary parts. Enclose no poles and the loop integrates to zero, whatever its shape; enclose every pole of a proper rational function and the residues cancel back to zero, the reason such an integral over a large circle vanishes.

Next function cycles a map with poles on the real axis, a conjugate pair on the imaginary axis, and a triple meeting at the origin, so you can watch the staircase rearrange itself as the poles sit at different distances from the centre. The whole thing is the engine behind evaluating real integrals by closing a contour in the upper half-plane and reading off the residues caught inside.

## Reference

Ablowitz and Fokas, *Complex Variables*, 2nd ed., Ch. 4 (the residue theorem); Arfken, Weber, Harris, *Mathematical Methods for Physicists*, 7th ed., Sec. 11.8.

## Verification

- Strong invariants: the numeric contour integral equals $2\pi i$ times the enclosed-residue sum; a contour enclosing no pole integrates to zero; the integral jumps by $2\pi i\,\mathrm{Res}$ when a pole is swallowed (and all poles of a proper rational function sum to zero).
- Visual gate: SSIM against committed golden frames at both folds.
