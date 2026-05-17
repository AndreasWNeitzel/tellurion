# Lagrangian Sandbox

Lagrangian mechanics says you do not need to track forces: write down
the kinetic minus the potential energy, turn the Euler-Lagrange crank,
and the equations of motion fall out. This sandbox does exactly that
for four classic systems and integrates them with the same RK4
solver the orbit playgrounds use. The left panel is the mechanism;
the right is its phase portrait, the curve the state traces in
position-velocity space.

What to look for: the readouts are the conserved quantities Noether's
theorem promises. The Hamiltonian H barely moves because none of
these Lagrangians depend explicitly on time, even while a double
pendulum is thrashing chaotically, that flat energy readout is the
headline. Switch to the Kepler orbit and a second conserved quantity
appears: angular momentum, because a central force has no preferred
direction. Switch to the elastic pendulum and angular momentum is
shown as a dash, because gravity does pick a direction and breaks
that symmetry, the converse of Noether's theorem in one readout.
Push the pendulum amplitude past the separatrix and its phase loop
opens from libration into rotation.

Controls: the system selector chooses the mechanism; gravity and
amplitude set the dynamics; speed scales time; Reset returns to the
simple pendulum and Pause freezes it.

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
