---
title: "Gravitational Microlensing Event"
slug: gravitational-microlensing-event
status: implemented
audience: portfolio
created: 2026-05-15
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [relativity, gr-relativity, animation, live-readout]
difficulty: 3
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: []
---

# Gravitational Microlensing Event

Top half is a 200-star procedural field; one star is the source (with a faint Einstein-radius ring), another is the lens moving across the field. As the lens approaches the source the user sees the two distorted images flanking it, an Einstein ring flash at zero impact parameter, and the characteristic Paczynski bump in the bottom-half light curve. A binary-lens toggle adds caustic-crossing spikes.

## Physical setup

Single-lens magnification $A(u) = (u^2 + 2)/(u\sqrt{u^2 + 4})$ with $u(t) = \sqrt{u_\min^2 + ((t-t_\mathrm{peak})/t_E)^2}$. Image positions $\theta_\pm = \tfrac{1}{2}(u \pm \sqrt{u^2 + 4}) \theta_E$. Binary lens: Chang-Refsdal in the $q \ll 1$ limit; full Newton iteration on the complex polynomial for general $q$.

## Controls

- $\theta_E$ slider, source/lens distance, lens transverse velocity
- Finite-source size toggle (point vs uniform disk)
- Binary-lens mass-ratio slider (adds the second component)

## Invariants

- For $u_\min = 0.3$ and $t_E = 30$ d, peak $A = 3.46$ within 1%.
- Single-lens light curve is symmetric about $t_\mathrm{peak}$ to machine precision.
- Binary-lens caustic ($\det J = 0$) closes within one period to within numerical tolerance.

## Status note

Scaffolded with single + binary lens physics; Newton solver for binary case + finite-source convolution not yet implemented.

## Citations

Paczynski 1986, ApJ 304, 1 (`paczynski1986`).
