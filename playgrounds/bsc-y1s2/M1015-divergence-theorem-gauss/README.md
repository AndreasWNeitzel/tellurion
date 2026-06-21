# The divergence theorem

The divergence theorem is the bookkeeping rule that ties a field's behavior on a boundary to its behavior inside. In the plane it reads $\oint_C \mathbf{F}\cdot\mathbf{n}\,ds = \iint_A (\nabla\cdot\mathbf{F})\,dA$: the outward flux through a closed curve equals the integral of the divergence over the area it encloses. The divergence is the local rate at which the field spreads out, positive at sources, negative at sinks, and the theorem says those sources and sinks are accounted for exactly by what flows out through the boundary. The top panel shows the field as arrows, the divergence as a red-for-source, blue-for-sink heatmap, and a circle you can drag and resize whose boundary is coloured red where the field flows out and blue where it flows in. The two numbers, the flux and the area integral of the divergence, are computed live and printed at the bottom.

Drag the circle anywhere and the two numbers stay locked together, which is the theorem. On the radial source every arrow points outward, the boundary is all red, and the flux comes out to twice the enclosed area. On the rotation field the arrows circle around, the boundary is half red and half blue, and the flux is zero because the divergence is zero everywhere. The varying-divergence field has a red region and a blue region, so sliding the circle from one to the other flips the sign of the flux. The point source is the punchline: its divergence is zero everywhere except at the source itself, so its flux is a fixed value whenever the loop encloses the source and zero when it does not, jumping the instant the source crosses the boundary. That is Gauss's law, with the field the electric field and the source the charge: the flux out of any closed surface counts the charge inside.

Next field cycles the five fields, the radius slider sizes the circle, dragging moves it, and Reset returns to the start. The flux is summed around the boundary and the divergence integral over the interior, so their agreement is a computed result, not an assumption.

## Reference

Stewart, *Calculus*, 8th ed., Sec. 16.9 (the divergence theorem); Griffiths, *Introduction to Electrodynamics*, 5th ed., Sec. 1.3.4 and 2.2 (the divergence theorem and Gauss's law).

## Verification

- Strong invariants: the outward flux equals the area integral of $\nabla\cdot\mathbf{F}$ for smooth fields; the radial source flux equals twice the enclosed area; the point-source flux is $2\pi$ when the source is enclosed and zero otherwise.
- Visual gate: SSIM against committed golden frames at both folds.
