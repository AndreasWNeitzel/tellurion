# Biot-Savart: the field of a coil

Run a current around a coil of wire and the Biot-Savart law gives the magnetic
field it makes by summing the contribution of every little length of wire. The
scene shows a slice through the coil's axis: the field lines (streamlines of the
in-plane field) over a colour map of the field strength, with the wire crossings
marked as current into and out of the plane. The geometry sets the pattern; the
current only scales the strength.

Look for the bar-magnet pattern of a single loop, lines threading up through the
middle and curling back around the outside. Switch to the Helmholtz pair and the
field lines straighten into a uniform patch in the gap (a flat spot in the lower
plot); switch to the solenoid and they lock parallel down the whole inside with
almost nothing outside (a long plateau in the lower plot). The lower plot is the
field along the axis, where each coil's signature appears.

Use the coil selector (single loop, Helmholtz pair, solenoid) and the current
slider. Pause freezes the flowing field-line arrows and Reset restores the single
loop.

## Reference

Primary citation: Griffiths, *Introduction to Electrodynamics*, 4th ed., Sec.
5.2; Jackson, *Classical Electrodynamics*, Sec. 5.3.

## Verification

- Strong invariants: long straight wire 1/s law within 1.5%; loop on-axis field
  matches the closed form within 0.5%; Helmholtz flatness; finite-solenoid centre
  within 5% of the closed form and weak outside.
- Live readout: div B = 0 (no magnetic monopoles), checked at off-wire points in
  the rail.
