---
title: Hydrogen Orbitals 3D (Hero)
slug: hydrogen-orbitals-3d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3029
supporting_ucs: []
curriculum_year: hero
primary_citation: eisberg-resnick
primary_chapter: 5
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [quantum, atomic-molecular, animation, multi-panel, live-readout]
difficulty: 4
tier: single
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 8
share_state_keys: [n, l, m, view]
---
# Hydrogen orbital density (3D hero)
Canvas2D MVP of $|\psi_{n,\ell,m}|^2$ sliced through $y=0$ with rotation animation. CPU mirror at `shared/js/engine/hydrogen-orbital-cpu.js`. WebGL2 volume ray-march and isosurface modes still queued.
