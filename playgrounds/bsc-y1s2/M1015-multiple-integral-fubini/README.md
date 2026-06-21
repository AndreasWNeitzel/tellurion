# Fubini's theorem as a sliceable volume

A double integral over a rectangle is the volume of the solid trapped under the
surface z = f(x,y). You cannot add a volume up at once, so you slice it into
thin slabs and sum them. The scene draws that solid in an oblique 3D
projection over a region you can resize, and cuts it in the order you pick:
slicing along x gives fins that recede into depth (each fin is the inner
integral over y), slicing along y gives walls stacked front to back (each wall
is the inner integral over x). A sweep fills the slabs in one at a time so you
watch the volume build.

The point of Fubini is that both stacks fill the same solid, so the two
iterated integrals are equal. The lower plot accumulates the volume in both
orders at once: for the symmetric dome the two routes coincide, but for the
asymmetric slant they climb along visibly different curves (one like x squared,
the other like a sine) and still land on exactly the same total V. Switch the
integrand to the wave to see a function that does not separate into a product
of x and y at all, where the order really is a free choice.

Controls: the integrand select (dome, slant, wave, all non-negative so the
integral is a genuine volume), the slice-order select, the back-corner drag to
resize the region, and play/pause and reset. The metric is the accumulated
volume, computed by nested Simpson quadrature of the cross-sections.

## Reference

Primary citation: Riley, Hobson, Bence, *Mathematical Methods for Physics and
Engineering*, 3rd ed., Ch. 10.

## Verification

- Both iterated orders agree to better than 1e-6 for every integrand, on the
  full square and on a sub-rectangle (the Fubini equality).
- The closed forms (dome, slant) match quadrature to 1e-5; stacking the
  cross-sections recovers the volume to 1e-3; every integrand is non-negative
  on the domain. All in `invariants.test.mjs` (17 tests).
- Live readout: |V(dx dy) - V(dy dx)| (Fubini), in the rail.
