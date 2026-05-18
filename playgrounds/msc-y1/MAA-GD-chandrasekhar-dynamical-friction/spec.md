---
title: "Chandrasekhar Dynamical Friction"
slug: chandrasekhar-dynamical-friction
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-GD
supporting_ucs: []
curriculum_year: msc-y1
hook: 'A massive body plows through a star field and drags a gravitational wake that slows it down.'
one_paragraph: 'A perturber moves through a Maxwellian background of test particles. Gravitational focusing builds an overdense wake behind it; the back-reaction is Chandrasekhar dynamical friction, a_fric proportional to rho ln(Lambda) f(X) with X = V / (sqrt 2 sigma). The perturber visibly decelerates.'
tags: [galactic, particle, animation, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [vPerturber]
---

# Chandrasekhar Dynamical Friction

A large perturber enters from the left through N=200 background particles
drawn from a Maxwellian of dispersion sigma. Gravitational focusing pulls
particles into an overdense wake trailing the perturber; the wake's pull
decelerates it. The perturber speed readout decreases over time.

## Explainer

### What you are looking at

A massive object plowing through a sea of stars does not coast
forever: its own gravity pulls the stars it passes into a dense wake
behind it, and that wake gravitationally tugs it back. This is
dynamical friction, the drag that sinks satellite galaxies and
globular clusters toward galactic centers. The playground shows the
perturber, the overdense wake it builds, and its speed bleeding away.

### Where the drag comes from

There is no collision and no medium, only gravity. As the heavy
perturber of mass $M$ moves at velocity $\mathbf V$ through a
background of stars, gravitational focusing deflects nearby stars so
they pile up just behind it. That trailing overdensity is a
gravitational tail pulling backward on the perturber, decelerating
it.

### Chandrasekhar's formula

Summing the two-body deflections over a Maxwellian background of
density $\rho$ and velocity dispersion $\sigma$ gives the
deceleration

$$\frac{d\mathbf V}{dt}
  = -\,\frac{4\pi G^2 M \rho\,\ln\Lambda}{V^3}\,
  \Big[\,\mathrm{erf}(X)
  - \frac{2X}{\sqrt\pi}\,e^{-X^2}\,\Big]\,\mathbf V,
  \qquad X = \frac{V}{\sqrt2\,\sigma}.$$

Three features matter:

- It scales with $M$: heavier objects sink faster (and the wake's
  pull is $\propto M$, so the acceleration is $\propto M$).
- The $\ln\Lambda$ is the Coulomb logarithm, summing the range of
  encounter distances that contribute.
- Only stars slower than the perturber (inside the velocity sphere)
  contribute, hence the $\mathrm{erf}(X)$ bracket: friction grows
  from zero, peaks near $X\sim1$, and falls off as $\propto V^{-2}$
  for a fast perturber. So a too-fast intruder feels little drag; one
  near the dispersion speed feels the most.

The playground builds the wake from $N$ background particles and
shows the speed readout decay, faster for a heavier perturber.

### Things to try

- Watch the overdense wake form directly behind the perturber and
  the speed readout fall.
- Increase the perturber mass and watch the drag (and wake density)
  grow, sinking it faster.
- Send the perturber in very fast and see the drag nearly vanish
  ($\propto V^{-2}$); slow it to $\sim\sigma$ for maximum friction.

### Where this comes from

The dynamical-friction deceleration and the $f(X)$ velocity factor
follow Chandrasekhar, ApJ 97, 255 (1943), and Binney and Tremaine,
*Galactic Dynamics*, 2nd ed., Chapter 8.

## Physical setup

Chandrasekhar (1943): a_fric = -4 pi G^2 M rho ln(Lambda) f(X) / V^2 with
f(X) = erf(X) - 2 X exp(-X^2) / sqrt(pi), X = V / (sqrt(2) sigma).
Test particles move in the perturber's Newtonian potential (Euler, dt=0.02).
Units G = M = 1, ln(Lambda) = 3, rho from particle count.

## Invariants

- At V = 3 sigma, f(X) > 0.9.
- At V = 0.1 sigma, f(X) < 0.05.

## Citations

Binney & Tremaine, Galactic Dynamics 2e, section 8.1 (`binney-tremaine`).
