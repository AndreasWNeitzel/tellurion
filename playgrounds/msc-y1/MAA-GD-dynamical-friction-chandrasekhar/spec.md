---
title: Chandrasekhar Dynamical Friction
slug: dynamical-friction-chandrasekhar
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-GD
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: binney-tremaine
primary_chapter: 8
hook: 'A massive body plowing through a star field feels a gravitational drag from the wake it pulls behind it; sweep its speed and watch the friction rise, peak near the velocity dispersion, then fall.'
one_paragraph: 'Chandrasekhar summed the cumulative two-body gravitational deflections of a Maxwellian background (density rho, dispersion sigma) on a perturber of mass M moving at speed V, giving dV/dt = -(4 pi G^2 M rho ln Lambda / V^2) f(X) with f(X) = erf(X) - (2X/sqrt(pi)) e^(-X^2) and X = V/(sqrt(2) sigma); ln Lambda is the Coulomb logarithm over the range of impact parameters. The velocity dependence is the whole story: only background stars slower than the perturber contribute to the trailing overdensity, so the drag vanishes at low V (few stars left behind), peaks near V ~ sigma, and falls off as 1/V^2 at high speed. The playground sweeps V and plots the drag curve with its characteristic peak. Reference: Binney and Tremaine, Galactic Dynamics 2e, Chapter 8.'
tags: [galactic, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Chandrasekhar dynamical friction
Friction on a massive perturber in a Maxwellian background; peaks near $v \sim \sigma$. Source: Binney-Tremaine Ch. 8 (`binney-tremaine`).

## Explainer

### What you are looking at

A heavy body moving through a star field feels a gravitational drag
even though nothing physically touches it. The drag comes from the
wake of stars its own gravity gathers behind it. The playground
sweeps the perturber speed and shows the drag rise, peak, and fall,
the signature shape of dynamical friction.

### The friction force

Chandrasekhar summed the cumulative two-body gravitational
deflections of a Maxwellian background (density $\rho$, dispersion
$\sigma$) on a perturber of mass $M$ moving at speed $V$:

$$\frac{dV}{dt}
  = -\,\frac{4\pi G^2 M\rho\,\ln\Lambda}{V^2}\,f(X),
  \qquad
  f(X) = \mathrm{erf}(X) - \frac{2X}{\sqrt\pi}e^{-X^2},$$

with $X = V/(\sqrt2\,\sigma)$ the perturber speed in units of the
background dispersion and $\ln\Lambda$ the Coulomb logarithm
(integrating over the range of impact parameters).

### The velocity dependence is the whole story

The factor $f(X)$ counts the fraction of background stars moving
slower than the perturber, the only ones that build the trailing
wake:

- Slow perturber ($X\ll1$): few stars are slower, $f(X)\to0$,
  friction vanishes.
- $X\sim1$ ($V\sim\sigma$): the wake is strongest, the drag peaks.
- Fast perturber ($X\gg1$): $f(X)\to1$ but the explicit $1/V^2$
  wins, so the drag falls off.

So the friction is a peaked function of speed: maximal near the
background dispersion. Because $dV/dt\propto M$, massive satellites
sink quickly while light ones barely feel it, which is why globular
clusters and dwarf galaxies spiral into galactic centers over a Hubble
time. The playground plots $f(X)/V^2$ versus $V$ and marks the
$V\sim\sigma$ peak.

### Things to try

- Sweep $V$ from below $\sigma$ to well above and watch the drag
  rise to a peak near $V\sim\sigma$ then decline.
- Increase $M$ and watch the whole drag curve scale up linearly.
- Note the slow-perturber limit going to zero (no wake) and the
  fast limit decaying as $V^{-2}$.

### Where this comes from

The Chandrasekhar friction formula and its $f(X)$ velocity factor
follow Chandrasekhar, ApJ 97, 255 (1943), and Binney and Tremaine,
*Galactic Dynamics*, 2nd ed., Chapter 8.
