# Stellar Oscillation Modes

A non-radial stellar oscillation separates into an angular part and a radial part. The sphere shows the angular part, the real spherical harmonic Y_l^m(theta, phi) cos(omega t), as a radially displaced surface (red outward, blue inward) with its nodal lines: l - |m| circles of latitude and 2|m| meridians. The lower panel shows the radial part, the displacement eigenfunction xi_r(r) of a real n=3 Lane-Emden polytrope, whose number of interior nodes is the radial order n. Acoustic frequencies come from the asymptotic JWKB quantisation of the sound-speed cavity, scaled to a solar-like large separation Delta_nu = 135 uHz.

The point to take away is the division of labour between the three integers. Sweep m at fixed n and l: the surface pattern reorganises from latitude rings to a meridional checkerboard, but the radial eigenfunction below does not move, because m is only an orientation. Raise n: each new node appears in the eigenfunction as another shell where the gas reverses direction, and the frequency climbs by one large separation. Raise l: the p-mode turning point marches outward and the cavity shrinks toward the surface, so high-degree modes never reach the core.

The n, l, m sliders pick the mode (m is clamped to |m| <= l automatically). Play/Pause freezes the oscillation phase; Reset returns to the default mode. The eigenfunction and turning point are recomputed only when n or l change.

## Reference

Aerts, Christensen-Dalsgaard and Kurtz, *Asteroseismology* (Springer, 2010), Ch. 1 and 3; Tassoul, ApJS 43 (1980) 469; Lane-Emden structure per Chandrasekhar, *Stellar Structure*, Ch. 4.

## Verification

- Strong invariants: radial eigenfunction has exactly n interior nodes for all tested (n, l); Lane-Emden first zero xi_1 = 6.89685; l=0 ladder spacing equals the pinned Delta_nu; spherical harmonics orthonormal over the sphere.
- Visual gate: SSIM > 0.92 against committed golden frames.
