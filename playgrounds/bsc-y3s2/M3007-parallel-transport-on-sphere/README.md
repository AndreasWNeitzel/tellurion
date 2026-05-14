# Parallel transport on a sphere

A Beltrami spherical triangle has interior angles summing to $\pi$ + (enclosed solid angle). Parallel-transporting a vector around the triangle rotates it by that solid angle (holonomy). For one vertex at the north pole and the other two at colatitude $\alpha$ separated by longitude $\beta$, the holonomy is $(1 - \cos\alpha) \beta$.

Look for the hemisphere limit ($\alpha = 90, \beta = 360$): holonomy $= 2\pi$, a full rotation. The Foucault-pendulum playground demonstrates the same principle dynamically on circles of constant latitude.

Two sliders for $\alpha$ and $\beta$.

## Reference

Primary citation: Carroll, *Spacetime and Geometry*, Ch. 3 (`carroll2019`).

## Verification

- Strong invariants: hemisphere holonomy $= 2\pi$ exact; Gauss-Bonnet $A + B + C - \pi = \Omega$ within $10^{-12}$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
