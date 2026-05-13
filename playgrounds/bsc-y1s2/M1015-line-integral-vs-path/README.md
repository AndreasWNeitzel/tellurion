# Line integrals and path independence

A vector field $\mathbf{F} = (P, Q)$ in the plane. Two paths from $A$ to $B$: straight and semicircular arc. The line integral $\int \mathbf{F} \cdot d\mathbf{r}$ depends on the field. For conservative fields ($P_y = Q_x$) the two paths agree; for non-conservative fields they differ, and the closed-loop integral equals the curl integrated over the enclosed area (Stokes).

Look for the path-independence flip: switch from conservative1 to rotation and watch the closed-loop readout jump from zero to $\pi$. The two conservative fields demonstrate that any path between fixed endpoints gives the same integral; the rotation and shear fields show that the choice of path matters.

Single dropdown selects between four fields. Endpoints fixed at $A = (-1, 0)$, $B = (1, 0)$.

## Reference

Primary citation: Riley-Hobson-Bence, *Mathematical Methods for Physics and Engineering*, 3e, Ch. 10 (`riley-hobson`).

## Verification

- Strong invariants: conservative fields have zero closed-loop integral within $10^{-6}$; rotation field gives closed-loop integral $\approx \pi$ (Stokes).
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
