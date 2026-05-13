# Kapitza inverted pendulum

A pendulum with its pivot driven vertically at high frequency. Kapitza
1951 showed that for $a^2 \omega^2 > 2 g l$ the upside-down equilibrium
is stable: small tilts decay back to theta = 0. Below threshold, the
natural instability dominates and the pendulum falls. This is a
canonical example of parametric stabilization.

Look for: at a = 0.1, omega = 60: ratio = 3.7 > 1, stable, pendulum
bobs around upside-down. Reduce omega below ~ 44 (ratio = 1) and
watch the pendulum fall. The right panel shows the effective
slow-time potential: it has a local minimum at theta = 0 when the
criterion is satisfied.

Use the a and omega sliders to find the boundary. Reset re-launches
from theta_0 = 0.1.

## Reference

- Landau and Lifshitz, Mechanics Sec. 30 (`landau-lifshitz-mechanics`).
- Kapitza 1951.

## Verification

- Strong invariant: stability criterion exact; bounded above threshold;
  falls below; effective-potential minimum at theta = 0.
- Visual gate: SSIM > 0.92 across 5 frames.
- Last verified: see `.verified`.
