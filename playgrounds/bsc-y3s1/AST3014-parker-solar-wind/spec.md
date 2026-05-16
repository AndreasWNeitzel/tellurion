---
title: Parker Solar Wind
slug: parker-solar-wind
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3014
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: shu-vol2
primary_chapter: 17
hook: 'Plasma streams off the Sun and accelerates through the sonic surface; the wind is the Parker transonic solution itself.'
one_paragraph: 'The Parker (1958) isothermal wind shown as the wind itself: parcels leave the Sun and stream radially with dr/dt = u(r) taken from the exact transonic solution, accelerating from subsonic near the surface, through the sonic surface r_c = GM/(2 c_s^2), to a supersonic asymptote. Parcels are coloured by Mach number, so the cool dense subsonic core, the sonic crossing, and the bright supersonic wind are all visible at once. A temperature slider sets c_s (hotter corona means a faster wind and a closer sonic surface); a compact u(r) strip keeps the quantitative curve with the sonic lines and the 1 AU speed read out live.'
tags: [fluids-mhd, stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Parker solar wind

## Physical setup

Parker (1958) isothermal solar wind. The velocity satisfies $(u^2/c_s^2 - 1)\,u^{-1}\,du/dr = (2/r)(1 - r_c/r)$ with sonic crossing at $r_c = GM/(2 c_s^2)$; the unique transonic branch passes through $u = c_s$ at $r = r_c$ and is supersonic beyond. Source: Shu Vol II Ch. 17 (`shu-vol2`); Frank-King-Raine Ch. 2 (`frank-king-raine`).

## Numerical method

Closed-form transonic root from sim.js (Newton on $\psi(u) = u^2/c_s^2 - \ln(u^2/c_s^2) - 4\ln(r/r_c) - 4 r_c/r + 3$), unchanged. Parcels are advanced by $dr/dt = u(r)$ with that solution; a logarithmic radial map keeps the subsonic-to-sonic region visible. Mach number $u/c_s$ drives a viridis colour scale.

## Controls

- Coronal temperature $T$ (0.5 to 3 MK), which sets $c_s = \sqrt{2 k T / m_p}$.
- Reset (re-seed the parcel field) and Pause.

## Expected qualitative features

1. A dense, slow, cool subsonic core inside $r_c$.
2. A clear Mach-1 crossing at the dashed sonic surface, then a fast supersonic radial wind that thins outward.
3. Hotter corona gives a higher $u(1\,\mathrm{AU})$ and a smaller $r_c$.
