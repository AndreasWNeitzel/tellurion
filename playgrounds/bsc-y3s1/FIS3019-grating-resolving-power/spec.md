---
title: Grating Resolving Power
slug: grating-resolving-power
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3019
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: hecht2017
primary_chapter: 10
hook: 'Add more slits and the bright orders get razor-sharp; a grating''s power to split two close wavelengths is just the order times the slit count, R = mN.'
one_paragraph: 'A diffraction grating sends light into sharp principal maxima at d sin theta = m lambda. The playground shows the N-slit intensity pattern and what happens as you add slits: the principal maxima stay put but narrow dramatically, with faint subsidiary peaks between them. Two nearby wavelengths count as resolved when their maxima separate by more than that width, giving the resolving power R = lambda / Delta lambda = mN, the order times the number of illuminated slits. It is why a spectrograph grating needs many lines. Reference: Hecht, Optics, Ch. 10.'
tags: [optics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "Hecht, Optics, Fifth ed., Ch. 10."
---
# Diffraction grating resolving power
$N$-slit grating; principal maxima at $d \sin\theta = m\lambda$, resolving power $R = mN$. Source: Hecht Ch. 10.

## Explainer

### What you are looking at

A diffraction grating is many parallel slits. Light through it forms
sharp bright orders, and the more slits you illuminate, the sharper
those orders get. Sharper orders mean you can tell two nearly identical
wavelengths apart. The playground sweeps the slit count and you watch
broad fuzzy peaks tighten until two close spectral lines separate.

### Where the orders are

Constructive interference (a bright principal maximum) occurs when the
path difference between adjacent slits of spacing $d$ is a whole
wavelength:

$$d\sin\theta = m\lambda, \qquad m = 0, 1, 2, \dots$$

The order $m$ positions do not depend on the number of slits. The
*width* of each order does.

### The intensity pattern and resolving power

For $N$ slits the intensity is the grating function

$$I(\theta) = \left[\frac{\sin(N\phi)}{\sin\phi}\right]^2,
  \qquad \phi = \frac{\pi d\sin\theta}{\lambda},$$

a tall principal maximum of height $N^2$ flanked by $N-2$ tiny
subsidiary peaks. The principal maximum's angular width scales as
$1/N$: more slits, sharper line. Two wavelengths are just resolvable
(Rayleigh) when one's maximum sits on the other's first zero, which
gives the resolving power

$$R = \frac{\lambda}{\Delta\lambda} = m\,N.$$

So resolution is simply the order times the number of illuminated
lines. A spectrograph grating works in high order with thousands of
lines for exactly this reason. The playground sweeps $N$ from 2 (broad,
unresolved) to ~40 (razor peaks, the two test wavelengths split).

### Things to try

- Start at $N = 2$: broad cosine fringes, $R = 2$, the two
  wavelengths blurred together.
- Raise $N$ and watch the peaks narrow and the two colors separate, as
  $R = mN$ grows.
- Go to a higher order $m$ and note the resolution improves there too.

### Where this comes from

The grating condition, the $[\sin(N\phi)/\sin\phi]^2$ pattern, and the
$R = mN$ resolving power follow Hecht, *Optics*, 5th ed., Chapter 10.
