---
title: The Franck-Hertz Experiment
slug: franck-hertz
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS2003
curriculum_year: bsc-y2s2
primary_citation: eisberg-resnick
primary_chapter: 4
hook: "Electrons in a vapour can only lose energy in one exact lump. The collector current dips every time the voltage climbs by that amount: atomic levels are quantized."
one_paragraph: "Electrons accelerated through a vapour gain energy from the field but can only lose it in the fixed lump E_exc, the atomic excitation energy. Once an electron reaches E_exc it can collide inelastically, excite an atom, and drop to nearly zero, too slow to clear a small retarder at the collector. So as the accelerating voltage rises the collector current climbs but dips at every multiple of E_exc/e, where electrons excite one, two, three atoms in turn, lighting luminous layers in the tube. The playground simulates the electron transport, shows the layers building as the voltage rises, and plots the current against voltage with dips whose spacing is the excitation energy, direct evidence of quantized atomic levels."
tags: [modern-physics, quantum, atomic-levels, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [V, E]
invariants:
  - key: spacing
    label: the current dips are spaced by the excitation energy E_exc/e
    tolerance: 0.0
  - key: layers
    label: the number of excitation layers is floor(V / E_exc)
    tolerance: 0.0
  - key: periodic
    label: the pass fraction is low just above each multiple and high mid-interval
    tolerance: 0.0
what_to_try:
  - Raise the voltage; each time it passes a multiple of E_exc/e a new luminous layer appears and the current dips.
  - Read the dip spacing off the curve; it is the excitation energy in volts.
  - Change E_exc; the layers and dips re-space to match.
references:
  - "Franck and Hertz 1914, Verh. Dtsch. Phys. Ges. 16, 457."
  - "Eisberg and Resnick, Quantum Physics, 2nd ed., Sec. 4.6."
---

# The Franck-Hertz experiment

## Physical setup

Electrons from a cathode accelerate through a vapour-filled tube and are collected
past a small retarding voltage; the accelerating voltage is swept.

## Equations

An electron that has fallen through V volts carries V eV of kinetic energy. When
that reaches the excitation energy $E_\text{exc}$ it may collide inelastically,
giving up exactly $E_\text{exc}$ and dropping to near zero. With a retarder $V_r$,
the current dips at $V \approx n\,E_\text{exc}/e$, spaced by $E_\text{exc}/e$, and
the tube shows $\lfloor V/E_\text{exc}\rfloor$ luminous excitation layers.

## Numerical method

A transport simulation: each electron accelerates, and once above $E_\text{exc}$
collides inelastically with a mean-free-path probability, exciting an atom. The
collector current is the fraction clearing the retarder times a collection
efficiency. No fabricated data.

## Controls

- Accelerating voltage V, excitation energy E_exc.

## Expected qualitative features

1. The current rises overall but dips at each multiple of $E_\text{exc}/e$.
2. The dip spacing equals the excitation energy.
3. The number of luminous layers is $\lfloor V/E_\text{exc}\rfloor$.

## Invariants and acceptance thresholds

- Dip spacing $= E_\text{exc}/e$.
- Layers $= \lfloor V/E_\text{exc}\rfloor$.
- Pass fraction dips periodically.

## Citations

Franck and Hertz 1914, Verh. Dtsch. Phys. Ges. 16, 457. Eisberg and Resnick,
Quantum Physics, 2nd ed., Sec. 4.6.
