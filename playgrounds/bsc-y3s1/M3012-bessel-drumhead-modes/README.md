# Vibrating drumhead modes

Strike a circular drum and it does not ring on a single clean pitch the way a string does, and the reason is geometry. Solving the wave equation on a disk, the displacement separates into an angular part $\cos(m\theta)$ and a radial part that turns out to be a Bessel function $J_m(kr)$, the natural standing wave of a round membrane. Clamping the rim forces $J_m(ka)=0$, so the only allowed wavenumbers are $k_{mn} = j_{m,n}/a$ where $j_{m,n}$ is the $n$-th zero of $J_m$, and the frequencies scale with those zeros. The scene paints the mode as it breathes in and out, red rising and blue falling, with the still lines drawn on top: $m$ nodal diameters from the angular factor and $n-1$ nodal circles from the interior zeros of the Bessel function, the same shapes sand grains settle into on a Chladni plate.

The bottom panel is that radial profile $J_m(kr)$, and its zeros are exactly the nodal circles you see in the disk, with the last zero pinned to the rim, the boundary condition that quantises the frequencies. Step the angular number $m$ and a nodal diameter appears straight across the drum; step the radial number $n$ and a nodal ring appears, matching a fresh zero in the profile.

The catch, and the reason a drum sounds more like a thud than a note, lives in the frequencies. The Bessel zeros are not in any simple integer ratio, so the overtones are inharmonic, scattered rather than stacked like a string's $1, 2, 3, \ldots$. The readout shows each mode's frequency as a multiple of the fundamental, and they refuse to be whole numbers.

## Reference

Arfken, Weber, Harris, *Mathematical Methods for Physicists*, 7th ed., Sec. 14 (Bessel functions); Kreyszig, *Advanced Engineering Mathematics*, 10th ed., Sec. 12.10.

## Verification

- Strong invariants: the clamped rim forces $J_m(ka)=0$ (checked against tabulated zeros $j_{0,1}=2.405$, $j_{1,1}=3.832$, ...); mode $(m,n)$ has $m$ nodal diameters and $n-1$ nodal circles at the interior zeros; the frequency ratios are non-integer (inharmonic).
- Visual gate: SSIM against committed golden frames at both folds.
