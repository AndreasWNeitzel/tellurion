---
title: Single, Double, and Multi-Slit Diffraction
slug: single-double-multi-slit
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2016
supporting_ucs: [FIS3019]
curriculum_year: bsc-y2s1
hook: 'One slit gives a broad smear, two give fringes inside it, and N slits sharpen those fringes into the bright lines of a diffraction grating.'
one_paragraph: 'The far-field intensity of N identical slits factorizes into two pieces: the single-slit diffraction envelope (sin beta / beta)^2 set by the slit width, times the multi-slit interference term (sin N alpha / sin alpha)^2 set by the slit spacing and number. The playground plots the pattern as you change slit width, separation, and N: one slit is the pure envelope, two slits add cosine fringes, and raising N narrows the principal maxima toward grating-sharp lines while the envelope stays put. It cleanly separates the two physical scales every diffraction pattern combines. Reference: Hecht, Optics, Ch. 10.'
tags: [waves, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Single, double, and multi-slit diffraction

## Explainer

### What you are looking at

Light through slits does not make slit-shaped bright bands; it makes a
pattern of fringes whose spacing and sharpness depend on the slit
width, their spacing, and how many there are. The playground sweeps
from one slit to two to many and shows how the pattern is the product
of two effects.

### Two factors: interference times diffraction

For $N$ identical slits of width $a$ and centre-to-centre spacing $d$,
illuminated at wavelength $\lambda$, the far-field intensity is the
product of a single-slit diffraction envelope and an $N$-slit
interference grating term:

$$I(\theta) = I_0\,
  \underbrace{\left[\frac{\sin\beta}{\beta}\right]^2}
  _{\text{single-slit envelope}}\;
  \underbrace{\left[\frac{\sin(N\gamma)}{\sin\gamma}\right]^2}
  _{N\text{-slit interference}},$$

with $\beta = \dfrac{\pi a}{\lambda}\sin\theta$ and
$\gamma = \dfrac{\pi d}{\lambda}\sin\theta$.

### Reading the pattern

Each piece has a clear job:

- The diffraction envelope (slit width $a$) sets the overall
  brightness falloff; its first zero is at $\sin\theta = \lambda/a$.
  Narrower slits spread the envelope wider.
- The interference term (spacing $d$, count $N$) puts bright maxima
  where $d\sin\theta = m\lambda$. Two slits give broad cosine
  fringes; increasing $N$ sharpens them into narrow lines with
  $N-2$ faint secondary maxima between, the diffraction grating that
  makes high-resolution spectroscopy possible.
- Some interference maxima can land on an envelope zero and vanish
  (missing orders), occurring when $d/a$ is an integer.

So one slit is pure diffraction, two slits is Young's experiment, and
many slits is a grating; they are all the same formula with $N$
changed. The playground sweeps $N$, $a$, $d$ and $\lambda$ and shows
the envelope, the fringes, and missing orders.

### Things to try

- Start with $N=1$ (pure diffraction envelope), go to $N=2$ (Young
  fringes), then large $N$ (sharp grating lines).
- Narrow the slit width $a$ and watch the diffraction envelope widen.
- Set $d=2a$ and find the missing orders where a grating line sits on
  an envelope zero.

### Where this comes from

The single-slit diffraction envelope, the $N$-slit grating factor,
and missing orders follow Hecht, *Optics*, Chapter 10, and Born and
Wolf, *Principles of Optics*, Chapter 8.

## Physical setup

N identical slits of width a and center-to-center separation d,
illuminated by collimated coherent light of wavelength lambda at normal
incidence. Far-field intensity at angle theta:

  I(theta) = I_0 * (sin(beta) / beta)^2 * (sin(N alpha) / sin(alpha))^2

with beta = pi a sin(theta) / lambda, alpha = pi d sin(theta) / lambda.

Defaults: lambda = 0.5 (um), a = 1.0 (um), d / a slider sets d.

## Numerical method

None. Closed-form evaluation.

## Controls

- N slits: 1 to 10.
- d / a: ratio, 2 to 10.
- speed: auto-sweep over N.
- Reset / Pause / Play.

## Expected qualitative features

1. N = 1: pure sinc^2 envelope.
2. N = 2: cos^2(alpha) modulation under the envelope.
3. N >= 3: principal maxima at d sin(theta) = m lambda, with N - 2
   secondary maxima between them.
4. Principal-max peak intensity grows as N^2; width shrinks as 1 / N.
5. Envelope zeros suppress principal orders at sin(theta) = m lambda / a.

## Invariants and acceptance thresholds

1. I >= 0 everywhere.
2. I(theta = 0, N) = N^2 (relative to single-slit unit).
3. N = 1 matches sinc^2 envelope exactly.
4. Principal maxima at sin(theta) = m lambda / d.
5. Envelope zeros yield I = 0 for N = 1.
6. N = 8 brighter than N = 2 at first principal maximum.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- N = 1: single-slit only.
- N >> 1: nearly delta-function principal maxima (grating).

## Visual fallback

Canvas2D only. Top: I(theta) curve with single-slit envelope (orange)
and full N-slit pattern (cyan). Bottom: brightness strip rendering of
intensity.

## Citations

- Hecht, Optics 5e Ch. 10.

## Stretch goals

- Off-axis illumination, blazed gratings.
- Diffraction-limited spot from a circular aperture (separate Airy demo).
- Two-photon interference / Hanbury Brown-Twiss.

## Risk register

- For d / a < 2 the envelope zero coincides with a principal max,
  suppressing low orders; not displayed clearly. Slider lower bound is 2.
