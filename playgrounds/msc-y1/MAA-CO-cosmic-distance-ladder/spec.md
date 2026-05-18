---
title: "Cosmic Distance Ladder Journey"
slug: cosmic-distance-ladder
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-CO
supporting_ucs: []
curriculum_year: msc-y1
hook: 'Four rungs of the cosmic distance ladder, with their working ranges and accumulated error.'
one_paragraph: 'Click through parallax (1/p), Cepheid period-luminosity, Type Ia standard candle, and Hubble flow d = cz/H_0. Each rung shows distance range and error; the cumulative error bar grows as you climb.'
tags: [galactic, animation, multi-panel, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [rung]
---

# Cosmic Distance Ladder Journey

Click through four rungs of the distance ladder. Parallax: a nearby star swings against background, baseline 2 AU. Cepheid period-luminosity: a pulsating star with period 30 d, M_V from the Leavitt law. Type Ia: standard candle M_V = -19.3. Hubble flow: galaxy at z = 0.5, distance from D = cz/H_0.

## Explainer

### What you are looking at

We cannot put a tape measure on a galaxy. Every cosmic distance is
measured by a chain of methods, each calibrated by the one below it,
called the distance ladder. The playground walks the four classic
rungs in order and shows how each one hands its calibration up to the
next.

### Rung 1: parallax (geometry)

As Earth orbits, a nearby star appears to shift against the far
background. The half-angle of that shift over a 1 AU baseline gives
the distance directly, with no assumptions:

$$d\,[\text{pc}] = \frac{1}{p\,[\text{arcsec}]}.$$

This is the only purely geometric rung; it anchors everything above
it.

### Rung 2: Cepheid period-luminosity (Leavitt law)

Cepheid variable stars pulsate, and their pulsation period is tightly
tied to their true luminosity (Henrietta Leavitt's discovery):

$$M_V = a\,\log_{10} P + b.$$

Measure the period (easy, just time the brightness), read off the
absolute magnitude $M_V$, compare to the apparent magnitude $m$, and
the distance modulus gives the distance:

$$m - M = 5\log_{10} d_\text{pc} - 5.$$

Parallax-measured Cepheids calibrate $a,b$; Cepheids then reach
nearby galaxies.

### Rung 3: Type Ia supernovae (standard candle)

A white dwarf detonating near the Chandrasekhar mass always reaches
nearly the same peak luminosity, $M_V \approx -19.3$. The same
distance-modulus equation then reaches across hundreds of Mpc.
Cepheids in galaxies that also hosted a Type Ia calibrate this rung.

### Rung 4: Hubble flow (cosmological)

Far enough out, recession velocity is proportional to distance:

$$v = c\,z = H_0\,d
  \;\Longrightarrow\;
  d = \frac{cz}{H_0}.$$

Supernova distances calibrate $H_0$; beyond that, redshift alone
gives distance. The whole point is that an error or recalibration on
any low rung propagates up every rung above it, which is exactly why
the present tension in the measured $H_0$ is taken so seriously. The
playground steps through all four and shows each rung's calibration
feeding the next.

### Things to try

- Walk the rungs in order and watch each one's calibration come from
  the rung below.
- Change the Cepheid period and watch the inferred luminosity and
  distance move along the Leavitt law.
- Note the redshift-distance line: at low $z$ it is straight
  ($d = cz/H_0$), the Hubble law.

### Where this comes from

The four-rung distance ladder, the Leavitt law, and the
standard-candle method follow Ryden, *Introduction to Cosmology*, and
Freedman and Madore, ARA&A 48, 673 (2010).

## Physical setup

* Parallax: d (pc) = 1 / p (arcsec)
* Cepheid P-L: M_V = -2.78 log P - 1.35
* Type Ia: M_V = -19.3
* Hubble: d = c z / H_0 with H_0 = 70 km/s/Mpc

## Citations

Freedman and Madore 2010, ARA and A 48, 673.
