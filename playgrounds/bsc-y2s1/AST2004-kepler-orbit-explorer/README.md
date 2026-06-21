# Kepler orbit explorer

One orbit you control, showing all three of Kepler's laws at once. Set its size
(semi-major axis a) and how stretched it is (eccentricity e) and the body traces
an ellipse with the Sun at a focus, not the centre, which is the first law. The
line from the Sun to the body sweeps out the shaded wedges, which all have the
same area for equal slices of time, the second law: the body must race when it
is close to the Sun (perihelion) and crawl when it is far (aphelion), as the
speed readout confirms. The motion is the inverse-square law in GM = 1 units
(a = 1 is Earth's orbit, 1 year per revolution), integrated with an
energy-conserving symplectic step; the equal-time wedges are placed by solving
Kepler's equation.

The lower plot is the third law: period squared against semi-major axis cubed,
on one straight line through the origin. Slide the semi-major axis and your point
climbs the line. Toggle the inner planets (Mercury through Mars, real
eccentricities) on for context and to populate the line, or off to focus on the
equal-area sweep.

Use the semi-major-axis, eccentricity, and speed sliders and the planets toggle.
Pause freezes the animation and Reset restores the defaults.

## Reference

Primary citation: Carroll and Ostlie, *An Introduction to Modern Astrophysics*,
2nd ed., Ch. 2.

## Verification

- Strong invariants: per-body Kepler's third law (T = 2 pi a^(3/2)); eccentricity
  and semi-major axis recovered from the state to 1e-8; Earth returns within 2% of
  its start after one period; bit-identical reproducibility after 1000 steps.
- Live readout: the total energy drift (symplectic conservation), in the rail.
