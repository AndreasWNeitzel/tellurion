---
title: Specific Heat of Solids
slug: debye-einstein-heat-capacity
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3008
curriculum_year: bsc-y3s1
primary_citation: ashcroft-mermin
primary_chapter: 23
hook: "Why does a cold crystal forget how to store heat? Watch the Einstein and Debye models split below the Dulong-Petit plateau, and read the T-cubed law straight off a log-log plot."
one_paragraph: "The lattice heat capacity of a solid in units of the Dulong-Petit value 3Nk. The Einstein model treats each atom as one oscillator, C/3Nk = (TE/T)^2 e^(TE/T)/(e^(TE/T)-1)^2; the Debye model integrates over acoustic modes, C/3Nk = 3(T/TD)^3 integral_0^(TD/T) x^4 e^x/(e^x-1)^2 dx. Both reach 1 at high T, but at low T the Debye model gives the universal T^3 law while Einstein falls exponentially. The playground sweeps a temperature cursor over both curves and shows them on log-log axes, where the Debye curve is a straight slope-3 line."
tags: [statistical-mechanics, solid-state, heat-capacity, debye, einstein, thermodynamics, interactive, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [T, TD, TE]
invariants:
  - key: dp
    label: both models reach the Dulong-Petit value 3Nk at high T
    tolerance: 0.02
  - key: t3
    label: the Debye heat capacity follows the T^3 law at low T
    tolerance: 0.05
  - key: bounds
    label: C/3Nk stays in [0,1] and increases monotonically with T
    tolerance: 1e-6
what_to_try:
  - Sweep to high T; both curves flatten at the Dulong-Petit plateau.
  - Sweep to low T; the Einstein curve plunges below the Debye curve.
  - Read the log-log panel; the Debye curve is a straight slope-3 line.
  - Raise the Debye temperature; the whole curve shifts to higher T.
references:
  - "Ashcroft and Mermin, Solid State Physics, Holt-Saunders, 1976, Ch. 23."
  - "Kittel, Introduction to Solid State Physics, 8th ed., Ch. 5."
---

# Specific heat of solids

## Physical setup

The vibrational (phonon) contribution to the heat capacity of a monatomic crystal,
compared in the Einstein and Debye models, in units of the Dulong-Petit value 3Nk.

## Equations

$$ \frac{C_E}{3Nk} = \left(\frac{T_E}{T}\right)^2\frac{e^{T_E/T}}{(e^{T_E/T}-1)^2}, \qquad \frac{C_D}{3Nk} = 3\left(\frac{T}{T_D}\right)^3\!\int_0^{T_D/T}\frac{x^4 e^x}{(e^x-1)^2}\,dx. $$

High-T: both tend to 1. Low-T: $C_D/3Nk \to \tfrac{4}{5}\pi^4 (T/T_D)^3$ (the $T^3$ law);
$C_E/3Nk \to (T_E/T)^2 e^{-T_E/T}$ (exponential).

## Numerical method

The Einstein form is closed; the Debye integral is evaluated by Simpson quadrature
(400 points), with the upper limit capped where the integrand is negligible. The
integrand limit $x^2$ at $x\to0$ is handled explicitly.

## Controls

- Debye temperature; Einstein temperature; temperature sweep toggle; drag the cursor.

## Expected qualitative features

1. Both curves share the Dulong-Petit plateau at high T.
2. At low T the Einstein curve drops far below the Debye curve.
3. On log-log axes the Debye curve is a straight slope-3 line.
4. The Debye temperature sets the scale; raising it shifts the curve to higher T.

## Invariants and acceptance thresholds

- Both models reach 1 at high T (to 0.02).
- The Debye curve matches $\tfrac{4}{5}\pi^4(T/T_D)^3$ at low T (to 5%).
- $C/3Nk \in [0,1]$, monotonically increasing.

## Citations

Ashcroft and Mermin, Solid State Physics, Ch. 23.
Kittel, Introduction to Solid State Physics, 8th ed., Ch. 5.
