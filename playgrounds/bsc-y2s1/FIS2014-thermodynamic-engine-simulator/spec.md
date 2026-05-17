---
title: Thermodynamic Engine Simulator
slug: thermodynamic-engine-simulator
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Watch the molecules speed up as heat pours in, the piston do the work, and the wasted heat dump into the cold sink, all from one moving dot on the P-V loop.'
one_paragraph: 'A piston-cylinder engine running a chosen ideal-gas cycle. The gas molecules and piston track the live temperature and volume, the P-V loop traces with a moving operating point, and an energy-flow diagram splits Q_hot into work and Q_cold with the efficiency. Carnot, Otto, Diesel and Stirling cycles, reversible to a refrigerator. The headless sim.js is gate-tested for the first law and the Carnot/Otto efficiency laws.'
tags: [thermodynamics, animation, multi-panel, live-readout]
difficulty: 3
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2001
share_state_keys: []
---

# Thermodynamic Engine Simulator

## Physical setup

n moles of an ideal gas (gamma = 5/3) in a piston-cylinder, exchanging
heat with hot and cold reservoirs as it runs a closed cycle. Molecule
speeds scale with the live temperature; the piston position tracks the
volume; the reservoirs glow when heat flows.

## Governing equations

Isothermal `pV = const` (`W = nRT ln(V2/V1)`, `Q = W`); adiabatic
`pV^gamma = const` (`Q = 0`); isochoric (`W = 0`, `Q = nCv dT`);
isobaric (`Q = nCp dT`). First law around the loop: `sum Q = sum W`.
Carnot `eta = 1 - Tc/Th`; Otto `eta = 1 - r^{1-gamma}`.

## Numerical method

Closed-form state points per cycle; the P-V loop is sampled per
process; an animation phase sweeps the operating point. Stirling uses
an ideal regenerator (the isochoric heats are internal).

## Controls

- cycle selector (Carnot, Otto, Diesel, Stirling).
- T_hot, T_cold, compression-ratio sliders.
- Reverse (refrigerator), Reset, Pause.

## Expected qualitative features

- Molecules speed up on heat-in, slow on expansion; piston tracks V.
- Carnot is a thin lens; Otto/Diesel have sharp isochoric/isobaric
  corners; the loop area is the net work.
- Tc -> Th collapses the efficiency; Reverse runs it as a fridge.

## Invariants and acceptance thresholds

- First law: `dU = 0` and `sum Q = sum W` around every closed loop.
- Carnot efficiency `= 1 - Tc/Th` within 0.5%.
- Otto efficiency `= 1 - r^{1-gamma}` within 0.5%.
- Efficiency vanishes as `Tc -> Th`.
- No cycle exceeds Carnot between its own temperature extremes.
- Adiabatic segments keep `pV^gamma` constant within 1e-6.

## Limiting cases for verification

- `Tc = Th`: zero efficiency.
- Carnot: reversible, `eta = 1 - Tc/Th` exactly.

Source: Callen, *Thermodynamics*, 2nd ed., Ch. 4 (`callen`); Reif,
*Fundamentals of Statistical and Thermal Physics*, Ch. 5 (`reif`).
