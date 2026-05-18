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

### The star and the sky

A real point source is smeared by the atmosphere and optics into a
point-spread function. A good model is the Moffat profile

$$I(r) = I_0\left[1 + \left(\frac{r}{\alpha}\right)^2\right]^{-\beta},$$

which has the broad wings real seeing produces (a Gaussian falls off
too fast). It sits on a roughly flat sky background plus shot noise.

### Aperture photometry

The measured flux is

$$F = \sum_{\text{aperture}} C_i \;-\; n_\text{ap}\,\bar b,$$

the total counts inside the aperture minus the per-pixel sky level
$\bar b$ (estimated robustly from a surrounding annulus that excludes
the star) times the number of aperture pixels. The headline trade-off:

- Aperture too small: you miss the Moffat wings, the flux is
  systematically low.
- Aperture too large: you capture all the star but also pile in sky
  shot noise, so the measurement gets noisier.

There is a sweet spot (roughly a couple of seeing radii) that maximizes
signal-to-noise. The playground shows the recovered flux converging to
truth as you widen the aperture, then the noise growing, exactly the
balance a real observer optimizes.

### Things to try

- Shrink the aperture and watch the measured flux fall below the true
  value (lost wings).
- Widen it and watch the flux reach truth but the scatter grow (sky
  noise).
- Move the sky annulus onto the star and watch the background
  over-subtract: the flux goes wrong.

### Where this comes from

The Moffat PSF, aperture-plus-annulus photometry, and the aperture
size signal-to-noise trade-off follow Howell, *Handbook of CCD
Astronomy*.
