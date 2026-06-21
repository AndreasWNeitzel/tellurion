# Engine Cycle Explorer

Pick one of four classical engine cycles (Otto, Diesel, Carnot, Stirling) and
see it as a closed loop on the pressure-volume plane. The four processes are
colour-coded, the corner states numbered 1 to 4, and the shaded area inside the
loop is the net work per cycle. A point traces the loop while a piston bar
tracks the live volume, and the axes autoscale to whichever cycle and
compression ratio you select.

The lower plot compares the efficiency of all four cycles at the current
settings, with the Carnot value marked as the reversible bound for the same
reservoirs. Raise the Otto compression ratio and the loop fattens as its
efficiency climbs; switch to Diesel and the heat-addition step flips from
constant volume (vertical) to constant pressure (horizontal).

Controls: compression ratio r, Diesel cutoff ratio rc, the cycle select, and
play/pause and reset. Reference: Callen, Thermodynamics and an Introduction to
Thermostatistics, 2nd ed., Ch. 4-5 (`callen`).

## Verification

- The P-V path closes (first state equals last) to better than 1e-2 for every
  cycle and parameter setting; see `invariants.test.mjs`.
- Efficiencies use the closed-form results (Otto 1 - r^(1-gamma), Diesel,
  Carnot and Stirling 1 - Tc/Th) and the net work is the shoelace area of the
  loop.
