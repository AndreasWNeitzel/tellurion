---
title: "Gravitational Lensing Caustics"
slug: gravitational-lensing-caustics
status: needs-attention
audience: portfolio
created: 2026-05-15
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [relativity, gr-relativity, interactive-drag, field-visualization]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: []
---

# Gravitational Lensing Caustics

Drag up to four point-mass lenses; caustic curves (in amber) and critical curves (in white) are drawn analytically. A source position marker in the source-plane creates 2, 3, or 4 multiply-lensed images that update in real time. A background dot grid shears according to the lens map.

## Physical setup

Deflection $\alpha = 4 G M / (c^2 \xi)$, in scaled units $\hat\alpha = \theta_E^2 / \theta$. Multi-lens: $\alpha = \sum_i \alpha_i$. Lens equation $\beta = \theta - \alpha(\theta)$. Critical curves: $\det(J(\theta)) = 0$ solved on a grid. Caustics: $\beta(\theta_\mathrm{crit})$.

## Controls

- Drag lens markers, add/remove lens
- Drag source marker
- Background-grid toggle, shear-field toggle

## Invariants

- Single point lens: critical curve is exactly $\theta_E$ within 0.1%.
- Image count: 2 outside caustic, 4 inside (single smooth lens + point source).
- Magnification near caustic crossing exceeds 100 within $0.01 \theta_E$.

## Status note

Scaffolded; multi-lens Jacobian root finder + image renderer not yet implemented.

## Citations

Schneider, Kochanek, Wambsganss, "Gravitational Lensing: Strong, Weak and Micro" (`schneider2006`).
