---
title: Hydrogen Orbitals 3D (Hero)
description: '$|\psi_{n\ell m}|^2$ volume-rendered with viridis density or HSV phase coloring; optional Blinn-Phong isosurface mode. Quantum numbers obey $\ell \lt n$ and $|m| \le \ell$ via slider clamping. Drag to orbit, scroll to zoom.'
caption: 'Figure 1. Volume rendering of hydrogen orbital density $|\psi_{n\ell m}|^2$. Source: Eisberg-Resnick Ch. 5 (`eisberg-resnick`).'
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
renderer: webgl2
estimated_engagement_minutes: 8
share_state_keys: [n, l, m, view]
---
# Hydrogen orbital density (3D hero)
WebGL2 volume ray-march of $|\psi_{n,\ell,m}|^2$ on a $40^3$ R16F 3D texture, with an isosurface mode that shades the level set via central-difference gradient normals and Blinn-Phong. Associated Laguerre and Legendre polynomials evaluated on the CPU mirror at `shared/js/engine/hydrogen-orbital-cpu.js`, then uploaded to the GL engine at `shared/js/engine-gl/hydrogen-orbital.js` whenever $(n, \ell, m)$ changes. The ray-march uses 96 steps with density-weighted alpha compositing; Canvas2D slice-through-$y=0$ remains as a fallback when `EXT_color_buffer_float` is unavailable.
