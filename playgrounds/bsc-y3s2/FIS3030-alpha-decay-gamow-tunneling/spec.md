---
title: Alpha Decay via Gamow Tunneling
slug: alpha-decay-gamow-tunneling
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3030
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: krane-nuclear
primary_chapter: 8
hook: 'An alpha wavefunction tunnels the Coulomb barrier; the nucleus emits alphas at the Geiger-Nuttall rate.'
one_paragraph: 'Gamow alpha decay shown as the process itself. An alpha wavefunction oscillates in the nuclear well, decays exponentially across the classically forbidden Coulomb-barrier region (WKB suppression set by the Gamow exponent from sim.js), and leaks a small transmitted wave. A nuclear scene emits alpha particles at a cadence mapped from the Geiger-Nuttall half-life, so a high-Q nuclide visibly streams alphas with a narrow barrier while a low-Q one is nearly quiescent behind a wide barrier. A compact Geiger-Nuttall strip carries the log10 T vs Q^-1/2 line with the live (Z, Q) marker and the half-life read out. sim.js (geigerNuttallLogT, gamowExponent) is unchanged.'
tags: [nuclear-particle, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Alpha decay: Gamow tunneling

## Physical setup

A preformed alpha particle is bound in the nuclear well and must tunnel the Coulomb barrier $V(r) = 1.44 Z'/r$ (MeV, fm) to escape with energy $Q$. The semiclassical penetration factor gives $\log_{10} T_{1/2} = a + b\,Z/\sqrt{Q}$, the Geiger-Nuttall law (textbook $a = -46.83$, $b = 1.61$ with $Z$ the daughter charge and $Q$ in MeV). Source: Krane Nuclear Physics Ch. 8 (`krane-nuclear`).

## Numerical method

sim.js (unchanged) supplies `geigerNuttallLogT(Z, Q)` and the Gamow exponent. The wavefunction is a schematic: a standing wave in the well, a WKB-style exponential envelope across the forbidden region with total suppression $\exp(-G)$, and a small travelling transmitted wave. The emission cadence is $\propto 10^{\log_{10}T}$ compressed to a wide but finite visible band.

## Controls

- Daughter charge $Z$ (50 to 100) and decay energy $Q$ (1 to 12 MeV).
- Reset and Pause.

## Expected qualitative features

1. The forbidden tunneling region widens as $Q$ falls; the wavefunction inside is suppressed accordingly.
2. High-$Q$ (short-lived) nuclides stream alphas rapidly; low-$Q$ (long-lived) ones almost never emit.
3. The Geiger-Nuttall line is straight in $Q^{-1/2}$ with the live marker tracking the half-life.
