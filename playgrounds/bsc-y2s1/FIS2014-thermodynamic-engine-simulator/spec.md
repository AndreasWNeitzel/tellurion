---
title: Thermodynamic Engine Simulator
slug: thermodynamic-engine-simulator
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Watch the molecules speed up as heat pours in, the piston do the work, and the wasted heat dump into the cold sink, all from one moving dot on the P-V loop.'
one_paragraph: 'A piston-cylinder engine running a chosen ideal-gas cycle. The gas molecules and piston track the live temperature and volume, the P-V loop traces with a moving operating point, and an energy-flow diagram splits Q_hot into work and Q_cold with the efficiency. Carnot, Otto, Diesel and Stirling cycles, reversible to a refrigerator. Reference: Callen, Thermodynamics, 2nd ed., Chapter 4; Reif, Fundamentals of Statistical and Thermal Physics, Chapter 5.'
tags: [thermodynamics, animation, multi-panel, live-readout]
difficulty: 3
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2001
primary_citation: griffithsem2017
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "Griffiths, Introduction to Electrodynamics, Fourth ed."
---

# Thermodynamic Engine Simulator

## Explainer

### What you are looking at

A heat engine takes heat in from something hot, turns part of it into
useful work, and dumps the rest into something cold. It cannot turn
all the heat into work; the playground makes that limit visible by
running a gas through a closed cycle and splitting the heat into work
and waste live.

### The four processes and the first law

The working gas is $n$ moles of an ideal gas. Each leg of a cycle is
one of four idealised processes:

$$\text{isothermal: }pV=\text{const},\quad
  \text{adiabatic: }pV^{\gamma}=\text{const},$$
$$\text{isochoric: }V=\text{const},\quad
  \text{isobaric: }p=\text{const},$$

with $\gamma=C_p/C_V$ the heat-capacity ratio. Around any closed loop
the internal energy returns to its start, so the first law gives

$$\oint dU = 0 \;\Longrightarrow\; \sum Q = \sum W,$$

and the net work is exactly the area enclosed by the loop on the
pressure-volume ($p$-$V$) diagram.

### Efficiency and the Carnot bound

The efficiency is the fraction of the absorbed heat converted to work,

$$\eta=\frac{W_\text{net}}{Q_\text{hot}}=1-\frac{Q_\text{cold}}{Q_\text{hot}}.$$

No engine working between a hot reservoir at $T_h$ and a cold one at
$T_c$ can beat the Carnot value

$$\eta_\text{Carnot}=1-\frac{T_c}{T_h},$$

and the air-standard Otto cycle gives $\eta=1-r^{1-\gamma}$ with
compression ratio $r$. As $T_c\to T_h$ the efficiency collapses to
zero: you need a temperature difference to extract work.

### Things to try

- Switch between Carnot, Otto, Diesel and Stirling and compare the
  loop shape and the efficiency for the same temperatures.
- Slide $T_c$ toward $T_h$ and watch the efficiency fall to zero.
- Reverse the cycle and watch the same hardware act as a refrigerator,
  pumping heat from cold to hot at the cost of work.

### Where this comes from

The ideal-gas processes, the first law and the Carnot limit follow
Callen, Thermodynamics, 2nd ed., Chapter 4, and Reif, Fundamentals of
Statistical and Thermal Physics, Chapter 5.

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

Source: Callen, *Thermodynamics*, 2nd ed., Ch. 4; Reif,
*Fundamentals of Statistical and Thermal Physics*, Ch. 5.
