---
title: "Stellar Habitable Zone"
slug: stellar-habitable-zone
status: implemented
audience: portfolio
created: 2026-05-15
primary_uc: MAA-SS
supporting_ucs: []
curriculum_year: msc-y1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
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
