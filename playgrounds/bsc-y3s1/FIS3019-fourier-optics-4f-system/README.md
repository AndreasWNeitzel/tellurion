# The 4f Fourier-Optics Processor

A single lens does something remarkable: one focal length behind it,
the light distribution is the exact two-dimensional Fourier transform
of whatever was one focal length in front. The 4f processor chains
two such lenses with a filter mask in the shared focal plane between
them, so you can reach in and edit an image's spatial frequencies
directly. The three panels are the object, that Fourier plane (log
magnitude, with the mask drawn on it), and the resulting image.

What to look for: with no filter the second lens undoes the first and
the image is the object. Switch to low-pass and shrink the radius:
the fine detail of the grating washes out and eventually only a flat
patch remains, because you have blocked every diffraction order
except the central one. Switch to high-pass and the opposite happens,
the flat interior goes black and only the edges glow, which is the
Abbe-Porter experiment and the principle behind dark-field
microscopy. The vertical-slit filter keeps one row of orders and
rotates the fringes.

Controls: the object selector picks the input (grating, circular
aperture, double slit, checker); the filter selector picks none,
low-pass, high-pass, or a vertical slit; the radius slider sets the
mask size in the Fourier plane (it is hidden for the "none" filter,
where it would do nothing); Reset returns to the default low-pass
grating. The throughput and RMS readouts quantify how much
energy the filter passes and how far the image has moved from the
object.

## Reference

Primary citation: Goodman, *Introduction to Fourier Optics* (4th
ed.), Ch. 5-6 (`goodman-fourier`); Hecht, *Optics* (5th ed.), Ch. 13
(`hecht2017`).

## Verification

- Strong invariant: the FFT matches the direct DFT and round-trips
  to 1e-8, satisfies Parseval and Hermitian symmetry; with no filter
  the image equals the object pixelwise; a low-pass strictly reduces
  variance and total energy; a high-pass removes the DC component and
  maps a uniform object to zero.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
