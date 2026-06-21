# Multipole expansion of the potential

Far from a localized clump of charge, the potential can be written as a sum of
simpler pieces: a monopole that falls off as one over distance, a dipole as
distance squared, a quadrupole as distance cubed, and so on. This is the
multipole expansion. Far away only the first non-zero term matters, so a neutral
cloud looks like a pure dipole; up close you need many terms and the series
barely helps. The scene shows the exact potential of a small cluster as a colour
map with a probe you can move, and the lower plot shows how wrong each truncation
is against distance.

Look for the lower log-log plot: each truncation (monopole, plus dipole, plus
quadrupole) drops a whole power of distance steeper than the last. For the dipole
cloud the monopole line barely falls (the net charge is zero, so the leading term
is useless) while the dipole line plunges. Drag the probe outward and the error
at any fixed order collapses; drag it in near the charges and the expansion stops
working.

Use the cloud selector (dipole, offset pair, quadrupole, octupole) and the
truncation selector; drag the probe to set its distance and direction. Pause
freezes the orbiting probe and Reset restores the dipole cloud.

## Reference

Primary citation: Griffiths, *Introduction to Electrodynamics*, 4th ed., Ch. 3;
Jackson, *Classical Electrodynamics*, Ch. 4.

## Verification

- Strong invariants: single charge at origin is exactly the monopole term; a
  neutral cloud has zero monopole with the right far-field power law; truncation
  error falls with distance and with each added order.
- Live readout: the error drops with each order at the probe, shown in the rail.
