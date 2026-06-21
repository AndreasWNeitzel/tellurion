# Gyroscope precession

A heavy symmetric top under gravity precesses about the vertical at
Omega_p = M g r / (I_s omega_s). Faster spin = slower precession. The
tip of the axis sweeps out a horizontal circle at constant tilt theta.
This is the leading-order, omega_s >> Omega_p approximation; full
Euler-equation dynamics also include nutation.

Look for: at omega_s = 50 the top precesses at about 1 rad/s; at omega_s
= 100 it precesses at only 0.5 rad/s (twice as slow). Push omega_s back
down toward 20 and watch the precession speed up. The lower plot shows
the 1 / omega_s hyperbola explicitly, with the live operating point.

Use the spin rate and tilt sliders; Pause freezes the tumble and Reset
restores the defaults. The tilt changes the cone width but, in this
leading-order limit, not the precession rate (theta cancels).

## Reference

- Marion and Thornton, Classical Dynamics 5e Ch. 11 (`marion-thornton`).

## Verification

- Strong invariant: precession-rate formula exact; tilt constant; tip
  traces circle.
- Visual gate: SSIM > 0.92 across 5 frames.
- Last verified: see `.verified`.
