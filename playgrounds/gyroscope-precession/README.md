# Gyroscope precession

A heavy symmetric top under gravity precesses about the vertical at
Omega_p = M g r / (I_s omega_s). Faster spin = slower precession. The
tip of the axis sweeps out a horizontal circle at constant tilt theta.
This is the leading-order, omega_s >> Omega_p approximation; full
Euler-equation dynamics also include nutation.

Look for: at omega_s = 50, the top precesses at about 1 rad/s; at omega_s
= 200, it precesses at only 0.25 rad/s (4x slower). Push omega_s back
down and watch the precession speed up. The right panel shows the
1 / omega_s scaling explicitly.

Use the omega_s and theta sliders. Speed controls animation rate.

## Reference

- Marion and Thornton, Classical Dynamics 5e Ch. 11 (`marion-thornton`).

## Verification

- Strong invariant: precession-rate formula exact; tilt constant; tip
  traces circle.
- Visual gate: SSIM > 0.92 across 5 frames.
- Last verified: see `.verified`.
