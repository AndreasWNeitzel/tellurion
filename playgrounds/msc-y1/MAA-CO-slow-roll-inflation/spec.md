---
title: "Slow-Roll Inflation: Ball on the Potential"
slug: slow-roll-inflation
status: implemented
audience: portfolio
created: 2026-05-15
primary_uc: MAA-CO
supporting_ucs: []
curriculum_year: msc-y1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [galactic, animation, live-readout]
difficulty: 4
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [model]
---

# Slow-Roll Inflation: Ball on the Potential

A golden ball rolls down an inflaton potential V(phi) under Hubble friction. Slow-roll parameters epsilon(phi) and eta(phi) computed live; n_s and r plotted on a Planck-style n_s-r plane.

## Physical setup

* Inflaton EOM: phi_dd + 3 H phi_d + V_phi = 0 with H^2 = V / (3 M_Pl^2).
* Slow-roll: epsilon = (M_Pl V_phi / V)^2 / 2, eta = M_Pl^2 V_phi_phi / V.
* Observables: n_s = 1 - 6 epsilon + 2 eta, r = 16 epsilon.

## Models

* V = 1/2 m^2 phi^2 (chaotic quadratic)
* V = lambda phi^4 / 4
* V = V_0 (1 - exp(-sqrt(2/3) phi / M_Pl))^2 (Starobinsky-like)
