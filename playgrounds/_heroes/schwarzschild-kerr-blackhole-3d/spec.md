---
title: Schwarzschild-Kerr Black Hole 3D (Hero, Pending)
slug: schwarzschild-kerr-blackhole-3d
status: needs-implementation
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
estimated_engagement_minutes: 10
share_state_keys: [aOverM, M, inclination]
---
# Schwarzschild-Kerr black hole (3D hero, pending)

Kerr metric in Boyer-Lindquist with Carter constants $(E, L_z, Q)$. Backward null-geodesic ray-march from each pixel; capture at $r < r_{\rm horizon}$, disk intersection (Planck blackbody + Doppler beaming + gravitational redshift), or escape (starfield). Ergosphere boundary at $r_{\rm erg} = M + \sqrt{M^2 - a^2 \cos^2\theta}$ shaded above $a/M > 0.01$.

Invariant gates: $a/M = 0$ critical impact parameter $b_{\rm crit} = 3\sqrt 3 M$ to 0.1%; prograde ISCO at $a/M = 1$ equals 1 $M$; retrograde ISCO equals 9 $M$; weak-field deflection $4M/b$ to 1%.

## Stack exemption

WebGL2 mandatory: per-pixel ray-march in a fragment shader is the only viable rendering path. CPU mirror integrates a small set of geodesics on the host for invariant tests.

## Status

Scoped, not implemented.
