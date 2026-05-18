# Inflation: Slow Roll, Superhorizon Fluctuations, n_s

This playground runs single-field slow-roll inflation. The top panel
is the inflaton potential V(phi) with the field rolling down toward
the end of inflation (where the slow-roll parameter epsilon reaches 1).
The lower-left panel tracks quantum fluctuations: their physical
wavelength grows exponentially with the expansion while the Hubble
horizon stays nearly constant, so modes cross outside the horizon and
freeze. The lower-right panel is the scalar power spectrum P_s(k)
against a flat scale-invariant reference.

Watch a fluctuation get stretched: it starts smaller than the horizon,
the exponential expansion blows it up past the (almost flat) horizon
line, and from then on it is frozen, a classical density ripple that
will later become the cosmic microwave background and galaxies. The
spectrum those frozen modes leave behind is almost scale invariant but
tilts slightly red, n_s about 0.965, exactly the value Planck
measures. Switch between the quadratic potential and the Starobinsky
plateau: both give n_s near 0.965, but the plateau predicts a tiny
tensor-to-scalar ratio while m^2 phi^2 predicts a large one that the
data now rule out.

`potential` chooses the Starobinsky plateau or the quadratic
m^2 phi^2. `e-folds N` sets how many e-folds before the end the
observable scales left the horizon (this sets n_s and r). `mode
wavelength` picks the comoving scale of the tracked fluctuation. Reset
returns to the Starobinsky model at N = 57. Pause/Play stops or
replays the roll, and Copy URL shares the exact state. The potential
and spectrum panels read without motion for `prefers-reduced-motion`.

## Reference

Primary citation: `baumann-cosmology` (slow-roll inflation and the
spectrum); see also `mukhanov-cosmology`, `starobinsky1980`, and
`planck2018-vi`.

## Verification

- Strong invariant: inflation ends at epsilon = 1; n_s is within 1%
  of 0.965 at N ~ 57 and near scale invariant; the single-field
  consistency relation r = -8 n_t holds exactly.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
