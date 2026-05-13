# Foucault pendulum: Coriolis precession

A small-amplitude pendulum suspended at latitude phi on a rotating Earth.
The Coriolis force acts perpendicular to the velocity in the horizontal
plane, with magnitude proportional to Omega sin(phi). It does no work
but slowly rotates the swing plane: at the pole (sin(phi) = 1) the
rotation is one full precession per Earth day; at the equator there is
no precession; in the southern hemisphere it reverses direction.

For visibility this demo scales time so the precession period at the
pole is 24 seconds instead of 24 hours. Look for: at latitude 45 deg
the swing plane completes a half-rotation in about 17 seconds; at 90 deg
in 12 seconds. The trace forms a Spirograph-like rosette. At latitude 0
the swing oscillates back and forth along the dashed initial axis with
no rotation. Slide latitude to the southern hemisphere to watch the
rotation reverse.

Use the latitude slider to select the location. Speed controls animation
rate. Reset re-initializes with the bob at (1, 0).

## Reference

- Marion and Thornton, Classical Dynamics 5e Ch. 10 (`marion-thornton`).

## Verification

- Strong invariant: precession-period formula T = T_ref / sin(lat);
  energy bounded under Coriolis (no-work invariant).
- Visual gate: SSIM > 0.92 across 5 frames showing rosette growth.
- Last verified: see `.verified`.
