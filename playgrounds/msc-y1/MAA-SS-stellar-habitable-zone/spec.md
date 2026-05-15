---
title: "Stellar Habitable Zone"
slug: stellar-habitable-zone
status: implemented
audience: portfolio
created: 2026-05-15
primary_uc: MAA-SS
supporting_ucs: []
curriculum_year: msc-y1
hook: 'Move a planet between the inner and outer habitable-zone edges; the surface goes ice, ocean, or steam depending on equilibrium temperature.'
one_paragraph: 'T_eq from L_star, albedo, and orbital radius; HZ band traced for T in [200, 273] K. Drag the planet, change Teff or albedo, and watch the surface state.'
tags: [stellar, animation, multi-panel, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [Teff, a]
---

# Stellar Habitable Zone

Move a planet between the inner and outer edges of the conservative HZ for a given star (T_eff, L). The planet surface displays ice (frozen), blue-green (liquid water), or steam (runaway) based on its equilibrium temperature with a fixed albedo.

## Physical setup

* T_eq = T_star sqrt(R_star / 2 a) (1 - A)^0.25 with A = 0.3 albedo.
* HZ inner edge: ~ 273 K + greenhouse offset.
* HZ outer edge: ~ 200 K maximum greenhouse.
