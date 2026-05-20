---
title: Aperture Photometry
slug: aperture-photometry-toy
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3015
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: howell-ccd
primary_chapter: 5
hook: 'To measure a star''s brightness you add up the light in a circle and subtract the sky from a ring around it; get the radii wrong and the number is wrong.'
one_paragraph: 'Aperture photometry is how you turn a star image into a number. The playground drops a synthetic Moffat point-spread function onto a noisy CCD frame, then sums the counts inside a circular aperture and estimates the background from a surrounding sky annulus to recover the true flux. You move the aperture and annulus radii and watch the measured flux converge to or miss the truth: a wider aperture catches more of the PSF wings but also more sky noise, the size trade-off every observer faces. Reference: Howell, Handbook of CCD Astronomy.'
tags: [exoplanets, numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Toy aperture photometry
Synthetic Moffat PSF on a CCD; aperture + sky annulus recovers true flux. Source: Howell CCD Handbook (`howell-ccd`).

## Explainer

### What you are looking at

A star on a CCD frame is a fuzzy blob sitting on a noisy sky. To turn
it into a brightness you draw a circle, add up the counts inside,
estimate the sky from a ring around it, and subtract. The playground
synthesizes a star, lets you size the aperture and annulus, and shows
the measured flux chase the true value, with the trade-off every
observer lives with.

### The point-spread function

A real point source is smeared by the atmosphere and the optics into
a *point-spread function* (PSF). The Moffat (1969) profile

$$\boxed{\;I(r) = I_0\,\left[1 + \left(\frac{r}{\alpha}\right)^2\right]^{-\beta}\;}$$

fits ground-based seeing well: it has the broad wings that real
seeing produces (a Gaussian falls off too fast and underestimates the
flux in the wings). The FWHM and the total flux of a Moffat are

$$\mathrm{FWHM} = 2 \alpha\,\sqrt{2^{1/\beta} - 1},\qquad
F_{\rm total} = \int_0^\infty I(r)\,2\pi r\,dr
              = \frac{\pi\,\alpha^2\,I_0}{\beta - 1}\quad (\beta > 1).$$

Typical ground-based seeing has $\beta \approx 3$ and FWHM 0.6 to
1.5 arcseconds. The PSF sits on a roughly flat sky background $b$
(per pixel) plus shot noise.

### Aperture photometry

The measured flux of the star is

$$\boxed{\;F = \sum_{i \in {\rm aperture}} C_i \;-\; n_{\rm ap}\,\bar b,\;}$$

where $C_i$ is the total counts in pixel $i$, the sum runs over the
$n_{\rm ap}$ pixels inside the aperture, and $\bar b$ is the per-
pixel sky level estimated from a surrounding annulus that excludes
the star. The signal-to-noise ratio in the shot-noise regime is

$$\frac{S}{N} = \frac{F_\star}{\sqrt{F_\star + n_{\rm ap}\,b + n_{\rm ap}\,b\,(n_{\rm ap}/n_{\rm sky})}},$$

where $n_{\rm sky}$ is the number of annulus pixels (its $n_{\rm ap}/n_{\rm sky}$
term comes from how the noise on the SKY estimate propagates back
into the per-aperture-pixel subtraction). The headline trade-off:

- *Aperture too small*: you miss the Moffat wings, so the recovered
  flux is systematically LOW.
- *Aperture too large*: you capture all the star but also pile in
  sky shot noise $\sqrt{n_{\rm ap} b}$, so the measurement gets
  NOISIER even though the bias is gone.

There is a sweet spot near $r_{\rm ap} \approx 1.5 \times \mathrm{FWHM}$
that maximises $S/N$ for typical seeing and sky brightness.

### Symbols, at a glance

- $r$, radial distance from the centroid of the star (pixels or
  arcseconds).
- $I(r)$, intensity profile of the star.
- $\alpha$, $\beta$, the Moffat parameters; $\alpha$ sets the core
  width, $\beta$ sets the wing decay.
- $C_i$, counts in pixel $i$ (ADU or electrons).
- $F$, recovered stellar flux; $F_\star$, the true flux.
- $b$, per-pixel sky brightness.
- $n_{\rm ap}$, $n_{\rm sky}$, number of pixels in the aperture and
  in the sky annulus.

### Things to try

- Shrink the aperture and watch the measured flux fall below the true
  value (lost wings).
- Widen it and watch the flux reach truth but the scatter grow (sky
  noise).
- Move the sky annulus onto the star and watch the background
  over-subtract: the flux goes wrong.

### Bibliographic origin

The Moffat profile: Moffat, *Astron. Astrophys.* **3** (1969) 455.
Aperture-and-annulus photometry as the standard technique: Stetson,
*Publ. Astron. Soc. Pacific* **99** (1987) 191 (DAOPHOT). The S/N
analysis is Howell, *Handbook of CCD Astronomy* (2nd ed., Cambridge
2006), Ch. 5; modern survey work uses the more sophisticated PSF
photometry of Stetson 1987 or Anderson and King, *Publ. Astron.
Soc. Pacific* **112** (2000) 1360 (HST-style effective-PSF fitting).
