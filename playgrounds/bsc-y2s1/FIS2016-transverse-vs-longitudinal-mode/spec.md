---
title: Transverse vs Longitudinal Modes on a 1D Chain
slug: transverse-vs-longitudinal-mode
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2016
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: crawford-waves
primary_chapter: 5
hook: 'Two waves with the identical dispersion can look completely different: one shakes the chain sideways, the other squeezes it along its length.'
one_paragraph: 'On a 1D chain of masses and springs the dispersion relation can be the same for two polarizations, yet the motion looks distinct: a transverse mode displaces the masses perpendicular to the chain, a longitudinal mode compresses and rarefies it along the chain. The playground animates both at the same wavenumber so you see that polarization is independent of the frequency-wavenumber relation. This is exactly the distinction between seismic S and P waves, and between light and sound. Reference: Crawford, Waves (Berkeley Physics Course), Ch. 5.'
tags: [waves, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Transverse vs longitudinal modes
Same dispersion, different polarization. Source: Crawford Ch. 5 (`crawford-waves`).

## Explainer

### What you are looking at

A wave on a chain of masses can wiggle in two completely different
ways: side to side across the direction it travels (transverse) or
back and forth along it (longitudinal). The playground runs both on
the same lattice so you see the polarization difference directly,
the distinction between a plucked string and a sound wave.

### One lattice, two polarizations

Take a 1D chain of masses on springs. A travelling wave has the form

$$u_n(t) = A\,\cos(k n a - \omega t),$$

and the same dispersion relation $\omega(k)=2\sqrt{\kappa/m}\,
|\sin(ka/2)|$ governs how fast it propagates, independent of
polarization. What differs is the direction of the displacement $u_n$
relative to the propagation direction:

- Transverse: each mass moves perpendicular to the chain (like a wave
  on a string, or light). It has two independent polarization
  directions in 3D.
- Longitudinal: each mass moves along the chain, so the wave is
  alternating compressions and rarefactions (like sound, or a
  pressure wave). Only one polarization is possible.

### Why the distinction matters

Polarization is a real physical degree of freedom, not a drawing
choice. Transverse waves can be polarized and that is exploited
everywhere from polaroid sunglasses to gravitational-wave detectors;
longitudinal waves cannot. In a solid both exist with different
speeds (shear vs pressure / S-waves vs P-waves in seismology, which
is how the Earth's liquid core was discovered: S-waves cannot cross
it). The playground shows the identical dispersion driving both while
the motion is across the chain for one and along it for the other,
plus the compression pattern of the longitudinal mode.

### Things to try

- Run the transverse mode and watch masses move across the chain
  (string-like); switch to longitudinal and watch compressions and
  rarefactions travel along it (sound-like).
- Confirm both share the same $\omega(k)$: the propagation speed does
  not depend on polarization, only the displacement direction does.
- Note the longitudinal density pattern (bunching) vs the transverse
  sinusoidal offset.

### Where this comes from

Wave polarization, the lattice dispersion relation and transverse vs
longitudinal modes follow Crawford, *Waves* (Berkeley Physics Course,
Vol. 3), Chapter 5, and French, *Vibrations and Waves*, Chapter 7.
