# Maxwell-Boltzmann emergence from hard-disk collisions

80 hard disks in a 2D box, all starting at the same speed v_0 but with
random directions. Walls reflect, and disk-disk collisions are elastic.
Over time the pairwise collisions redistribute the speeds: despite the
delta-function initial condition, the distribution converges to the 2D
Maxwell-Boltzmann form. The total kinetic energy is conserved exactly;
only the distribution shape changes.

Look for: at t = 0 the disks are all the same color (same speed). After
a few hundred time units, the color spreads as some disks slow down and
others speed up. The right-side histogram broadens from a single bar at
v_0 to a smooth distribution matching the analytic 2D MB curve (orange
line). The mean speed drops from v_0 = 1.0 to about 0.886, the MB mean
in 2D.

Use the speed slider to set integration rate. Reset re-initializes with
the delta initial condition.

## Reference

- Reif, Fundamentals of Statistical and Thermal Physics Ch. 1 (`reif`).

## Verification

- Strong invariant: KE conservation to 1e-9 per step; mean speed
  converges to the analytic MB mean sigma sqrt(pi / 2).
- Visual gate: SSIM > 0.92 across 5 frames showing thermalization.
- Last verified: see `.verified`.
