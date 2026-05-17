---
title: Hydrogen in Electric and Magnetic Fields
slug: hydrogen-atom-stark-zeeman
status: verified
audience: portfolio
created: 2026-05-17
hook: 'A magnetic field fans every level into a Lorentz triplet, an electric field shears the excited shells, and the ground state alone refuses to budge: no first-order Stark.'
one_paragraph: 'Hydrogen levels n = 1..4 split under external fields. The primary scene is the physical term diagram, each Rydberg level fanning into sublevels as the magnetic (Zeeman, dE = mu_B B m_l) and electric (linear Stark for n >= 2) fields ramp, with the chosen transition drawn; beside it the synthetic spectrum shows the line splitting a spectrometer records (a normal-Zeeman triplet, a Stark multiplet), zoomed onto the multiplet. The ground state shows the headline result: no first-order Stark shift, only a tiny negative quadratic one. The headless sim.js is gate-tested for the Rydberg ladder, the vanishing first-order Stark of n=1, the linear Stark of n=2, the equally-spaced Zeeman split linear in B, the Lorentz triplet, the dipole selection rules and zero-field degeneracy.'
tags: [quantum, atomic, spectroscopy, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3003
share_state_keys: []
---

# Hydrogen in Electric and Magnetic Fields

## Physical setup

A hydrogen atom in a uniform magnetic field (Zeeman) and a uniform
electric field (Stark), with a chosen emission transition observed in
a synthetic spectrometer.

## Governing equations

Unperturbed `E_n = -RY/n^2`. Normal Zeeman: each level splits into
`2l+1` sublevels at `dE = mu_B B m_l` (equal spacing, linear in B); a
spectral line becomes the Lorentz triplet `E0, E0 +/- mu_B B`. Linear
Stark in parabolic quantum numbers
`dE = (3/2) n (n1 - n2) e a0 F`; for `n = 1` only `(0,0,0)` exists so
the first-order shift is exactly zero, leaving a negative quadratic
shift `-(1/2) alpha F^2`. Dipole selection rules `dl = +/-1`,
`dm in {-1,0,+1}`.

## Numerical method

Closed-form level, Stark and Zeeman expressions; parabolic states
enumerate the Stark sublevels. The term-diagram fan is auto-normalised
per level (Zeeman and Stark differ by orders of magnitude, so the fan
is schematic while the readout and the zoomed spectrum carry the true
magnitudes). Reference: Griffiths, *Introduction to Quantum
Mechanics* (3rd ed.), Ch. 6 (`griffiths-qm`).

## Controls

- transition: Lyman-alpha 2->1, Balmer-alpha 3->2, Balmer-beta
  4->2, Paschen 4->3.
- Zeeman B (tesla); Stark field F.
- Reset, Pause.

## Expected qualitative features

- A magnetic field fans every level symmetrically; the line becomes a
  triplet whose spacing grows with B.
- An electric field shears the n >= 2 shells linearly; the n = 1 line
  stays put (only a faint quadratic dip).
- Both fields together give a dense multiplet in the spectrum.

## Invariants and acceptance thresholds

- `E_n = -RY/n^2`; Lyman-alpha ~ 10.2 eV.
- n=1: `starkLinear = 0` for all F; quadratic shift negative and
  `~ F^2`.
- n=2: extreme Stark shift `= +/- 3 e a0 F`, the m=+/-1 components
  unshifted, linear in F.
- Zeeman spacing `= mu_B B`, linear in B, m=0 unshifted, `n^2`
  sublevels.
- Lorentz triplet spacing `mu_B B`, collapsing at B=0.
- Selection rules `dl = +/-1`, `|dm| <= 1`.
- Zero field restores exact degeneracy.

## Limiting cases for verification

- `B = F = 0`: all sublevels collapse to `E_n`.
- Ground state: no linear Stark, only a quadratic pull-down.

Source: Griffiths, *Introduction to Quantum Mechanics* (3rd ed.),
Ch. 6 (`griffiths-qm`).
