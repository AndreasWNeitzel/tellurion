---
title: "Cosmic-Ray Air Shower"
slug: cosmic-ray-air-shower
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: FIS3030
supporting_ucs: []
curriculum_year: bsc-y3s2
hook: 'A primary cosmic ray hits the atmosphere; a cascade of secondaries fans down to the ground detector array.'
one_paragraph: 'Heitler model: each radiation length the energy halves and the particle count doubles, until E < E_c. Visible Xmax marker at log_2(E/E_c) splitting steps; iron primaries have shallower Xmax than protons at the same energy.'
tags: [nuclear-particle, animation, interactive-drag, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: []
---

# Cosmic-Ray Air Shower

Atmosphere is drawn as a gradient from dark space to ground. A primary cosmic ray streaks in from the top; the shower front then propagates downward and the Heitler cascade fans out into a bright-cored cone, colour-coded by particle energy (white at high energy near shower maximum, gold mid-cascade, blue once below the critical energy). The descending front is highlighted so the eye tracks the shower maximum, and the ground detector array lights up in proportion to the local energy deposit once the cascade arrives. The event loops: a new primary arrives each cycle.

## Explainer

### What you are looking at

A single high-energy cosmic ray hits the top of the atmosphere and
explodes into a cascade of billions of particles raining down over
kilometers. Ground arrays detect the footprint and work backward to the
original particle's energy. The playground runs the toy Heitler model
that captures the essential scaling.

### The Heitler cascade

The electromagnetic part doubles its particle count every radiation
length $X_0 \approx 37$ g/cm$^2$ of air: a photon pair-produces
$e^+e^-$, each electron radiates a photon (bremsstrahlung), and so on,
each step splitting the energy. After depth $X$ (in radiation lengths)
there are $\sim 2^{X/X_0}$ particles, each carrying $E/2^{X/X_0}$.

### Shower maximum

The multiplication stops when particles fall below the critical energy
$E_c \approx 81$ MeV (ionization losses overtake radiation). That sets
the depth of shower maximum and the peak particle number:

$$X_\max = X_0\,\ln\!\frac{E}{E_c},
  \qquad
  N_\max = \frac{E}{E_c}.$$

Two clean, testable scalings: $N_\max$ is *proportional* to the primary
energy $E$ (so counting particles measures $E$), and $X_\max$ grows
only *logarithmically* with $E$ (so the depth of maximum measures
$\ln E$ and helps identify the primary type). A hadronic primary
(proton, nucleus) also feeds pions: neutral pions decay to photons and
join the electromagnetic cascade, charged pions reinteract, giving a
muon component that reaches the ground. The playground animates the
descending front, the energy-coded cone, and the ground array
response.

### Things to try

- Raise the primary energy and watch $N_\max$ scale up linearly while
  $X_\max$ creeps down only logarithmically.
- Track the bright core descending to shower maximum, then dimming as
  particles drop below $E_c$.
- Note the ground array lights up in a footprint whose size and total
  signal encode the primary energy.

### Where this comes from

The Heitler branching cascade, the critical energy, and the
$X_\max = X_0\ln(E/E_c)$, $N_\max = E/E_c$ scalings follow Heitler,
*The Quantum Theory of Radiation* (Oxford, 1954), and Gaisser,
*Cosmic Rays and Particle Physics*.

## Physical setup

Heitler electromagnetic cascade: photon $\to e^+ e^-$, electron $\to$ photon + electron, each step halving energy every $X_0 = 36.7$ g cm$^{-2}$ of air. Shower max at $X_\max = X_0 \log(E/E_c)$ with $E_c = 81$ MeV, $N_\max = E/E_c$. Hadronic component: pion production with $1/3$ to gammas, $2/3$ reinteract. Ground arrival time $t = R/c$.

## Controls

- Primary energy slider, $\log_{10}(E/\mathrm{GeV})$ from 6 to 11 ($10^{15}$ to $10^{20}$ eV)
- Zenith-angle slider (0 to 60 deg); tilts the shower axis with depth
- Steps slider (radiation lengths simulated, 5 to 36)

The shower develops automatically and loops; changing any slider restarts the event with a fresh primary.

## Invariants

- Proton at $10^{17}$ eV: $X_\max \approx 814$ g cm$^{-2}$ within 10%.
- $N_\max$ scales linearly with $E$ within factor 2 (after rendering subsample).
- Iron $X_\max$ shallower than proton by 80 to 100 g cm$^{-2}$ at the same $E$.

## Status note

Animated cascade implemented: primary entry, downward-propagating shower
front, energy-coloured cone, and ground-array response. The Heitler tree,
$X_0$, $E_c$, and the $X_\max$ formula are the physics of record; the
transverse layout is a presentation-only cone (the toy model carries no
real transverse momentum) with a core-peaked, sqrt(depth) profile.

## Citations

Heitler, "The Quantum Theory of Radiation", Oxford 1954 (`heitler1954`).
