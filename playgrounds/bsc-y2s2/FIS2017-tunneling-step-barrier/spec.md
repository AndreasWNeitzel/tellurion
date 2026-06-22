---
title: Quantum Tunneling Through a Barrier
slug: tunneling-step-barrier
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS2017
curriculum_year: bsc-y2s2
primary_citation: griffiths-qm
primary_chapter: 2
hook: "Fire a quantum particle at a wall too tall to climb and a sliver comes out the far side. Below the barrier it tunnels; above it, the step is a partial mirror with resonances."
one_paragraph: "A wave of energy E on a rectangular barrier of height V0 and width L is partly reflected and partly transmitted. For E < V0 the wave decays exponentially across the barrier yet leaks through with transmission T = [1 + V0^2 sinh^2(kappa L)/(4E(V0-E))]^-1, falling fast as the barrier thickens or rises (the mechanism of alpha decay and the STM). For E > V0 the step is a partial mirror, perfectly transparent at resonances where k2 L = n pi. The playground animates the real part of the wave flowing through inside the static probability envelope, and plots T and R against energy with the tunneling tail, the resonance comb, and T + R = 1."
tags: [quantum, tunneling, barrier, transmission, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [E, V0, L]
invariants:
  - key: cons
    label: probability current is conserved, T + R = 1
    tolerance: 1e-9
  - key: tunnel
    label: tunneling transmission falls as the barrier thickens or rises
    tolerance: 0.0
  - key: resonance
    label: above the barrier, T = 1 at the resonances k2 L = n pi
    tolerance: 1e-6
what_to_try:
  - Below the barrier the wave decays across it and a small transmitted wave survives (tunneling).
  - Widen the barrier and the transmitted wave shrinks exponentially.
  - Raise the energy above the barrier; at the marked resonances the transmission reaches one.
references:
  - "Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.6 and Prob. 2.33."
  - "Cohen-Tannoudji, Quantum Mechanics, Vol. I, Ch. 1."
---

# Quantum tunneling through a barrier

## Physical setup

A particle of energy E meets a rectangular barrier, V = V0 for 0 < x < L and zero
outside. We seek the reflected and transmitted amplitudes.

## Equations

Outside, $k = \sqrt{2mE}/\hbar$; inside (for $E < V_0$),
$\kappa = \sqrt{2m(V_0-E)}/\hbar$. Matching the wave and its slope at both walls,

$$ T = \left[1 + \frac{V_0^2\sinh^2(\kappa L)}{4E(V_0-E)}\right]^{-1}, \qquad R = 1 - T, $$

and for $E > V_0$ the same with $\sinh \to \sin$, giving perfect transmission at
$k_2 L = n\pi$.

## Numerical method

T from the exact barrier formula. The displayed wavefunction is obtained by
integrating the Schrodinger equation (RK4) from the transmitted side and matching
to incident plus reflected in the field-free region; the integrated T reproduces
the closed form. No fabricated values.

## Controls

- Energy E, barrier height V0, barrier width L; Reset.

## Expected qualitative features

1. For E < V0 the wave decays across the barrier and emerges reduced (tunneling).
2. Transmission falls exponentially with barrier width and height.
3. For E > V0 the barrier is a partial mirror with perfect-transmission resonances.

## Invariants and acceptance thresholds

- $T + R = 1$.
- Tunneling transmission decreases with barrier width and height.
- $T = 1$ at the resonances $k_2 L = n\pi$.

## Citations

Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.6. Cohen-Tannoudji,
Quantum Mechanics, Vol. I, Ch. 1.
