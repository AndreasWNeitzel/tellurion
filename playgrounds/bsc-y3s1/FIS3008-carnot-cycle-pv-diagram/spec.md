---
title: The Carnot Cycle
slug: carnot-cycle-pv-diagram
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3008
curriculum_year: bsc-y3s1
primary_citation: callen
primary_chapter: 4
hook: "Run the most efficient heat engine the second law allows. Two isotherms, two adiabats, and an efficiency that depends on nothing but the two temperatures."
one_paragraph: "An ideal gas runs a Carnot cycle: isothermal expansion at T_h drawing heat Q_h, adiabatic expansion to T_c, isothermal compression at T_c rejecting Q_c, and adiabatic compression back. The four legs trace a loop on the P-V plane whose enclosed area is the net work W = Q_h - Q_c, and the efficiency is eta = W/Q_h = 1 - T_c/T_h. The playground circulates a working point around the loop, shows a piston-cylinder whose volume and temperature track the gas with its current reservoir contact, and plots the efficiency against T_c/T_h alongside the heat balance Q_h = W + Q_c."
tags: [thermodynamics, carnot, heat-engine, entropy, ideal-gas, interactive, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [Th, Tc, r]
invariants:
  - key: firstlaw
    label: net work equals heat in minus heat out, W = Q_h - Q_c
    tolerance: 1e-9
  - key: carnot
    label: the efficiency W/Q_h equals 1 - T_c/T_h
    tolerance: 1e-9
  - key: volratio
    label: the Carnot volume condition V3/V4 = V2/V1
    tolerance: 1e-9
what_to_try:
  - Lower T_c; the loop grows and the efficiency climbs toward 100%.
  - Raise T_c toward T_h; the loop collapses and the efficiency falls to zero.
  - Watch the reservoir bar; heat flows only on the isotherms, never the adiabats.
  - Switch to a diatomic gas; the loop reshapes but the efficiency is unchanged.
references:
  - "Callen, Thermodynamics and an Introduction to Thermostatistics, 2nd ed., Wiley, 1985, Ch. 4."
  - "Fermi, Thermodynamics, Dover, 1956, Ch. 3."
---

# The Carnot cycle

## Physical setup

One mole of ideal gas (nR = 1) cycled reversibly between a hot reservoir at $T_h$ and
a cold reservoir at $T_c$ through two isotherms and two adiabats.

## Equations

Isotherms obey $PV = nRT$; adiabats obey $PV^\gamma = \mathrm{const}$ and
$TV^{\gamma-1}=\mathrm{const}$, which forces $V_3/V_4 = V_2/V_1$. The heats and
efficiency are

$$ Q_h = nRT_h\ln\frac{V_2}{V_1},\quad Q_c = nRT_c\ln\frac{V_3}{V_4},\quad \eta = \frac{W}{Q_h} = 1-\frac{T_c}{T_h}. $$

## Numerical method

Closed-form ideal-gas state relations; the loop is sampled leg by leg, and the work
is the enclosed P-V area, equal to $Q_h - Q_c$. No time integration.

## Controls

- Hot temperature T_h; cold temperature T_c; isothermal expansion ratio V2/V1;
  monatomic / diatomic gas (gamma).

## Expected qualitative features

1. The loop area (net work) grows as $T_h - T_c$ widens.
2. Efficiency rises toward 1 as $T_c\to0$ and falls to 0 as $T_c\to T_h$.
3. Heat is exchanged only on the isotherms.
4. Changing gamma reshapes the adiabats but leaves the efficiency fixed.

## Invariants and acceptance thresholds

- $W = Q_h - Q_c$ to 1e-9.
- $W/Q_h = 1 - T_c/T_h$ to 1e-9.
- $V_3/V_4 = V_2/V_1$ to 1e-9.

## Citations

Callen, Thermodynamics and an Introduction to Thermostatistics, 2nd ed., Ch. 4.
Fermi, Thermodynamics, Ch. 3.
