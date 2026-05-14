---
title: Schwarzschild-Kerr Black Hole 3D (Hero)
description: 'Per-pixel null-geodesic ray-march in the Schwarzschild metric. Black-hole shadow + photon ring at $b_c = 3\sqrt{3}M$, gravitationally lensed starfield, thin accretion disk at the ISCO with Planck-temperature color. Drag to orbit, scroll to zoom; the inclination slider controls camera latitude.'
caption: 'Figure 1. Schwarzschild null-geodesic ray-march. Source: Shapiro-Teukolsky Ch. 12 (`shapiro-teukolsky`).'
slug: schwarzschild-kerr-blackhole-3d
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: M3007
supporting_ucs: [AST3017]
curriculum_year: hero
primary_citation: shapiro-teukolsky
primary_chapter: 12
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [relativity, animation, live-readout]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 8
share_state_keys: [aOverM, incl]
---
# Schwarzschild-Kerr black hole (hero, Canvas2D MVP)
Schematic of event horizon + photon sphere + ergosphere + ISCO with disk emission (Planck blackbody mapped from $T(r) \propto r^{-3/4}$). Full per-pixel null geodesic ray-march in Kerr is queued for WebGL2. Source: Shapiro-Teukolsky Ch. 12 (`shapiro-teukolsky`).
