# Gauss's law: the flux counts the charge inside

A closed loop drawn around point charges has an electric flux through it equal to
the enclosed charge over epsilon-zero, no matter how the loop is sized, stretched,
or dented into a blob. Move a charge outside and the flux drops to exactly zero,
because every field line that enters the loop also leaves it. The field is shown
streaming through the loop as advected tracer dots, with outflow marked red and
inflow blue, and the flux is computed live by Simpson integration of the closed
line integral.

Look for the flux readout holding fixed while you resize or deform the loop, then
jumping by one full unit the instant a charge crosses the boundary. Enclose the
plus and minus pair and the net charge is zero, so the flux is zero even though
the field between the charges is strong. The lower plot is the flux contribution
all the way around the loop; its signed area is the total flux.

Use the charges selector (one +, two +, or a + and - pair), the surface-shape
selector, and the size slider; drag any charge or the loop centre with the
pointer. Pause freezes the streaming and Reset restores the defaults.

## Reference

Primary citation: Griffiths, *Introduction to Electrodynamics*, 4th ed., Ch. 2.

## Verification

- Strong invariants: flux through an enclosing loop equals q/epsilon-zero within
  1e-6; zero for an outside charge; invariant under aspect ratio and blob
  deformation; linear in the charge.
- Live readout: the measured flux equals the enclosed charge over epsilon-zero
  (Gauss's law), checked each frame in the rail.
