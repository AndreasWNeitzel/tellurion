---
title: The Stern-Gerlach Experiment
slug: stern-gerlach-spin-split
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS2003
curriculum_year: bsc-y2s2
primary_citation: griffiths-qm
primary_chapter: 4
hook: "Send atoms through an inhomogeneous magnet and the beam does not smear, it splits into discrete spots. Count them and you have measured the spin."
one_paragraph: "An inhomogeneous magnetic field deflects an atom by a force F_z = mu_z dB/dz set by its magnetic moment. Classically mu_z is continuous, predicting a smeared band; quantum mechanically mu_z is quantised in 2s+1 values m_s, so the beam splits into exactly 2s+1 discrete spots. The playground streams atoms through the magnet, each in a random m_s state, building the spots dot by dot inside the faint band a classical moment would have smeared across, and plots the screen intensity as sharp quantum peaks against the flat classical density. The number of spots measures the spin: two for spin-1/2, three for spin-1, four for spin-3/2."
tags: [modern-physics, quantum, spin, quantization, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [spin, grad]
invariants:
  - key: count
    label: the beam splits into exactly 2s+1 discrete spots
    tolerance: 0.0
  - key: symmetric
    label: the spots are symmetric about the axis with zero mean deflection
    tolerance: 0.0
  - key: inside
    label: the quantum spots lie inside the wider classical band
    tolerance: 0.0
what_to_try:
  - Watch the discrete spots build dot by dot, with empty gaps, never the continuous classical streak.
  - Switch the spin; the spot count changes as 2s+1 (two, three, four).
  - Raise the field gradient to push the spots farther apart.
references:
  - "Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 4.4.1 (spin and the Stern-Gerlach experiment)."
  - "Gerlach and Stern 1922, Z. Phys. 9, 349."
---

# The Stern-Gerlach experiment

## Physical setup

A beam of atoms with magnetic moment mu passes through a field with a gradient
dB/dz; the transverse force deflects each atom by an amount set by mu_z.

## Equations

The force is $F_z = \mu_z\,dB/dz$. Classically $\mu_z = \mu\cos\theta$ varies
continuously over $[-\mu, \mu]$. Quantum mechanically $\mu_z \propto m_s$ with
$m_s \in \{-s, \dots, s\}$, so the beam splits into $2s+1$ discrete spots, the
outermost at $\pm d$ and the classical band reaching $d\sqrt{s(s+1)}/s$.

## Numerical method

Each atom is assigned a random $m_s$ (uniform over the $2s+1$ states) and
deflected accordingly, with a small beam spread; landings accumulate into the
spots and the screen histogram. Discrete states only, no fabricated values.

## Controls

- Spin s (1/2, 1, 3/2), field gradient; Reset.

## Expected qualitative features

1. The beam splits into discrete spots, not a continuous smear.
2. The number of spots is $2s+1$.
3. The spots sit inside the wider classical band.

## Invariants and acceptance thresholds

- Exactly $2s+1$ spots.
- Spots symmetric about the axis, zero mean deflection.
- The classical band is wider than the outermost spot.

## Citations

Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 4.4.1. Gerlach and
Stern 1922, Z. Phys. 9, 349.
