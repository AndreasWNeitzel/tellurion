# Magnetic hysteresis and the B-H loop

A ferromagnet is divided into domains, each already magnetized but pointing in
different directions. An applied field H lines them up, but flipping a domain
takes a shove, so when the field reverses many domains stick where they were:
the magnetization M lags the field. Cycle H and M traces a closed hysteresis
loop instead of a single curve, modelled here with the Jiles-Atherton equations.
The scene shows the domains flipping with the drive field H and the response M
drawn as arrows so the lag is visible.

Look for the domains holding against the reversing field near the coercive point,
then flipping over in an avalanche. The lower plot is the loop itself: the
magnetization left at zero field is the remanence (why permanent magnets exist),
the reverse field needed to zero it is the coercivity, and the shaded area inside
is the energy lost to heat each cycle. Soft iron gives a thin loop (little loss,
for transformer cores); hard steel gives a fat one (strong permanent magnet).

Use the material selector and the drive-amplitude slider; a smaller drive gives a
minor loop nested inside the saturation loop. Pause freezes the sweep and Reset
restores hard steel at full drive.

## Reference

Primary citation: Jiles and Atherton, *J. Magn. Magn. Mater.* 61, 48 (1986);
Griffiths, *Introduction to Electrodynamics*, 4th ed., Ch. 6.

## Verification

- Strong invariants: Langevin odd and saturating; the loop is open (branches
  differ) with positive remanence and a real coercive field; hard material has a
  larger loop area than soft; loop area (energy per cycle) strictly positive.
- Live readout: |M| / M_s, the saturation bound, in the rail.
