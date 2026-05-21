---
title: Adiabatic vs Isothermal Processes on a PV Diagram
slug: adiabatic-vs-isothermal-pv
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2014
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: callen
primary_chapter: 4
hook: 'Compress a gas slowly and it stays cool on the isotherm; compress it fast and no heat escapes, so the adiabat climbs steeper and hotter.'
one_paragraph: 'From the same starting state a gas can be taken to a smaller volume two ways. Isothermal compression is slow enough to dump heat and hold the temperature fixed, tracing P ~ 1/V. Adiabatic compression is fast enough that no heat leaves, so the work goes into internal energy and the temperature rises, tracing the steeper P ~ V^(-gamma). The playground draws both curves from a shared point and tracks pressure and temperature as you slide the volume, so the gap between the paths and the heating along the adiabat are explicit. This is the difference between a slow piston and a Diesel stroke. Reference: Callen, Thermodynamics and an Introduction to Thermostatistics, Ch. 4.'
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
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---
# Adiabatic vs isothermal
Same initial state, two reversible processes; the adiabatic is steeper. Source: Callen Ch. 4 (`callen`).

## Explainer

### What you are looking at

Compress a gas slowly while it stays in contact with a heat bath, and
it follows one curve in the pressure-volume plane; compress it fast
so no heat escapes, and it follows a steeper one from the same
starting point. The playground draws both from a common state so the
difference (and the different work done) is explicit.

### Isothermal: constant temperature

Held at temperature $T$ (slow, heat free to flow), an ideal gas obeys
Boyle's law:

$$PV = nRT = \text{const}
  \quad\Longrightarrow\quad
  P \propto V^{-1}.$$

All the work done on the gas leaves as heat to the reservoir; the
internal energy (hence $T$) does not change.

### Adiabatic: no heat exchange

If no heat crosses the boundary ($Q=0$, fast or insulated), the first
law gives $dU = -P\,dV$, and for an ideal gas this integrates to

$$P V^{\gamma} = \text{const},
  \qquad
  \gamma = \frac{C_P}{C_V} > 1.$$

Because $\gamma>1$ the adiabat is steeper than the isotherm: on
compression the gas also heats up (work goes into internal energy, no
heat escapes), so its pressure rises faster. The area under each
curve is the work; the gap between the curves is the heat that would
have to be dumped to stay isothermal. This single distinction drives
the Carnot cycle, the speed of sound (an adiabatic, not isothermal,
compression, which is why Newton's isothermal estimate was wrong by
$\sqrt\gamma$), and atmospheric lapse rates. The playground sweeps
the compression ratio and $\gamma$ and overlays the two paths with
their work and temperature change.

### Things to try

- Compress along both paths from the same start and watch the
  adiabat climb above the isotherm (steeper by the factor $\gamma$).
- Read the temperature: constant on the isotherm, rising on the
  adiabat under compression.
- Change $\gamma$ (monatomic 5/3 vs diatomic 7/5) and watch the
  adiabat steepen or flatten.

### Where this comes from

The isothermal and adiabatic ideal-gas processes and $PV^\gamma$
follow Callen, *Thermodynamics and an Introduction to
Thermostatistics*, Chapter 4, and Blundell and Blundell, *Concepts
in Thermal Physics*, Chapter 12.
