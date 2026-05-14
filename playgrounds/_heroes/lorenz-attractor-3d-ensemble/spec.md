---
title: Lorenz Attractor Ensemble (Hero)
description: '$10^4$ Lorenz trajectories integrated RK4 in a fragment shader from a $10^{-3}$ ball around $(1,1,1)$; positions splatted into an HDR log-density accumulator with geometric decay, viridis-mapped, with one tracked lead particle drawing its recent path. Drag to orbit, scroll to zoom.'
caption: 'Figure 1. Ensemble density of $10^4$ Lorenz trajectories ($\sigma=10$, $\rho=28$, $\beta=8/3$). Source: Strogatz Nonlinear Dynamics Ch. 9 (`strogatz-nonlin`).'
slug: lorenz-attractor-3d-ensemble
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: hero
primary_citation: marion-thornton
primary_chapter: 11
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [mechanics, animation, live-readout]
difficulty: 4
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 5
share_state_keys: []
---
# Lorenz ensemble (hero)
$1024$ trajectories integrated in a fragment shader (RK4, $dt = 0.005$, $\sigma = 10$, $\beta = 8/3$, $\rho$ slider-controlled) starting from a $10^{-3}$ ball around $(1, 1, 1)$. Each frame the WebGL2 engine at `shared/js/engine-gl/lorenz-ensemble.js` advances every particle one RK4 step, then splats its image-space position into an HDR accumulator with geometric decay; the resulting density is viridis-mapped and tonemapped (ACES) with a vignette. Canvas2D fallback retains the same RK4 on the CPU for hardware without `EXT_color_buffer_float`.
