# The Huygens Construction

This playground makes the Huygens-Fresnel principle physical: a
wavefront is replaced by N coherent secondary point sources, and their
circular wavelets superpose to rebuild the next wavefront and the
diffraction pattern. The primary scene is the 2D wavelet field (a
water-like diverging map) with the swept Huygens circles and the
reconstructed wavefront drawn in blue; the side panel compares the
N-source far field with the analytic uniform-aperture sinc envelope.

With the flat aperture, increasing N from 1 (a single circular
wavelet) to 100 builds a collimated beam that diffracts into the
single-slit lobes, the side panel tracking the sinc envelope with its
first zero at sin theta = lambda / a. Switch the wavefront to the
concave arc and the equal-phase wavelets converge to a bright focus
at the centre of curvature, the same physics that makes a lens work.
Widening the aperture or shortening the wavelength narrows the central
lobe.

The wavefront selector chooses flat or arc; the N slider sets the
number of secondary sources; the wavelength and aperture sliders set
the fringe scale and the diffraction angle. Reset returns to a flat
24-source aperture and Pause freezes the sweep. The readout reports
the shape, source count, wavelength, aperture, and time.

## Reference

Primary citation: Hecht, *Optics* (5th ed.), Sec. 10.1-10.2
(`hecht2017`).

## Verification

- Strong invariant: a uniform line aperture reproduces the Fraunhofer
  sinc envelope within 0.05, with the first zero at
  sin theta = lambda / a; a single wavelet is isotropic to 2%.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
