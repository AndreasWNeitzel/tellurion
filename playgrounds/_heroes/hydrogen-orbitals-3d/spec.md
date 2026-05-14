---
title: Hydrogen Orbitals 3D (Hero, Pending)
slug: hydrogen-orbitals-3d
status: needs-implementation
audience: portfolio
created: 2026-05-14
primary_uc: FIS3029
supporting_ucs: []
curriculum_year: hero
primary_citation: eisberg-resnick
primary_chapter: 5
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [quantum, atomic-molecular, multi-panel, log-scale]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 8
share_state_keys: [n, l, m, mode, threshold]
---
# Hydrogen orbitals (3D hero, pending implementation)

Analytic $|\psi_{n,l,m}|^2$ sampled on a 128^3 voxel grid; volume ray-marched or marching-cubes-isosurfaced with viridis density LUT or HSV phase coloring.

## Visual standard instantiation

Camera orbit + scroll zoom + idle drift. Volume mode: emission-only + ACES + bloom. Isosurface mode: Blinn-Phong three-point lit.

## Stack exemption

WebGL2 mandatory for the volume ray-marching path; CPU mirror is the analytic sampling on the same grid.

## Status

Pending full implementation. CPU sampling module exists conceptually (analytic $R_{n,l}$ Laguerre + $Y_{l,m}$ spherical harmonics) but no canvas/render path yet.
