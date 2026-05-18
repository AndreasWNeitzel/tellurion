# Friedmann Expansion: Radiation, Matter and Lambda Eras

This playground runs a flat universe made of radiation, matter and a
cosmological constant. The top panel is a comoving galaxy grid that
expands with the scale factor as cosmic time sweeps forward, with the
particle horizon and the Hubble radius drawn around the central
observer. The lower-left panel is the scale factor a(t) and the Hubble
parameter H(t); the lower-right panel stacks the three density
fractions against log a so the eras and their crossovers are explicit.

Watch the universe run through its three ages: radiation dominates the
first sliver, matter takes over for most of cosmic history, and dark
energy wins late, at which point the expansion stops decelerating and
starts to accelerate (the bend in a(t) and the sign change of the
deceleration parameter). The galaxy grid expands from a tiny dense
patch to a sparse, far-flung set of points, and the Hubble parameter
falls toward a constant floor, the de Sitter rate set by the
cosmological constant. For Planck values the age comes out at 13.8
billion years and H equals H0 exactly at the present (a = 1).

`Omega_m` sets the matter density (dark energy is fixed by the flat
closure so the densities always sum to one). `H0` sets the Hubble
constant, hence the age and all timescales. `Omega_r` sets the small
radiation density and therefore the matter-radiation equality. Reset
returns to the Planck cosmology. Pause/Play stops or replays the
cosmic-time sweep, and Copy URL shares the exact state. The a(t) and
density panels read without motion for `prefers-reduced-motion`.

## Reference

Primary citation: `ryden-cosmology` (the multicomponent Friedmann
equation and eras); see also `friedmann1922` and `planck2018-vi`.

## Verification

- Strong invariant: `H = H0` at `a = 1` to 0.01% (flat closure); the
  age is 13.8 Gyr for Planck LCDM to 1%; the expansion is monotone
  and turns from decelerating to accelerating.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
