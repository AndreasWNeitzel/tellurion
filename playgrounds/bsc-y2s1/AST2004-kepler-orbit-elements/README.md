# Keplerian orbit elements

The six classical orbital elements fully specify a Kepler orbit. Two set the
ellipse: the semi-major axis a (size) and the eccentricity e (shape). Three
orient it against a reference plane: the inclination i tilts the orbital plane,
the longitude of the ascending node Omega swings the line of nodes, and the
argument of periapsis omega rotates the closest point within the plane. The
sixth, the true anomaly nu, places the body and is the animated time variable
here, driven by Kepler's equation so the body moves at the correct varying speed.

The scene draws an explicit celestial reference frame: the reference plane (the
ecliptic), the vernal-equinox direction (the dial labelled with the Aries glyph),
and the line of nodes where the orbital plane cuts the reference plane. Each
element appears as the angle arc that defines it, colour-keyed to the readout:
Omega measured in the reference plane from the equinox to the ascending node, i
as the tilt between the two planes at the node, omega in the orbital plane from
the node to periapsis, and nu from periapsis to the body now. Turning a slider
moves exactly that arc, so it is clear what each element controls. The lower plot
is the orbital distance and speed versus true anomaly: they are mirror images,
the body fastest at periapsis where it is closest and slowest at apoapsis
(Kepler's second law).

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
