# Fabry-Perot Etalon Spectrometer

A Fabry-Perot etalon is two mirrors facing each other. Light bounces
between them many times, and the partial transmissions interfere, so
the etalon only passes wavelengths whose round trip is a whole number
of waves. Sweeping the mirror spacing scans those resonances past a
fixed wavelength. This playground points the etalon at the sodium
doublet, the two yellow lines 0.6 nm apart that colour street lamps,
and asks the instrument question: can you tell them apart?

The band above the spectrum makes the mechanism physical: a
schematic of the two mirrors with the beam cascading between them
(the readout counts how many transmitted beams still carry more than
1.5 percent, which is the number of beams that actually interfere)
and the concentric ring fringe pattern an eyepiece would show.

What to look for: at low reflectance the Airy peaks are fat and the
two D lines blur into a single hump, only two or three beams bounce,
and the rings are broad and washed out. Push the reflectance slider
up. The number of interfering beams climbs, the rings tighten into
thin bright circles, the peaks narrow (the finesse in the readout
climbs), and at some point the single hump cleanly splits into two,
the doublet resolved. The resolved flag in the readout
flips exactly when the resolving power R_p crosses the required
lambda over delta-lambda. Make the etalon too thick and the free
spectral range shrinks below the line gap, the orders overlap, and no
amount of finesse helps: that is the other half of spectrometer
design.

Controls: reflectance R sets the finesse; spacing d sets the order
and the free spectral range; the line-gap slider lets you widen or
narrow the doublet to find the resolution threshold; Reset restores
the sodium defaults.

## Reference

Primary citation: Hecht, *Optics* (5th ed.), Ch. 9.6 (`hecht2017`);
Born and Wolf, *Principles of Optics* (7th ed.), Sec. 7.6
(`born-wolf`).

## Verification

- Strong invariant: the reflectance finesse is pi sqrt(R)/(1-R) (about
  312 at R = 0.99); Airy maxima are exactly 1 at delta = 2 m pi and
  minima 1/(1+F); R = 0 gives full transmission; the exact peak FWHM
  4 asin(1/sqrt F) matches a numeric measurement; and the sodium
  doublet resolves only when R_p exceeds lambda/dLambda with the FSR
  exceeding the separation.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
