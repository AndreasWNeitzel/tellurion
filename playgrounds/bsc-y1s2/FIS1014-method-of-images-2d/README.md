# Method of images: grounded conductors

A point charge held near a grounded conductor induces a surface charge that
makes the metal an equipotential. Solving that directly is hard, but the field
in the empty region is identical to that of the real charge plus a few image
charges placed where the conductor used to be, chosen so the potential is zero
on the surface. Switch the geometry to see the classic Griffiths cases: a
grounded plane (one image at the mirror point), a right-angle corner (three
images), a 60-degree wedge or "pizza slice" (five images around the apex), and
a grounded sphere (one image inside, at the inverse point R squared over d with
charge scaled by R over d).

Every field line strikes the conductor at a right angle, the signature of an
equipotential surface, and the induced charge is shaded along the boundary,
darkest where the real charge is closest. Switch to reveal image and the
conductor disappears, leaving only the image charges that produced the same
field. The lower plot is the induced surface charge along the conductor; the
rail confirms the potential stays zero on the metal (max |V| is machine-zero).

Use the geometry, view, and charge-sign selectors; drag the charge anywhere in
the field region. The static scene is cached and only the marching arrowheads
redraw each frame, so the field-line flow stays smooth. Pause freezes it and
Reset restores the defaults.

## Reference

Primary citation: Griffiths, *Introduction to Electrodynamics*, 4th ed.,
Sec. 3.2 (`griffiths-em`).

## Verification

- The potential is zero on the conductor for all four geometries (max |V| <
  1e-9 in the tests, machine-zero in the live rail).
- The image counts (1, 3, 5, 1) and the sphere rule (image -(R/d)q at R^2/d)
  are checked exactly, as is the net induced charge. All in
  `invariants.test.mjs` (8 tests).
