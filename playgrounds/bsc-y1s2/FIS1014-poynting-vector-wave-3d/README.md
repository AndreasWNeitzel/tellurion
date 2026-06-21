# The Poynting vector of a light wave

A plane electromagnetic wave is an electric field and a magnetic field oscillating
at right angles to each other and to the direction of travel. Their cross product,
the Poynting vector S = E x B, points the way the energy flows and measures how
much. The scene draws E (red) and B (blue) in pseudo-3D as the wave propagates,
with the gold energy-flow arrows; the lower plot shows E, B, and S along the wave
and the cycle-averaged flow.

Look for the gold S arrows on a traveling wave: they always point forward and
never reverse, because E and B rise and fall together so their product stays
positive. The lower plot's S curve sits entirely above zero, averaging to half
its peak, which is the intensity. Switch to circular polarization and the fields
trace constant-length helices with a perfectly steady flow; switch to a standing
wave and E and B fall out of step, so S sloshes both ways and its average drops to
zero, no net energy transport.

Use the wave selector (linear, circular, standing) and the wavelength slider.
Pause freezes the propagation and Reset restores the linear wave.

## Reference

Primary citation: Griffiths, *Introduction to Electrodynamics*, 4th ed., Sec.
9.2; Jackson, *Classical Electrodynamics*, Ch. 7.

## Verification

- Strong invariants: E and B are perpendicular everywhere (transverse); |E| =
  c|B| for the traveling wave; S is parallel to +z; the linear time-average is
  E0^2/2c; standing-wave nodes are exact zeros.
- Live readout: E . B = 0 (the wave is transverse), checked along the wave in the
  rail.
