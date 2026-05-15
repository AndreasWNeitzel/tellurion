---
title: "Stellar Oscillation Modes"
slug: stellar-oscillation-modes
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-AS
supporting_ucs: []
curriculum_year: msc-y1
hook: 'A stellar surface oscillates in spherical harmonic modes; p-modes live above the Lamb frequency, g-modes below the Brunt-Vaisala.'
one_paragraph: 'Real Y_l^m(theta, phi) cos(omega t) drawn on the visible hemisphere with a diverging colormap; a propagation diagram shows N(r) and S_l(r) for a polytrope, with the mode frequency marked.'
tags: [stellar, quantum, animation, multi-panel, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [n, l, m]
---

# Stellar Oscillation Modes

A stellar disk breathes, rings, and ripples according to the chosen spherical-harmonic mode $Y_l^m(\theta, \phi) \cos(\omega t)$. Sliders for radial order $n$, degree $l$, azimuthal order $m$ morph the surface pattern. Side panel shows the propagation diagram (Brunt-Vaisala and Lamb frequencies vs radius for an $n = 3$ polytrope) with the current mode frequency marked. The p/g/mixed-mode label updates live.

## Physical setup

Surface displacement: $\xi(\theta, \phi, t) = Y_l^m(\theta, \phi) \cos(\omega_{n,l} t)$. Asymptotic p-mode frequency $\omega_{n,l} \approx \Delta\nu (n + l/2 + \varepsilon)$; asymptotic g-mode period spacing $\Pi_{n,l} \approx \Pi_0 / \sqrt{l(l+1)} \cdot n$. Brunt-Vaisala $N(r)$ and Lamb $S_l(r)$ from an $n = 3$ polytrope.

## Controls

- $n$ (0 to 5), $l$ (0 to 4), $m$ ($-l$ to $l$)
- Mode-type toggle: p vs g vs mixed

## Invariants

- $l = 0, n = 1$ frequency equals $\Delta\nu$ within 5%.
- Period spacing of consecutive g-modes constant within 1% in asymptotic regime.
- Mode energy integral normalized to 1.

## Status note

Scaffolded; $Y_l^m$ renderer + polytrope $N(r), S_l(r)$ profile not yet implemented.

## Citations

Aerts, Christensen-Dalsgaard, Kurtz, "Asteroseismology", Springer 2010 (`aerts2010`).
