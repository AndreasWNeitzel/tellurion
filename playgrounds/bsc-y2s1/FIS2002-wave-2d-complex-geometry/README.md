# 2D Waves in a Drawable Geometry

This playground solves the damped scalar wave equation
`u_tt = c^2 (u_xx + u_yy) - gamma u_t` on a grid with rigid walls and
an absorbing edge sponge. A monochromatic point source on the left
radiates toward a wall with slits, or an obstacle. The primary scene
is the physical displacement field drawn as a water-like diverging
map; a `tanh` compression keeps the strong near field from clipping so
the faint diffracted pattern past the wall stays visible.

Watch the double-slit preset: the circular wave hits the two slits,
each acts as a Huygens source, and the transmitted waves interfere
into the textbook fan with the central maximum landing exactly on the
axis (the on-axis path difference is zero). Switch to a single slit
for one broad diffraction lobe, to the obstacle for a shadow that the
wave still bends into, or to the free source for a clean expanding
circle. The side panel reads the screen intensity along the dashed far
column, where the fringes appear as a row of maxima.

The preset selector chooses the geometry; the wavelength slider sets
the source wavelength and hence the fringe spacing; the damping slider
attenuates the field with distance (the readout energy falls). Reset
returns to the default double slit and Pause freezes the field. The
numerics are the shared `wave-2d-cpu` engine, extended with rigid
barriers, slits and a sponge while leaving its original exports
untouched.

## Reference

Primary citation: Crawford, *Waves* (Berkeley Physics Course Vol. 3),
Ch. 7 (`crawford-waves`).

## Verification

- Strong invariant: slitless wall blocks transmission while a slit
  passes more than 8x the energy; the centred double slit has a
  symmetric on-axis maximum; hard walls invert the reflected pulse.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
