# Gauss's law: flux invariant under deformation

A 2D point charge inside a closed loop generates a flux $\oint \mathbf{E} \cdot \hat n\,ds = q / \epsilon_0$, regardless of how the loop is deformed - this is Gauss's law in two dimensions. If the charge moves outside the loop, the flux drops to zero exactly.

Look for the dual color signal: the loop turns accent-yellow when the charge is inside (flux $= q/\epsilon_0$) and muted gray when the charge is outside (flux $= 0$). Switching the shape from ellipse to blob doesn't change the flux at all.

Slider controls the shape, semi-axes, and charge x-position.

## Reference

Primary citation: Griffiths, *Introduction to Electrodynamics*, 5e, Ch. 2 (`griffithsem2017`).

## Verification

- Strong invariants: flux through enclosing ellipse equals $q/\epsilon_0$ within $10^{-6}$; flux zero for outside charge; invariant under deformation.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
