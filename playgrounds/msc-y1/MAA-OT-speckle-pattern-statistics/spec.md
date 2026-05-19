---
title: Atmospheric Speckle Statistics
slug: speckle-pattern-statistics
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-OT
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: born-wolf
primary_chapter: 10
hook: 'A bright star through a big telescope on a turbulent night does not make a clean dot; it boils into a swarm of bright grains called speckles, each briefly as sharp as the telescope can do.'
one_paragraph: 'Atmospheric turbulence corrugates the incoming wavefront on the scale of the Fried parameter r_0, so the pupil acts like roughly N ~ (D/r_0)^2 independent sub-apertures whose randomly phased contributions interfere in the focal plane. The instantaneous image is fully developed speckle: the intensity follows a negative-exponential law P(I) = (1/<I>) exp(-I/<I>), and each speckle grain is about the diffraction size lambda/D, so the sharp information is present but scrambled and washed out by long exposures. The playground generates speckle patterns from a random phase screen and shows the exponential intensity statistics and grain count, the basis of speckle and lucky imaging. Reference: Born and Wolf, Principles of Optics, Chapter 10; Goodman, Speckle Phenomena in Optics.'
tags: [optics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Atmospheric speckle statistics
$N \sim (D/r_0)^2$ speckles per realization. Source: Roddier (`hardy-ao`); Goodman (`goodman-speckle`).

## Explainer

### What you are looking at

Look at a bright star through a big telescope on a turbulent night
and it is not a clean dot: it boils into a swarm of bright grains
called speckles. Each grain is briefly as sharp as the telescope can
do; the blur is only because they dance and average out. The
playground generates speckle patterns and shows their statistics, the
basis of speckle and lucky imaging.

### Why speckles form

The atmosphere imprints a random phase screen on the incoming flat
wavefront. The telescope's image is the Fourier transform of that
corrugated aperture field, so it is a random interference pattern.
The coherence length of the turbulence is the Fried parameter $r_0$;
the aperture of diameter $D$ contains roughly

$$N \;\sim\; \left(\frac{D}{r_0}\right)^2$$

independent patches, and each patch contributes one speckle. So a
large telescope in poor seeing shows hundreds of speckles, each about
$\lambda/D$ wide (the diffraction limit) scattered over a blob of
size $\lambda/r_0$ (the seeing disk).

### Speckle statistics

Because the field is a sum of many random phasors, it is a circular
complex Gaussian, and its intensity follows the negative-exponential
law (fully developed speckle):

$$p(I) = \frac{1}{\langle I\rangle}\,
  e^{-I/\langle I\rangle},
  \qquad
  \frac{\sigma_I}{\langle I\rangle} = 1.$$

The contrast is unity: the standard deviation equals the mean, so
there are always some very bright speckles. That heavy tail is
exactly what "lucky imaging" exploits: occasionally one speckle
captures most of the light at near the diffraction limit, and
selecting those rare frames beats the long-exposure blur. Averaging
$M$ independent patterns reduces the contrast as $1/\sqrt M$ toward
the smooth seeing disk. The playground sweeps $D/r_0$ and the number
of averaged frames and shows the speckle count and the exponential
intensity histogram.

### Things to try

- Increase $D/r_0$ and watch the number of speckles grow as
  $(D/r_0)^2$.
- Confirm the single-frame intensity histogram is a falling
  exponential with contrast 1 (a few very bright speckles).
- Average many frames and watch the pattern smooth into the seeing
  disk with contrast falling as $1/\sqrt M$.

### Where this comes from

Fully developed speckle statistics and the $(D/r_0)^2$ speckle count
follow Goodman, *Speckle Phenomena in Optics*, and Roddier,
*Adaptive Optics in Astronomy*, Chapter 2.
