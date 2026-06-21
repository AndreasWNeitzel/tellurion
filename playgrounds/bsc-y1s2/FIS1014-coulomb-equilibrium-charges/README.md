# Coulomb equilibrium and Earnshaw's theorem

Fixed point charges (two +, a + square, or a + triangle) set up a potential
landscape, drawn here as equipotential contours over a diverging colour map.
A Newton solve marks the force-free balance point, where the net Coulomb force
on a test charge is zero. It looks like a charge could rest there. It cannot:
release the test charge and it always slides off, runs to a charge, or escapes.

Earnshaw's theorem is the reason. The electrostatic potential is harmonic in
three dimensions, so the three principal curvatures at the balance point sum to
zero (Vxx + Vyy + Vzz = 0). At least one of them is therefore a hill. The lower
plot slices the potential along the two in-plane axes and out of the plane (z);
even when the in-plane slices are both valleys (a square, stable in the plane),
the z slice is a hill, so the charge escapes upward. No static arrangement can
trap a charge, which is why ion traps use oscillating fields.

Use the charges selector and the test-charge sign selector; drag any fixed
charge or the test charge with the pointer. Pause freezes the motion and Reset
drops the test charge back at the balance point.

## Reference

Primary citation: Griffiths, *Introduction to Electrodynamics*, 4th ed., Ch. 2;
Earnshaw, *Trans. Camb. Phil. Soc.* 7 (1842).

## Verification

- Strong invariants: symmetric-configuration force nulls; single-charge inverse
  square; quadrupole potential at the origin (all within 1e-6).
- Live readout: Vxx + Vyy + Vzz = 0 at the balance point (3D Laplace), checked
  each frame in the rail.
