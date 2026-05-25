---
title: Relativistic Doppler Effect
slug: relativistic-doppler
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3028
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: jackson1998
primary_chapter: 11
hook: 'Move toward a light source and it blueshifts; move away and it redshifts; move sideways and it still redshifts, a purely relativistic effect with no classical analogue.'
one_paragraph: 'The relativistic Doppler effect combines the classical frequency shift with time dilation. Head-on the observed frequency is f_obs/f_s = sqrt((1+beta)/(1-beta)), the maximum blueshift; directly receding it is the reciprocal, the maximum redshift; and at 90 degrees there is still a redshift by 1/gamma, the transverse Doppler effect, which is pure time dilation and has no classical counterpart. The playground sweeps the source speed and viewing angle and shows the shifted spectrum and relativistic beaming. It underlies relativistic-jet brightness and cosmological-redshift intuition. Reference: Griffiths, Introduction to Electrodynamics, Ch. 12.'
tags: [relativity, animation, live-readout]
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
  - "Jackson, Classical Electrodynamics, Third ed., Ch. 11."
---

# Relativistic Doppler effect

## Explainer

### What you are looking at

A moving light source shifts color, like sound pitch, but relativity
adds a twist no classical wave has: even a source moving exactly
sideways is redshifted, purely from time dilation. The playground
sweeps the source speed and viewing angle and shows the shifted
spectrum and the relativistic headlight beaming.

### The relativistic Doppler factor

For a source moving at $\beta = v/c$ seen at angle $\theta$ from its
velocity, the observed frequency is

$$\frac{f_\text{obs}}{f_s}
  = \frac{1}{\gamma\,(1 - \beta\cos\theta)},
  \qquad \gamma = (1-\beta^2)^{-1/2}.$$

The $1/(1-\beta\cos\theta)$ is the classical wavefront-bunching factor;
the extra $1/\gamma$ is time dilation, the relativistic piece.

### Three named cases

- Approaching head-on ($\theta=0$):
  $f_\text{obs}/f_s = \sqrt{(1+\beta)/(1-\beta)}$, the maximum
  blueshift.
- Receding ($\theta=\pi$): the reciprocal,
  $\sqrt{(1-\beta)/(1+\beta)}$, the maximum redshift.
- Transverse ($\theta=\pi/2$): $f_\text{obs}/f_s = 1/\gamma < 1$. A
  classical source moving sideways shows no shift; the relativistic
  one is *redshifted* purely by time dilation, the transverse Doppler
  effect, a direct experimental test of special relativity (Ives-
  Stilwell).

At high $\beta$ the same factor also beams the emission strongly
forward (relativistic headlight). The playground shows all three
regimes as you move the angle and speed.

### Things to try

- Sweep to head-on at high $\beta$ and watch the blueshift diverge as
  $\sqrt{(1+\beta)/(1-\beta)}$.
- Set $\theta=90^\circ$ and watch the pure $1/\gamma$ redshift appear
  (no classical analogue).
- Compare front vs back: the asymmetry is the basis of relativistic
  beaming in jets.

### Where this comes from

The relativistic Doppler factor and the longitudinal/transverse limits
follow Griffiths, *Introduction to Electrodynamics*, 5th ed.,
Chapter 12, and Rindler, *Relativity: Special, General, and
Cosmological*.

## Physical setup

A monochromatic source at rest in frame $K'$ emits frequency $f_s$ and moves at velocity $\beta c$ along the $+x$ axis relative to the observer in frame $K$. The observer sees the photon arriving at angle $\theta$ from the $+x$ axis. The relativistic Doppler factor is

$$\frac{f_\text{obs}}{f_s} = \frac{1}{\gamma (1 - \beta \cos\theta)}, \qquad \gamma = (1 - \beta^2)^{-1/2}.$$

Three named cases:

- Longitudinal approach ($\theta = 0$): $f_\text{obs}/f_s = \sqrt{(1+\beta)/(1-\beta)}$, the maximum blueshift.
- Longitudinal recession ($\theta = \pi$): $f_\text{obs}/f_s = \sqrt{(1-\beta)/(1+\beta)}$, the maximum redshift.
- Transverse ($\theta = \pi/2$): $f_\text{obs}/f_s = 1/\gamma$, pure SR effect.

## Numerical method

Closed-form. Cartesian plot uses 200 samples; polar plot uses 400.

## Controls

- $\beta = v/c$ slider from 0 to 0.99.
- $\theta$ in degrees from 0 to 180 for the marker.

## Expected qualitative features

1. The angular Doppler curve has a single maximum at $\theta = 0$ and a single minimum at $\theta = \pi$.
2. As $\beta \to 1$, the blueshift cone narrows toward the forward direction (relativistic beaming).
3. Transverse redshift: at $\theta = \pi/2$ the observer sees $f_\text{obs} = f_s/\gamma < f_s$, a pure relativistic effect.
4. Crossover from blueshift to redshift happens at $\cos\theta = (1 - 1/\gamma)/\beta$.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $\gamma(0) = 1$ | within $10^{-12}$ | invariants test |
| $\theta = 0$ longitudinal exact | within $10^{-12}$ | invariants test |
| $\theta = \pi$ longitudinal exact | within $10^{-12}$ | invariants test |
| $\theta = \pi/2$: $f = 1/\gamma$ | within $10^{-12}$ | invariants test |
| crossover at $\theta = \arccos\beta$ gives blueshift | strict | invariants test |
| transverse Doppler is a redshift | $< 1$ | invariants test |
| low-$\beta$: $f \approx 1 + \beta\cos\theta$ | within $10^{-6}$ | invariants test |
| $\beta = 0$ gives no shift at any angle | within $10^{-12}$ | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $\beta \to 0$: Doppler factor reduces to $1 + \beta\cos\theta$ (Newtonian).
- $\beta \to 1$: blueshift diverges along the forward direction; the polar curve becomes needle-like.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Jackson, *Classical Electrodynamics*, 3e, Ch. 11.
- Einstein 1907 / Ives-Stilwell 1938 experimental confirmation of transverse Doppler.

## Stretch goals

- Switch from frequency to wavelength axis for the spectroscopist's view.
- Add the cosmological redshift formula $1+z = a^{-1}$ for comparison.
- Three-source array showing receivers at different angles simultaneously.

## Risk register

- The Cartesian plot uses a log axis to keep the recession side visible; the log range adapts to the current $\beta$.
