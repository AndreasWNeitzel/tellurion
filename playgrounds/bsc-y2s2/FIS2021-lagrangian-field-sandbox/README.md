# Lagrangian Sandbox

Lagrangian mechanics says you do not need to track forces: write down
the kinetic minus the potential energy, turn the Euler-Lagrange crank,
and the equations of motion fall out. This sandbox does exactly that
for four classic systems and integrates them with the same RK4 solver
the orbit playgrounds use. The two panels are the lesson: the left is
configuration space, the body moving in real space; the right is
phase space, the same instant of motion collapsed to one point at
position and velocity. For the pendulum and the Kepler radial
problem, the dashed gold curve is the exact conserved-energy level
set H = E0, and the moving point never leaves it. That is Noether's
theorem made geometric: the conservation law is the contour.

What to look for: the Hamiltonian readout barely moves because none
of these Lagrangians depend explicitly on time, even while a double
pendulum thrashes chaotically. Switch to the Kepler orbit and the
planet traces a true ellipse with the Sun at the focus; raise gravity
and the orbit keeps its shape but the period drops, Kepler's third
law live, while the radial phase point shuttles along its
effective-potential contour between peri- and apoapsis. A second
conserved quantity, angular momentum, appears for the central
systems and shows as a dash for the gravity-loaded pendulum, where
gravity picks a direction and breaks the rotational symmetry, the
converse of Noether's theorem in one readout. Push the pendulum
amplitude past the separatrix and its phase loop opens from
libration into rotation.

Controls: the system selector chooses the mechanism; gravity sets the
field strength (for Kepler the gravitational parameter, hence the
orbital period); amplitude sets the swing or the orbit eccentricity;
speed scales time; Reset returns to the simple pendulum and Pause
freezes it.

## Reference

Primary citation: Goldstein, Poole and Safko, *Classical Mechanics*
(3rd ed.), Ch. 1-3 (`goldstein-mech`); Landau and Lifshitz,
*Mechanics* (3rd ed.), Sec. 1-7 (`landau-mechanics`).

## Verification

- Strong invariant: the small-amplitude pendulum period is
  2 pi sqrt(l/g) to 0.5 percent; RK4 conserves energy to better than
  1e-3 for every system; angular momentum is conserved for the
  central systems and provably broken when gravity removes the
  rotational symmetry; the double-pendulum normal modes and the
  libration/rotation separatrix are reproduced.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
