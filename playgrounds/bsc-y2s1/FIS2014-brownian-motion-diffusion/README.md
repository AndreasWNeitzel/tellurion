# Brownian Motion and the Diffusion Law

This playground releases 1600 independent walkers from one point in a
two-dimensional fluid. Each takes Gaussian steps, so the ensemble
blurs into a Gaussian cloud whose mean-squared displacement grows as
`<r^2> = 4Dt`. A highlighted tracer is drawn large with its
random-walk trail and the solvent molecules buffeting it. The
diffusion coefficient is the Stokes-Einstein value
`D = kB T / (6 pi eta r)`.

Watch the dashed circle: it is the rms radius `sqrt(4Dt)` and always
contains about 63 percent of the walkers, the signature of a
two-dimensional Gaussian. The side panels make the law explicit, the
measured `<r^2>` lying on the `4Dt` line and the displacement
histogram on the Gaussian. Drag the temperature up, or the viscosity
or tracer radius down, and the cloud widens at the same elapsed time
because `D` rose; the readout reports the physical `D` in m^2/s.

The temperature slider sets `T` in kelvin, the viscosity slider sets
`eta` in mPa s, and the radius slider sets the tracer radius in nm;
each rebuilds the ensemble so the change is visible at once. Reset
returns to water-like defaults (300 K, 1 mPa s, 1 nm) and Pause
freezes the diffusion.

## Reference

Primary citation: Reif, *Fundamentals of Statistical and Thermal
Physics*, Ch. 1 and Sec. 15.5-15.6 (`reif`).

## Verification

- Strong invariant: `<r^2> = 4 D t` within 5%; displacement KS
  statistic against the normal `< 0.05`.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
