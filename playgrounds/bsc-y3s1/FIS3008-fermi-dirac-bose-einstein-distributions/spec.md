---
title: Quantum Occupation Distributions
slug: fermi-dirac-bose-einstein-distributions
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3008
curriculum_year: bsc-y3s1
primary_citation: pathria
primary_chapter: 6
hook: "Fermions, bosons, and classical particles fill states by three different rules. Watch the Fermi step sharpen, the Bose peak diverge, and both melt into the classical exponential."
one_paragraph: "The mean occupation of a single-particle state of energy E is the Fermi-Dirac function 1/(e^((E-mu)/kT)+1) for fermions, the Bose-Einstein function 1/(e^((E-mu)/kT)-1) for bosons, and the Maxwell-Boltzmann e^(-(E-mu)/kT) for classical particles. The playground plots all three against energy with the chemical potential marked and a draggable cursor, an optional temperature sweep that sharpens the Fermi step and diverges the Bose peak, and a log-axis diagnostic where the tails for E - mu >> kT collapse onto the single classical exponential. Closed-form, no solver."
tags: [statistical-mechanics, quantum-statistics, fermi-dirac, bose-einstein, thermodynamics, interactive, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [kT, mu]
invariants:
  - key: fdrange
    label: the Fermi-Dirac occupation stays in [0,1] and is 1/2 at mu
    tolerance: 1e-12
  - key: phsym
    label: Fermi-Dirac particle-hole symmetry n(mu+d)+n(mu-d)=1
    tolerance: 1e-9
  - key: ordering
    label: n_BE > n_MB > n_FD for E > mu
    tolerance: 0.0
what_to_try:
  - Sweep to low kT; the Fermi-Dirac curve sharpens into a step at mu.
  - Drag the cursor just above mu; Bose-Einstein climbs above 1, Fermi-Dirac stays below.
  - Drag to high energy; all three occupations converge (classical limit).
  - Read the log panel; the tails are parallel straight lines of slope set by kT.
references:
  - "Pathria and Beale, Statistical Mechanics, 3rd ed., Elsevier, 2011, Ch. 6."
  - "Reif, Fundamentals of Statistical and Thermal Physics, Ch. 9."
---

# Quantum occupation distributions

## Physical setup

A system of identical particles in thermal and diffusive contact with a reservoir at
temperature T and chemical potential mu, asking for the mean number of particles in a
single-particle state of energy E.

## Equations

With $x=(E-\mu)/kT$,

$$ n_\mathrm{FD}=\frac{1}{e^{x}+1}, \qquad n_\mathrm{BE}=\frac{1}{e^{x}-1}\ (E>\mu), \qquad n_\mathrm{MB}=e^{-x}. $$

Fermi-Dirac is bounded by 1 and equals 1/2 at $E=\mu$; Bose-Einstein diverges as
$E\to\mu^+$; all three satisfy $n\to e^{-x}$ for $x\gg1$.

## Numerical method

Closed-form evaluation of the three occupation functions; no time integration. The
Bose-Einstein branch is drawn only for $E>\mu$, where it is physical.

## Controls

- Temperature kT; chemical potential mu; temperature sweep toggle; drag the energy
  cursor to read all three occupations.

## Expected qualitative features

1. Fermi-Dirac is a smoothed step at mu, sharpening as kT decreases.
2. Bose-Einstein diverges just above mu and exceeds 1.
3. For $E-\mu\gg kT$ the three curves coincide (classical limit).
4. On a log axis the tails are parallel straight lines.

## Invariants and acceptance thresholds

- Fermi-Dirac in [0,1], equal to 1/2 at mu.
- Particle-hole symmetry $n(\mu+d)+n(\mu-d)=1$ to 1e-9.
- Ordering $n_\mathrm{BE}>n_\mathrm{MB}>n_\mathrm{FD}$ for $E>\mu$.

## Citations

Pathria and Beale, Statistical Mechanics, 3rd ed., Ch. 6.
Reif, Fundamentals of Statistical and Thermal Physics, Ch. 9.
