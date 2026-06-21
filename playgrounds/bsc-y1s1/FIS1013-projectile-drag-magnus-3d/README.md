# Projectile with drag and the Magnus force

A ball is launched over a ground grid under gravity, quadratic air drag, and
the Magnus force from spin. The equation of motion is dv/dt = -g z - c|v|v +
cM (omega x v): drag always opposes the motion and shortens the throw, while
the Magnus force, perpendicular to both the velocity and the spin axis, pushes
the ball sideways. The trajectory is integrated with RK4 until it hits the
ground.

Look for the gap between the bright path and the faint dashed reference, which
is the same launch with no spin: that gap is the Magnus bend alone. The
ground-shadow tracks make it unambiguous, sidespin curves the shadow sideways
across the grid, while backspin and topspin leave it straight but move the
landing nearer or further. The lower plot sweeps the spin rate and shows the
range and the lateral deflection at landing.

Use the spin selector (sidespin, backspin, topspin, none) and the spin-rate,
speed, and angle sliders; Pause freezes the flight and Reset restores the
defaults. The ball relaunches on a loop so the full arc is always visible.

## Reference

Primary citation: Marion and Thornton, *Classical Dynamics of Particles and
Systems*, 5th ed., Ch. 2; R. K. Adair, *The Physics of Baseball*, 3rd ed.

## Verification

- Strong invariant: vacuum range and apex match the analytic parabola within
  0.2%; the Magnus force is perpendicular to velocity (does no work).
- Sidespin deflects laterally while topspin does not; backspin out-ranges
  topspin; drag strictly shortens the range.
- Live readout: the Magnus-force-perpendicular-to-velocity cosine, in the rail.
