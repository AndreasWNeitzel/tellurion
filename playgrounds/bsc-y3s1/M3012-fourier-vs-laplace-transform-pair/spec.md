---
title: Fourier vs Laplace Transform Pairs
slug: fourier-vs-laplace-transform-pair
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: M3012
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: arfken-weber
primary_chapter: 15
hook: 'Fourier asks which frequencies a signal contains; Laplace adds growth and decay, so a signal''s poles in the s-plane say whether it blows up or dies out.'
one_paragraph: 'The Fourier transform decomposes a signal into pure oscillations; the Laplace transform generalizes this with a complex frequency s = sigma + i omega that also captures exponential growth and decay, which is why it solves initial-value ODEs. The playground shows a time-domain signal next to its Fourier power spectrum and its Laplace transform as a pole map, so you see directly how a pole in the left half-plane means decay and one in the right half-plane means instability. It is the link between signal analysis and control theory. Reference: Arfken and Weber, Mathematical Methods for Physicists, Ch. 15.'
tags: [numerics, animation, live-readout]
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
---
# Fourier vs Laplace transforms
Side-by-side time-domain, $|F(\omega)|^2$ and $F(s)$ with pole map. Source: Arfken-Weber Ch. 15.

## Explainer

### What you are looking at

The same signal, viewed three ways: as a wiggle in time, as a Fourier
power spectrum (which frequencies it contains), and as a Laplace
transform drawn as a pole map. The pole map is the powerful one: the
location of a signal's poles instantly tells you whether it rings,
decays, or blows up.

### Fourier: pure frequencies

The Fourier transform decomposes a signal into steady sinusoids:

$$F(\omega) = \int_{-\infty}^{\infty} f(t)\,e^{-i\omega t}\,dt.$$

$|F(\omega)|^2$ is the power spectrum, how much of each frequency is
present. It is perfect for steady, bounded signals but cannot describe
something that grows.

### Laplace: complex frequency

The Laplace transform generalizes this with a complex frequency
$s = \sigma + i\omega$:

$$F(s) = \int_0^{\infty} f(t)\,e^{-st}\,dt.$$

The extra real part $\sigma$ measures growth or decay, so Laplace
handles transients and solves initial-value ODEs (differentiation
becomes multiplication by $s$). $F(s)$ is a ratio of polynomials whose
roots are poles and zeros.

### Reading the pole map

A pole at $s = \sigma + i\omega$ contributes a term
$\sim e^{\sigma t}\cos(\omega t)$ to the signal. So just by where the
poles sit:

- Left half-plane ($\sigma < 0$): decaying oscillation, stable.
- Imaginary axis ($\sigma = 0$): pure undamped oscillation.
- Right half-plane ($\sigma > 0$): exponentially growing, unstable.

The imaginary part sets the ringing frequency, the real part sets the
decay rate. The playground shows the time signal, its Fourier
spectrum, and its poles together, so you watch a pole crossing into
the right half-plane turn a decaying signal into a blow-up. This
pole-location test is the foundation of control theory and circuit
stability.

### Things to try

- Move a pole pair toward the imaginary axis and watch the time
  signal ring longer (less damping).
- Push a pole into the right half-plane and watch the signal diverge.
- Compare the Fourier peak position to the pole's imaginary part:
  they match.

### Where this comes from

The Fourier and Laplace transforms, the pole-zero representation, and
the stability interpretation follow Arfken and Weber, *Mathematical
Methods for Physicists*, Chapter 15.
