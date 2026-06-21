# Green's theorem: circulation and curl

Green's theorem is the planar cousin of Stokes's theorem, and it relates a field's behavior on a boundary to its behavior inside, just like the divergence theorem does, but for swirl rather than spread. In circulation form it reads $\oint_C \mathbf{F}\cdot d\mathbf{r} = \iint_A (\nabla\times\mathbf{F})\,dA$: the circulation, the total tangential push of the field as you walk once around a closed curve, equals the integral of the curl over the area enclosed. The curl is the local rate of rotation, the spin a tiny paddlewheel dropped into the flow would feel, positive for counterclockwise. The top panel shows the field as arrows, the curl as a red-for-counterclockwise, blue-for-clockwise heatmap, and a circle you can drag and resize whose boundary is coloured red where the flow runs counterclockwise around it and blue where it runs clockwise. The circulation and the area integral of the curl are computed live and printed at the bottom.

Drag the circle anywhere and the two numbers stay locked together, which is the theorem. On the rotation field every arrow circles counterclockwise, the boundary is all red, and the circulation comes out to twice the enclosed area. On the irrotational source the arrows point straight out, the boundary is half red and half blue, and the circulation is zero because the curl is zero everywhere. The varying-curl field has a red region and a blue region, so sliding the circle between them flips the sign of the circulation. The point vortex is the punchline: its curl is zero everywhere except at the vortex itself, so its circulation is a fixed value whenever the loop encloses the vortex and zero when it does not, jumping the instant the vortex crosses the boundary. That is Ampere's law, with the field the magnetic field and the vortex a current-carrying wire: the circulation of the field around any loop counts the current threading it.

Next field cycles the five fields, the radius slider sizes the circle, dragging moves it, and Reset returns to the start. The circulation is summed around the boundary and the curl integral over the interior, so their agreement is computed, not assumed.

## Reference

Stewart, *Calculus*, 8th ed., Sec. 16.4 (Green's theorem); Griffiths, *Introduction to Electrodynamics*, 5th ed., Sec. 1.3.5 and 5.3 (Stokes's theorem and Ampere's law).

## Verification

- Strong invariants: the circulation equals the area integral of $\nabla\times\mathbf{F}$ for smooth fields; the rotation field circulation equals twice the enclosed area; the point-vortex circulation is $2\pi$ when the vortex is enclosed and zero otherwise.
- Visual gate: SSIM against committed golden frames at both folds.
