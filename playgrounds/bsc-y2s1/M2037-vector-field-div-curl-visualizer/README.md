# Divergence and curl of a 2D vector field

A parameterized 2D vector field with four canonical families: source (radial), rotation (azimuthal), shear (horizontal proportional to height), and saddle (stretch and compress). Each family has constant divergence and curl (closed-form), and the readout reports them at the origin.

Look for the visual signatures: a source has arrows fanning out, a rotation has arrows wrapping around, a shear has all arrows horizontal but stronger far from $y = 0$, and a saddle pulls horizontally while squeezing vertically. Slide the parameter $a$ to see linear scaling.

Dropdown selects the family; slider sets $a$.

## Reference

Primary citation: Riley-Hobson-Bence, *Mathematical Methods for Physics and Engineering*, 3e, Ch. 10 (`riley-hobson`).

## Verification

- Strong invariants: analytic div/curl match centered finite differences within $10^{-8}$; closed-form constants exact.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
