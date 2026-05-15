---
title: "Cosmic-Ray Air Shower"
slug: cosmic-ray-air-shower
status: implemented
audience: portfolio
created: 2026-05-15
primary_uc: FIS3030
supporting_ucs: []
curriculum_year: bsc-y3s2
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [nuclear-particle, animation, interactive-drag, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: []
---

# Cosmic-Ray Air Shower

Atmosphere is drawn as vertical color bands from dark space to ground. Click the top of the canvas to fire a primary cosmic ray; the cascade fans down through the atmosphere with pions (red), kaons (orange), protons (white), and electromagnetic (blue). Shower maximum is visibly higher in the atmosphere for iron than for proton at the same energy. A detector array at the ground lights up in arrival order.

## Physical setup

Heitler electromagnetic cascade: photon $\to e^+ e^-$, electron $\to$ photon + electron, each step halving energy every $X_0 = 36.7$ g cm$^{-2}$ of air. Shower max at $X_\max = X_0 \log(E/E_c)$ with $E_c = 81$ MeV, $N_\max = E/E_c$. Hadronic component: pion production with $1/3$ to gammas, $2/3$ reinteract. Ground arrival time $t = R/c$.

## Controls

- Click top of canvas to fire primary; primary energy slider ($10^{15}$ to $10^{20}$ eV)
- Zenith-angle slider (0 to 60 deg)
- Species toggle: proton vs iron

## Invariants

- Proton at $10^{17}$ eV: $X_\max \approx 814$ g cm$^{-2}$ within 10%.
- $N_\max$ scales linearly with $E$ within factor 2 (after rendering subsample).
- Iron $X_\max$ shallower than proton by 80 to 100 g cm$^{-2}$ at the same $E$.

## Status note

Scaffolded; cascade tree + ground-array timing not yet implemented.

## Citations

Heitler, "The Quantum Theory of Radiation", Oxford 1954 (`heitler1954`).
