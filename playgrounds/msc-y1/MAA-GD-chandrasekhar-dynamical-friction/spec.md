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
