# Kepler orbit explorer

A top-down view of the inner solar system: the Sun at the centre, the four inner
planets (Mercury through Mars) at their real semi-major axes and eccentricities,
plus an adjustable comet. All bodies obey the same inverse-square law in GM = 1
units, where a = 1 is Earth's orbit (1 year per revolution), and are integrated
with an energy-conserving symplectic step so the orbits stay closed.

The lower plot is Kepler's third law: period squared against semi-major axis
cubed. Every body, planet or comet, lands on one straight line through the origin
(T squared proportional to a cubed), no matter its eccentricity. Slide the comet
outward and its point climbs the line while its eccentric orbit grows in the
scene. Watch the inner planets lap the slow outer ones, and each body speed
through its closest approach (Kepler's second law).

Use the comet semi-major-axis slider and the speed slider. Pause freezes the
animation and Reset restores the default system.

## Reference

Primary citation: Carroll and Ostlie, *An Introduction to Modern Astrophysics*,
2nd ed., Ch. 2.

## Verification

- Strong invariants: per-body Kepler's third law (T = 2 pi a^(3/2)); eccentricity
  and semi-major axis recovered from the state to 1e-8; Earth returns within 2% of
  its start after one period; bit-identical reproducibility after 1000 steps.
- Live readout: the total energy drift (symplectic conservation), in the rail.
