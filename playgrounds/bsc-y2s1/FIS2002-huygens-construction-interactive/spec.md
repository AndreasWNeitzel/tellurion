---
title: The Huygens Construction
slug: huygens-construction-interactive
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Replace a wavefront by a row of point sources and watch their wavelets rebuild it: flat aperture diffracts, a concave arc focuses.'
one_paragraph: 'The Huygens-Fresnel principle made physical: a wavefront is replaced by N secondary point sources, and their coherent superposition reconstructs the next wavefront and the diffraction pattern. The primary scene is the physical 2D wavelet field with the swept Huygens circles and the reconstructed wavefront; the side panel compares the N-source far field with the analytic uniform-aperture sinc envelope. A flat aperture gives single-slit diffraction with zeros at sin theta = m lambda / a; a concave arc of equal-phase wavelets converges to a focus. The headless sim.js is gate-tested for single-wavelet isotropy, the sinc envelope, the first-minimum angle, the coherent on-axis maximum, sinc symmetry, and arc focusing gain.'
tags: [waves, optics, diffraction, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2002
share_state_keys: []
---

# The Huygens Construction

## Explainer

### What you are looking at

Huygens' idea, from 1678: every point on a wavefront acts as a tiny
source of its own circular wavelet, and the next wavefront is just the
envelope of all those wavelets. The playground chops a wavefront into
many point sources, lets each radiate, and adds them up. Diffraction
through a slit and focusing by a curved front both fall out of this
single construction.

### The construction

Discretize the wavefront into $N$ coherent point sources. Each radiates
a circular wavelet; in 2D its contribution is

$$\frac{\cos(k r - \omega t)}{\sqrt r},$$

and the downstream field is the coherent sum over all sources. Where
the wavelets arrive in phase they reinforce; where they are out of
phase they cancel. That interference is the whole of wave optics.

### The slit: a sinc pattern

For a uniformly illuminated straight aperture of width $a$, summing the
wavelets gives the Fraunhofer far-field amplitude

$$E(\theta) \propto \operatorname{sinc}\!\left(
  \frac{\pi a \sin\theta}{\lambda}\right),$$

so the intensity is a $\operatorname{sinc}^2$ with dark fringes exactly
where

$$\sin\theta = \frac{m\lambda}{a}, \qquad m = 1, 2, \dots$$

A narrower slit (or longer wavelength) spreads the pattern wider: the
diffraction limit, derived from nothing but adding wavelets.

### Focusing a curved front

If instead the equal-phase sources lie on a concave arc of radius $R$,
their wavelets all arrive together at the centre of curvature: the
construction predicts a focus. The same rule that spreads light at a
slit concentrates it from a curved mirror or lens.

### Things to try

- Narrow the aperture and watch the central diffraction lobe widen,
  with zeros marching to larger angles per $\sin\theta = m\lambda/a$.
- Increase the source count $N$ and see the envelope converge to the
  smooth $\operatorname{sinc}^2$.
- Switch to the concave arc and watch the wavelets build a focal spot.

### Where this comes from

The Huygens-Fresnel construction, the single-slit
$\operatorname{sinc}^2$ pattern, and the curved-front focus follow
Hecht, *Optics*, 5th ed., Sections 10.1 to 10.2.

## Physical setup

A wavefront (a vertical aperture or a concave arc) is discretised into
N coherent secondary point sources. Each radiates a circular wavelet;
the superposition is the field downstream and the envelope is the
reconstructed wavefront.

## Governing equations

Each wavelet contributes `cos(k r - omega t) / sqrt(r)` (2D falloff).
The Fraunhofer amplitude of a uniform aperture of width `a` is the
sinc envelope

`E(theta) ~ sinc(pi a sin theta / lambda)`,

so the intensity is `sinc^2` with zeros at `sin theta = m lambda / a`.
A concave arc of equal-phase sources of radius `R` converges toward
its centre of curvature (a focus).

## Numerical method

Direct coherent superposition. The displayed field is evaluated on a
150x150 grid (sources decimated to at most 64 for the map) and
tanh-compressed with an auto-scaled knee so the pattern is visible for
any N, wavelength and aperture. The far-field amplitude is the exact
array sum `|sum exp(i k r_i . dir)| / N`. Reference: Hecht, *Optics*
(5th ed.), Sec. 10.1-10.2 (`hecht2017`).

## Controls

- wavefront: flat aperture or concave arc (focusing).
- N sources: 1 to 100 (one circular wavelet up to a smooth front).
- wavelength and aperture a: set the fringe scale and the
  diffraction angle.
- Reset, Pause.

## Expected qualitative features

- N = 1: a single isotropic circular wavelet.
- Flat aperture, large N: a collimated beam with single-slit
  diffraction lobes; the side panel matches the sinc envelope.
- Concave arc: the wavelets converge to a bright focus.
- Wider aperture or shorter wavelength narrows the central lobe.

## Invariants and acceptance thresholds

- Single wavelet isotropy: ring amplitude CoV `< 0.02`.
- Uniform line far field matches the sinc envelope within 0.05.
- First diffraction minimum at `sin theta = lambda / a` within 0.02
  rad, with amplitude `< 0.05` there.
- Normalised on-axis far field `= 1` for in-phase sources; the raw
  coherent sum scales with N.
- `sinc(0) = 1`, `sinc(pi) = 0`; the aperture pattern is even in
  theta.
- A concave arc gives `> 1.6x` the on-axis peak of a flat line
  (focusing gain).

## Limiting cases for verification

- N = 1: isotropic wavelet (no preferred direction).
- Continuous-aperture limit (large N): the array far field converges
  to the analytic sinc.

Source: Hecht, *Optics* (5th ed.), Sec. 10.1-10.2 (`hecht2017`).
