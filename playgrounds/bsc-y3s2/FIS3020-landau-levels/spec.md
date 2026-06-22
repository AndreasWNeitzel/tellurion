---
title: Landau Levels
slug: landau-levels
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3020
curriculum_year: bsc-y3s2
primary_citation: ashcroft-mermin
primary_chapter: 14
hook: "A magnetic field forces electrons into circles and quantizes their energy into a ladder. Crank up the field and watch the rungs sweep past the Fermi level."
one_paragraph: "A charged particle in a magnetic field orbits at the cyclotron frequency omega_c = eB/m, and quantization turns the energy continuum into Landau levels E_n = (n+1/2) hbar omega_c, evenly spaced by hbar omega_c with a degeneracy proportional to B. The playground animates the cyclotron orbit shrinking toward the magnetic length as B rises, beside the energy ladder filled to the Fermi level, and plots the Landau fan E_n vs B whose lines sweep past E_F as the field grows, the origin of the de Haas-van Alphen oscillations."
tags: [condensed-matter, magnetism, landau-levels, quantum-hall, cyclotron, density-of-states, interactive, animation, live-readout]
difficulty: 4
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [B, EF]
invariants:
  - key: spacing
    label: the level spacing equals hbar omega_c
    tolerance: 1e-9
  - key: zero
    label: the lowest level sits at B/2 (zero-point)
    tolerance: 1e-9
  - key: degeneracy
    label: the level degeneracy is proportional to B
    tolerance: 1e-9
what_to_try:
  - Raise B; the orbit tightens and the levels spread apart.
  - Keep raising it; filled levels cross E_F and empty out.
  - Read the fan; dots below E_F on the current-field line are the occupied levels.
  - Move E_F; more or fewer rungs sit below it.
references:
  - "Ashcroft and Mermin, Solid State Physics, Holt-Saunders, 1976, Ch. 14."
  - "Kittel, Introduction to Solid State Physics, 8th ed., Ch. 9."
---

# Landau levels

## Physical setup

A charged particle (electron) moving in a plane perpendicular to a uniform magnetic
field B, in the quantum regime where the cyclotron motion is quantized.

## Equations

$$ \omega_c = \frac{eB}{m}, \qquad E_n = \left(n+\tfrac12\right)\hbar\omega_c, \qquad \ell_B = \sqrt{\frac{\hbar}{eB}}, $$

with a degeneracy per area $eB/h$ for each level. Units $\hbar = m = e = 1$, so
$\omega_c = B$ and $E_n = (n+1/2)B$.

## Numerical method

Closed-form Landau energies, magnetic length, and degeneracy; the cyclotron orbit is
animated at angular speed omega_c. No integration.

## Controls

- Magnetic field B; Fermi energy E_F.

## Expected qualitative features

1. The cyclotron orbit tightens and speeds up as B grows.
2. The Landau levels are equally spaced by hbar omega_c, widening with B.
3. Filled levels cross E_F and empty as B increases (quantum oscillations).
4. The lowest level sits at B/2, the zero-point of the cyclotron oscillator.

## Invariants and acceptance thresholds

- Level spacing = $\hbar\omega_c$.
- Lowest level at $B/2$.
- Degeneracy proportional to $B$.

## Citations

Ashcroft and Mermin, Solid State Physics, Ch. 14.
Kittel, Introduction to Solid State Physics, 8th ed., Ch. 9.
