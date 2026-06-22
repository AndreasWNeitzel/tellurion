---
title: The Boltzmann Factor and the Schottky Anomaly
slug: boltzmann-factor-schottky
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3008
curriculum_year: bsc-y3s1
primary_citation: reif
primary_chapter: 6
hook: "A heat capacity that vanishes when it is cold AND when it is hot, peaking only in between. The Schottky anomaly is the signature of a finite ladder of energy levels."
one_paragraph: "A two-level system with a gap Delta and degeneracies g0, g1 populated by the Boltzmann factor p_i proportional to g_i e^{-E_i/kT}. The excited population rises from 0 at low T to g1/(g0+g1) at high T, and the heat capacity C/k = (Delta/kT)^2 g0 g1 e^{-Delta/kT}/(g0+g1 e^{-Delta/kT})^2 vanishes at both extremes and peaks near kT = 0.42 Delta: the Schottky anomaly. The playground sweeps the temperature, redistributing particles between the levels, and plots the heat capacity against kT/Delta with the mean energy overlaid."
tags: [statistical-mechanics, thermodynamics, boltzmann, two-level-system, schottky-anomaly, heat-capacity, interactive, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [Delta, g1]
invariants:
  - key: norm
    label: the level populations sum to 1
    tolerance: 1e-9
  - key: peak
    label: the heat-capacity peak sits at kT/Delta = 0.417 for equal degeneracies
    tolerance: 0.05
  - key: deriv
    label: the heat capacity equals d<E>/dT
    tolerance: 1e-4
what_to_try:
  - Sweep the temperature; particles climb to the excited level, then the populations saturate.
  - Watch the heat capacity rise from zero, peak near kT = 0.42 Delta, and fall back.
  - Raise g1; the high-T population shifts to the excited level and the peak reshapes.
  - Compare curves; the C peak lines up with the steepest part of <E>.
references:
  - "Reif, Fundamentals of Statistical and Thermal Physics, McGraw-Hill, 1965, Ch. 6."
  - "Kittel and Kroemer, Thermal Physics, 2nd ed., Ch. 3."
---

# The Boltzmann factor and the Schottky anomaly

## Physical setup

A two-level system, a ground level (energy 0, degeneracy g0) and an excited level
(energy Delta, degeneracy g1), in thermal equilibrium at temperature T (units k = 1).

## Equations

$$ p_1 = \frac{g_1 e^{-\Delta/kT}}{g_0 + g_1 e^{-\Delta/kT}}, \quad \langle E\rangle = \Delta p_1, \quad \frac{C}{k} = \left(\frac{\Delta}{kT}\right)^2\frac{g_0 g_1 e^{-\Delta/kT}}{(g_0 + g_1 e^{-\Delta/kT})^2}. $$

The heat capacity vanishes as $T\to0$ and $T\to\infty$ and peaks at $kT\approx0.417\,\Delta$
for $g_0=g_1$.

## Numerical method

Closed-form two-level Boltzmann statistics; the peak is located by a fine scan. No time
integration. The particle display shows round(N p_i) particles per level.

## Controls

- Gap Delta; excited degeneracy g1 (g0 = 1); temperature sweep toggle; drag the cursor.

## Expected qualitative features

1. Populations shift from ground-only (cold) to the ratio g1/(g0+g1) (hot).
2. The heat capacity has a single peak, zero at both temperature extremes.
3. The peak aligns with the steepest rise of the mean energy.
4. Increasing g1 raises the high-T excited population and reshapes the peak.

## Invariants and acceptance thresholds

- Populations sum to 1.
- The Schottky peak is at $kT/\Delta = 0.417$ for equal degeneracies (to 0.05).
- $C = d\langle E\rangle/dT$ to 1e-4.

## Citations

Reif, Fundamentals of Statistical and Thermal Physics, Ch. 6.
Kittel and Kroemer, Thermal Physics, 2nd ed., Ch. 3.
