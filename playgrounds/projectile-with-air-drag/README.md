# Projectile motion with air drag

Three identical projectiles fired at the same speed and angle. The yellow
one is in vacuum (no drag); the cyan one has Stokes (linear) drag
F = -b v; the orange one has quadratic drag F = -c |v| v. All start at
the origin at t = 0 and land at different ranges, with the vacuum
trajectory traveling farthest.

Look for: the vacuum trajectory is a parabola, peaking and returning
symmetrically. Drag makes the trajectory asymmetric, with longer descent
than ascent. At high speeds quadratic drag dominates (because F ~ v^2);
at low speeds Stokes dominates. Without drag, 45 degrees gives the
maximum range; with drag the optimal angle is below 45 (try angle = 30
at high v).

Use the v_0 and angle sliders to set the launch. Speed controls
integrator rate. Reset re-fires from the origin.

## Reference

- Marion and Thornton, Classical Dynamics 5e Ch. 2 (`marion-thornton`).

## Verification

- Strong invariant: vacuum range matches v_0^2 sin(2 theta) / g to 1
  percent; both terminal velocities match analytic; 45 deg maximum.
- Visual gate: SSIM > 0.92 across 5 frames showing the three arcs.
- Last verified: see `.verified`.
