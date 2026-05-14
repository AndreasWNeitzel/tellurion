---
title: Wave Heightfield (Clickable Hero)
slug: wave-heightfield-clickable-3d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2016
supporting_ucs: [FIS1013]
curriculum_year: hero
primary_citation: french-waves
primary_chapter: 6
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [waves, click-seed, animation, live-readout, interactive-drag]
difficulty: 3
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 6
share_state_keys: [c, gamma, A, sigma]
---
# Wave heightfield, clickable hero
2D wave equation $\partial_t^2 u = c^2 \nabla^2 u - \gamma \partial_t u$ on a 96x96 grid with Dirichlet boundaries. Click seeds Gaussian impulses. Source: French Waves Ch. 6 (`french-waves`).

## Visual standard instantiation

Currently rendered in Canvas2D using a viridis colormap on the height field; the full WebGL2 path (Blinn-Phong shaded 3D heightfield surface, ACES tonemap, three-point lighting, bloom, vignette, blue-noise dither) is queued as a follow-up. The CPU mirror at `shared/js/engine/wave-2d-cpu.js` is the canonical reference.

## Stack exemption

Marked `hero_candidate: true` but `renderer: webgl2` for now. The Phase 9 hero spec defaults to WebGL2; this entry is a "fast first hero" while the WebGL2 shaders are still being authored.
