# Coupled springs and normal modes

Two equal masses on a frictionless track, connected by three identical
springs to two fixed walls. The system has two normal modes: a symmetric
in-phase mode at omega_+ = sqrt(k / m), and an antisymmetric out-of-phase
mode at omega_- = sqrt(3 k / m). Generic initial conditions excite both
modes; the visible motion is the superposition. Integration is by
velocity-Verlet with dt = 0.01.

Look for: in the +mode preset, both masses oscillate together at the lower
frequency; in the -mode preset they oscillate exactly opposite at the higher
frequency. The generic preset (x1 = 0.7, x2 = 0) shows energy sloshing
between the two masses, a beat at envelope frequency 0.366 cycles per unit
time. The phase portrait (x1, x2) is a straight line for eigenmodes and a
dense quasiperiodic figure for generic ICs (because omega_- / omega_+ is
irrational).

Use the +mode, -mode, generic buttons to switch initial conditions. The
speed slider changes how many integrator steps run per frame. Reset puts
the system back to the chosen preset. Pause/Play freezes motion.

## Reference

- Goldstein, Classical Mechanics 3e Ch. 6 (`goldstein2001`)

## Verification

- Strong invariant: eigenfrequencies exact, energy drift below 1e-3 over
  10^4 Verlet steps; numerical state matches analytic decomposition within
  1e-3 at t = 2.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
