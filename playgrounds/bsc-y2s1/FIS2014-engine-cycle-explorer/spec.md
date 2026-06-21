---
title: Engine Cycle Explorer
slug: engine-cycle-explorer
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2014
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: callen
primary_chapter: 4
hook: 'Four classic heat engines drawn on the same pressure-volume plane; the area each loop encloses is the work it delivers per cycle.'
one_paragraph: 'Every heat engine is a closed loop on the PV diagram, and the area it encloses is the net work per cycle. The playground draws the selected idealization (Otto: two adiabats, two isochores; Diesel: constant-pressure heat addition; Carnot: two isotherms and two adiabats; Stirling: isotherms with regenerative isochores) as an autoscaled, colour-coded loop with numbered corner states, a piston bar tied to the volume, and a point tracing the path. A second plot compares the efficiency of all four cycles so the reversible Carnot bound is plain. Changing the compression ratio reshapes the loop and its efficiency, making concrete why real engines trade some efficiency for power. Reference: Callen, Thermodynamics and an Introduction to Thermostatistics, Ch. 4-5.'
tags: [thermodynamics, statistical-physics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
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
  - Raise the Otto compression ratio and watch the loop fatten and efficiency climb toward Carnot.
  - Switch cycles and see the heat-addition step change from constant volume to constant pressure.
  - Compare Carnot and Stirling efficiencies in the lower plot for the same reservoirs.
references:
  - "Callen, Thermodynamics and an Introduction to Thermostatistics, Second ed., Ch. 4."
---
# Engine cycle explorer
Four idealized cycles on the PV plane: Otto, Diesel, Carnot, Stirling. Source: Callen Ch. 4-5.

## Explainer

### What you are looking at

A heat engine takes a gas around a closed loop on the pressure-volume
plane, taking in heat, doing work, dumping the rest. The playground
draws four textbook loops (Otto, Diesel, Carnot, Stirling) so you can
compare their shapes and efficiencies on the same axes. The area inside
each loop is the net work per cycle.

### The common rule

For any closed cycle, the first law gives the net work as the enclosed
area and the efficiency as work over heat absorbed:

$$W = \oint P\,dV, \qquad \eta = \frac{W}{Q_\text{in}}
  = 1 - \frac{Q_\text{out}}{Q_\text{in}}.$$

No engine working between a hot reservoir $T_H$ and a cold one $T_C$
can beat the Carnot bound

$$\eta_\text{Carnot} = 1 - \frac{T_C}{T_H},$$

a hard limit set by the second law, not by engineering.

### The four cycles

- Otto (gasoline engine): two adiabats and two constant-volume steps.
  Efficiency $\eta = 1 - r^{1-\gamma}$ depends only on the compression
  ratio $r$.
- Diesel: adiabatic compression, constant-pressure heat addition; runs
  at higher compression than Otto, hence its real-world efficiency.
- Carnot: two isotherms and two adiabats; the rectangle in the
  temperature-entropy plane, and the unbeatable efficiency ceiling.
- Stirling: two isotherms and two constant-volume steps with a
  regenerator; ideally also reaches the Carnot efficiency.

The playground lets you change the operating parameters and watch the
loop area (the work) and the efficiency change, and see every real
cycle sit below the Carnot line.

### Things to try

- Raise the Otto compression ratio and watch the loop fatten and
  efficiency climb toward, but never reach, Carnot.
- Compare Carnot and Stirling at the same reservoirs: both touch the
  $1 - T_C/T_H$ ceiling.
- Note no loop ever encloses more work than the Carnot rectangle for
  the same temperatures.

### Where this comes from

The cycle constructions, the work-as-area result, and the Carnot
efficiency bound follow Callen, *Thermodynamics and an Introduction to
Thermostatistics*, 2nd ed., Chapters 4 to 5.
