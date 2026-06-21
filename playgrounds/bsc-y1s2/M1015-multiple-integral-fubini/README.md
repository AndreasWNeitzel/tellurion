# Fubini's theorem: slice it any way

A double integral is the signed volume between a surface and a patch of the
plane. You compute it by slicing: cut the patch into thin vertical strips,
integrate the surface along each, and add the strips up (dy then dx); or cut it
into horizontal strips (dx then dy). Fubini's theorem says that for a well-behaved
surface both orders give exactly the same number. The scene shows the integrand
sin(x)cos(y) as a colour map over a resizable rectangle with a slab sweeping
across it; the lower plot accumulates the volume in both orders at once.

Look for the two running totals in the lower plot: they climb along different
paths as their slabs sweep, then land on precisely the same final value (the
exact double integral). Switch the slice order and the scene sweeps the other
way, but the total does not change. Drag the region corner and both totals
re-converge to the new value.

Use the slice-order selector and drag the gold corner handle to resize the
rectangle. Pause freezes the sweep and Reset restores the default region
[0, pi] x [0, pi/2].

## Reference

Primary citation: Riley, Hobson, Bence, *Mathematical Methods for Physics and
Engineering*, 3rd ed., Ch. 6.

## Verification

- Strong invariants: the two iterated orders agree within 1e-6 on the full
  square; the iterated total matches the exact closed form within 1e-4;
  integrating each inner integral over the outer variable recovers the double
  integral.
- Live readout: |double integral dxdy - double integral dydx| (Fubini), in the
  rail.
