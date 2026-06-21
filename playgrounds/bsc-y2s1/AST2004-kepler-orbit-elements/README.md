# Keplerian orbit elements

The six classical orbital elements fully specify a Kepler orbit. Two set the
ellipse: the semi-major axis a (size) and the eccentricity e (shape). Three
orient it against a reference plane: the inclination i tilts the orbital plane,
the longitude of the ascending node Omega swings the line of nodes, and the
argument of periapsis omega rotates the closest point within the plane. The
sixth, the true anomaly nu, places the body and is the animated time variable
here, driven by Kepler's equation so the body moves at the correct varying speed.

Look for the 3D orbit redrawing as you turn each element, with the line of nodes,
periapsis, and ascending node marked. The lower plot is the orbital distance and
speed versus true anomaly: they are mirror images, the body fastest at periapsis
where it is closest and slowest at apoapsis (Kepler's second law).

Use the eccentricity, inclination, node, and periapsis sliders. Pause freezes the
orbiting body and Reset restores a tilted, moderately eccentric example orbit.

## Reference

Primary citation: Carroll and Ostlie, *An Introduction to Modern Astrophysics*,
2nd ed., Ch. 2; Murray and Dermott, *Solar System Dynamics*, Ch. 2.

## Verification

- Strong invariants: Kepler's equation converges; circular orbit r = a;
  inclination 0 keeps z = 0; perihelion r = a(1-e).
- Live readout: the timed orbital speed matches the vis-viva law
  v = sqrt(2/r - 1/a), checked each frame in the rail.
