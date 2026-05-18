# Optical Lithography Resolution

How small a feature a projection scanner can print on a chip. A
reticle (photomask) is imaged through a lens of numerical aperture
`NA` at wavelength `lambda`. The lens pupil collects only spatial
frequencies `|f| <= NA/lambda`, so the aerial image is a low-pass
filtered version of the mask and the resolvable half-pitch is the
Rayleigh limit `R = k1 lambda / NA`. The physics is the gate-tested
closed-form `sim.js` (an exact DFT plus the Rayleigh formula).

What to look for: the reticle is a line/space pattern whose half-pitch
shrinks from 220 nm down to 18 nm left to right. In the aerial-image
strip the coarse zones print crisply and the zones finer than `R`
wash out to a flat grey, you can see the resolution limit directly.
The contrast bars below are blue while a zone is resolved and turn red
the moment its half-pitch drops below `R`, and the crossover sits
exactly at the Rayleigh limit. The single most instructive control is
the wavelength: step from i-line (365 nm) through DUV/ArF (193 nm) to
EUV (13.5 nm) and the resolvable pitch collapses, the whole reason the
industry moved to EUV. NA and `k1` shift the limit the same way.

Controls: the wavelength selector, the NA slider, the `k1` slider,
Reset and Pause. Copy URL shares the current state.

## Reference

Primary citations: Mack, *Fundamental Principles of Optical
Lithography*, Wiley 2007 (`mack2007`), for the lithography model,
`k1` and the wavelengths; Goodman, *Introduction to Fourier Optics*
(`goodman-fourier`), for the pupil-filtered imaging; Born and Wolf,
*Principles of Optics* (`born-wolf`), for the Rayleigh criterion.

## Verification

- Strong invariants (offline, `sim.js`): the cutoff `NA/lambda` and
  the Rayleigh `R = k1 lambda / NA` exactly (linear in `lambda`);
  the contrast-0.5 crossover within 5% of `lambda/(2 NA)`; a > 5x
  contrast collapse past cutoff; non-negative intensity; determinism.
- Visual gate: SSIM > 0.92 against committed golden frames of the
  deterministic ArF / NA = 1.0 sweep.
- Last verified: see `.verified`.
