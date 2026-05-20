---
title: Radial Velocity Curve from Orbital Elements
slug: radial-velocity-orbital-trace
status: superseded
superseded_by: radial-velocity-exoplanet-detection-3d
audience: portfolio
created: 2026-05-14
primary_uc: AST2004
supporting_ucs: [AST3015]
curriculum_year: bsc-y2s1
primary_citation: carroll-ostlie
primary_chapter: 7
hook: 'Watch a star wobble on its tiny orbit while the matching radial-velocity curve draws itself; that wobble is how most of the first exoplanets were found.'
one_paragraph: 'A planet and its star both orbit their common centre of mass, so the star traces a small ellipse and its line-of-sight velocity rises and falls each period. The playground shows the orbit and, beside it, the radial-velocity curve traced point by point as the star moves. Raise the eccentricity or turn the argument of periapsis and the curve shifts from a clean sinusoid to a skewed sawtooth; the amplitude carries the planet mass and the orbital geometry. This is the Doppler method that delivered the first hot Jupiters and still anchors exoplanet mass estimates. Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 7.'
tags: [stellar, exoplanets, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Radial velocity orbital trace
Orbit and corresponding RV curve, side by side. Source: Carroll-Ostlie Ch. 7 (`carroll-ostlie`).

## Explainer

### What you are looking at

We cannot see most exoplanets directly, but an orbiting planet makes
its star wobble, and that wobble shifts the star's spectral lines
periodically. The playground shows the orbit on the left and the
resulting line-of-sight velocity curve on the right, the signal that
discovered the first exoplanets.

### The wobble

Star and planet orbit their common centre of mass; the star traces a
small ellipse with speed set by momentum balance,
$M_\star v_\star = m_p v_p$. We observe only the component along the
line of sight, the radial velocity. For a Keplerian orbit it is

$$v_r(t) = K\big[\cos(\nu + \omega) + e\cos\omega\big] + \gamma,$$

with $\gamma$ the system's bulk velocity, $\nu(t)$ the true anomaly,
$\omega$ the argument of periapsis, and the semi-amplitude

$$K = \left(\frac{2\pi G}{P}\right)^{1/3}
  \frac{m_p\sin i}{(M_\star + m_p)^{2/3}}
  \frac{1}{\sqrt{1 - e^2}}.$$

### Reading the curve

The shape of the RV curve decodes the orbit:

- A circular orbit ($e=0$) gives a pure sinusoid; eccentricity
  skews and sharpens it, and $\omega$ rotates the asymmetry.
- The period $P$ is read straight off the curve; the amplitude $K$
  gives the planet mass, but only $m_p\sin i$ (the inclination is
  degenerate without a transit), so RV yields a minimum mass.
- A more massive or closer planet gives a larger $K$ (easier to
  detect); an Earth around a Sun is sub-m/s, which is why this method
  favours hot Jupiters.

This is the workhorse behind HARPS and ESPRESSO and the 51 Peg b
discovery. The playground links the moving star to the live RV trace
so you see exactly which part of the orbit makes which feature.

### Things to try

- Set $e=0$ and see a clean sine wave; raise $e$ and watch it skew.
- Rotate $\omega$ and watch the asymmetry of the curve swing around.
- Increase the planet mass or shrink the period and watch the
  amplitude $K$ grow.

### Where this comes from

The radial-velocity equation and the $m_p\sin i$ degeneracy follow
Carroll and Ostlie, *An Introduction to Modern Astrophysics*,
Chapter 7, and Perryman, *The Exoplanet Handbook*, Chapter 2.
