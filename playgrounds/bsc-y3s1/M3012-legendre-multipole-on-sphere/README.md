# Legendre polynomials and multipoles

Far from any lump of charge, its potential settles into a tidy series, the multipole expansion, and the angular shape of each term is a Legendre polynomial $P_l(\cos\theta)$. The pieces are familiar by name: the monopole is the same in every direction, the dipole is $\cos\theta$ with a single belt of zero around the equator, the quadrupole adds another, and each higher multipole carves the sphere into more zones. The reason lives in the polynomial: $P_l$ has exactly $l$ zeros between $-1$ and $1$, and each zero is a nodal cone, a direction where that multipole contributes nothing, separating $l+1$ lobes that alternate in sign. The scene draws those lobes as a polar diagram around the vertical axis, red where $P_l$ is positive and blue where it is negative, with the nodal cones marked. The whole figure is what you get by spinning this cross-section about the axis, because the pure multipoles do not depend on the azimuth.

A probe sweeps the polar angle and ties the radius of the lobe to the value of the polynomial in the bottom panel, where $P_l(x)$ with $x = \cos\theta$ is plotted with its $l$ roots, the cosines of the cone angles. Every $P_l$ starts at $1$ when $\theta = 0$ and ends at $\pm 1$ at the south pole, and any two different Legendre polynomials are orthogonal over $[-1, 1]$, which is exactly why this set is the natural alphabet for expanding a field on a sphere: any angular shape is a unique sum of them.

Next multipole steps $l$ from the monopole up to $l = 5$. Each increment adds one nodal cone and one lobe, the sphere split into ever finer alternating zones, the same shapes that name the s, p, d, f orbitals and organise everything from gravitational fields to antenna patterns.

## Reference

Jackson, *Classical Electrodynamics*, 3rd ed., Sec. 3.2-3.3 (multipole expansion); Arfken, Weber, Harris, *Mathematical Methods for Physicists*, 7th ed., Sec. 15.

## Verification

- Strong invariants: $P_l$ has exactly $l$ nodal cones (roots in $(-1,1)$), giving $l+1$ lobes; $P_l(1) = 1$ and $P_l(-1) = (-1)^l$; the Legendre polynomials are orthogonal on $[-1,1]$ (checked numerically, with $\int P_l^2 = 2/(2l+1)$).
- Visual gate: SSIM against committed golden frames at both folds.
