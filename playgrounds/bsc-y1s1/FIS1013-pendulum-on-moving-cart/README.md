# Pendulum on a moving cart

A frictionless cart of mass M = 2 on a horizontal rail with a rigid
pendulum of length L = 1 and bob mass m = 0.5 hanging from a pivot.
Two-DOF Lagrangian system: when the pendulum swings, the cart slides
to conserve total horizontal momentum. Both energy and momentum are
exactly conserved by the EOM (the integrator preserves them to 1e-3 and
1e-8 respectively under RK4).

Look for: at theta_0 = 0.8, the pendulum swings and the cart rolls
back-and-forth in the opposite direction (Newton's third law). The bob
trail traces a Lissajous-like figure because the cart-pendulum motion
is a quasiperiodic two-frequency system. The phase portrait below shows
how theta and x_cart trace a closed curve.

Use the theta_0 slider for the initial angle. Speed controls integrator
rate. Reset re-initializes from rest at the chosen angle.

## Reference

- Marion and Thornton, Classical Dynamics 5e Ch. 7 (`marion-thornton`).

## Verification

- Strong invariant: energy conservation 1e-3; horizontal-momentum
  conservation 1e-8; equilibrium fixed point.
- Visual gate: SSIM > 0.92 across 5 frames.
- Last verified: see `.verified`.
