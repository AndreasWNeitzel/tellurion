# SPH 1D Sod shock tube

A one-dimensional smoothed particle hydrodynamics (SPH) simulation of the Sod
shock tube problem. The fluid is represented as 360 Lagrangian particles. A
high-pressure left state (rho = 1.0, P = 1.0) is initially separated by a
membrane from a low-pressure right state (rho = 0.125, P = 0.1). When the
membrane is removed at t = 0, three waves develop: a left-going rarefaction
fan, a central contact discontinuity, and a right-going shock. The artificial
viscosity term (Monaghan 1992) is what allows SPH to capture the shock.

The animation reveals the three-wave Riemann structure. The density panel
shows the rarefaction smoothing out on the left and the post-shock plateau on
the right, with a sharp jump at the shock front. The velocity panel shows a
plateau in the central region (between the rarefaction tail and the contact)
that drops back to zero at the shock. The pressure panel matches the velocity
shape but with a sharp jump at the shock front. The contact discontinuity
appears in the density panel only; pressure and velocity remain smooth across
it.

Use the speed slider to control how many SPH steps run per render frame.
Field highlights which of the three traces (rho, v, P) is annotated. Reset
restarts from t = 0. Pause/Play freezes and resumes the simulation.

## Reference

- Sod 1978 J. Comp. Phys. 27, 1 (`sod1978`)
- Monaghan 1992 ARAA 30, 543 (`monaghan1992`)
- Price 2012 J. Comp. Phys. 231, 759 (`price2012sph`)
- LeVeque 2002 FVM Ch. 14 (`leveque2002`)

## Verification

- Strong invariant: Lagrangian total mass exact to 1e-12 over 200 steps;
  energy drift below 5 percent.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
