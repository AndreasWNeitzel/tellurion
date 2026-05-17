# Rectangular Waveguide Modes

A hollow rectangular pipe does not carry just any wave: it supports a
discrete set of TE and TM modes, each with a cutoff frequency
`f_c = (c/2) sqrt((m/a)^2 + (n/b)^2)`. The top map is the transverse
field of the selected mode in the a-by-b cross-section, animated in
time; the strip below shows the wave actually travelling down the
guide. The side panel is the cutoff spectrum with the operating
frequency, so you can see exactly which modes a given frequency
allows.

The defining behaviour is cutoff. Above f_c the wave propagates at the
guide wavelength, which is always longer than in free space and
diverges as you approach the cutoff. Drop the frequency below f_c and
the wave stops propagating entirely: the strip shows only an
evanescent skin that decays into the pipe and carries no power. For a
guide wider than it is tall, TE10 has the lowest cutoff, which is why
real X-band guides like WR-90 are run between the TE10 and TE20
cutoffs for single-mode operation, visible directly in the spectrum
panel.

The mode selector chooses the TE/TM mode; the frequency slider sweeps
through the cutoffs; the broad-wall slider rescales the guide and
hence every cutoff. Reset returns to TE10 at 10 GHz in a WR-90 guide
and Pause freezes the animation.

## Reference

Primary citation: Jackson, *Classical Electrodynamics* (3rd ed.),
Ch. 8 (`jackson1998`).

## Verification

- Strong invariant: the cutoff matches the closed form within 0.1%;
  the mode propagates above f_c and is evanescent (positive decay)
  below; the guide wavelength exceeds free space and diverges at
  cutoff.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
