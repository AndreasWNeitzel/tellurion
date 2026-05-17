# Jones Calculus: Polarization Through Elements

Polarization optics has an unreasonably tidy algebra. The state of a
fully polarized beam is two complex numbers, the Jones vector; every
polarizer and wave plate is a 2x2 matrix; and stacking elements is
just multiplying matrices. The left panel draws the ellipse the
electric field sweeps out; the right is the Poincare sphere, where
every polarization is a single point and each element moves that
point in a fixed way.

What to look for: start with linear light and a quarter-wave plate
at 45 degrees to it. The ellipse opens from a line into a perfect
circle, and on the sphere the point climbs from the equator to the
pole, that is circular polarization. Rotate the plate's axis and the
output sweeps through every ellipse. Switch element one to a
half-wave plate: the light stays linear but its plane flips about the
plate axis. Add a polarizer as element two and the beam dims exactly
as Malus's law says, the ellipse collapsing to a line. The DOP
readout never leaves 1.000 because a Jones vector is always fully
polarized.

Controls: the input selector picks linear (with an azimuth slider) or
circular light; element one and element two pick the optic; the
element-one axis slider rotates the first plate; Reset returns to the
linear-into-QWP-at-45 case.

## Reference

Primary citation: Hecht, *Optics* (5th ed.), Ch. 8 (`hecht2017`);
Born and Wolf, *Principles of Optics* (7th ed.), Sec. 1.4
(`born-wolf`).

## Verification

- Strong invariant: a polarizer is idempotent and obeys Malus's law;
  a QWP at 45 degrees produces |chi| = pi/4 circular light; wave
  plates and rotators are unitary; the Stokes vector satisfies
  S0^2 = S1^2 + S2^2 + S3^2 with DOP = 1; and the element chain
  equals the matrix product exactly.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
