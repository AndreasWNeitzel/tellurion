# The Lane-Emden polytrope

A star is a ball of gas held up against its own gravity by pressure, and the simplest model of one assumes the two are tied by a power law, $P = K\rho^{1+1/n}$, a polytrope of index $n$. Feed that into the equation of hydrostatic equilibrium and everything collapses to a single dimensionless equation for the scaled density $\theta$, the Lane-Emden equation, integrated outward from the centre until $\theta$ first hits zero, which marks the surface at $\xi_1$. The index $n$ is the whole story: it sets how steeply the density falls from core to edge.

At $n=0$ the star is a uniform sphere of constant density with surface at $\xi_1 = \sqrt 6$; at $n=1$ the equation is solved exactly by $\theta = \sin\xi/\xi$ with surface at $\pi$; by $n=3$, the model for a star supported by radiation pressure or relativistic electrons, the density is already crushed into the centre, the core some fifty times denser than the average; and as $n \to 5$ the star formally swells to infinite radius. The scene paints the polytrope as a glowing disk, hot and bright where the gas is dense and fading to the cool surface, beside the density and enclosed-mass profiles. Drag the cursor and read how much of the star's mass lies inside any radius: for $n=3$, nearly four-fifths of it sits within the inner two-fifths of the radius.

The bottom panel tracks the central concentration, the ratio of central to mean density, as it climbs from one at $n=0$ toward infinity at $n=5$, the same trend that makes a real evolved star a tiny dense core wrapped in a tenuous envelope. The Lane-Emden equation itself is integrated by the project's shared polytrope engine, the same RK4 solver that backs the asteroseismic models.

## Reference

Chandrasekhar, *An Introduction to the Study of Stellar Structure*, 1939, Ch. 4; Kippenhahn, Weigert, Weiss, *Stellar Structure and Evolution*, 2nd ed., Ch. 19.

## Verification

- Strong invariants: the surface zero $\xi_1$ matches the known values ($\sqrt 6$ for n=0, $\pi$ for n=1, 6.897 for n=3); the central concentration $\rho_c/\langle\rho\rangle$ rises with n (1 at n=0, about 54 at n=3); the enclosed mass fraction rises monotonically from 0 to 1.
- Visual gate: SSIM against committed golden frames at both folds.
