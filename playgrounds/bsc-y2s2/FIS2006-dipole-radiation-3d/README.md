# Dipole Radiation in 3D

This playground draws the radiation pattern of an oscillating dipole
as a rotating 3D surface: the radius in each direction is the
intensity, so the pattern is the famous sin^2(theta) donut, with a
sharp null along the dipole axis and a maximum in the equatorial
plane. The pulsing charges at the centre are the source and the faint
rings are outgoing wavefronts; the side panel is the polar slice of
the same pattern.

The numbers are the real electrodynamics. The Larmor power
`P = mu0 p0^2 omega^4 / (12 pi c)` climbs as the fourth power of the
frequency, which is why the sky is blue. Electric and magnetic
dipoles radiate the same pattern but with the E-field polarization
swapped from meridional to azimuthal, drawn here as the surface
texture; the half-wave antenna squeezes the lobes into a more
directional beam (directivity 1.64 against the dipole 1.50). Raising
the frequency packs more wavefronts; raising the moment widens the
charge oscillation and brightens the lobes.

The source selector switches dipole type and antenna; the frequency
slider sets omega and the wavelength; the moment slider sets the
dipole strength. Reset returns to a 100 MHz electric dipole and Pause
freezes the rotation.

## Reference

Primary citation: Jackson, *Classical Electrodynamics* (3rd ed.),
Ch. 9 (`jackson1998`).

## Verification

- Strong invariant: the Larmor total equals the angular integral
  within 0.2%, power scales as omega^4, the Poynting flux is equal
  through any sphere, and the far-zone E, B, r-hat triad is
  orthogonal with |E| = c|B|.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
