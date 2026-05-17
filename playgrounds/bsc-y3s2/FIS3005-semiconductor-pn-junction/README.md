# The p-n Junction

Press a p-type and an n-type semiconductor together and the carriers
near the contact diffuse across and annihilate, leaving a bare
charged layer, the depletion region, with a built-in field that bends
the energy bands. That single picture explains the diode. The left
panel is the band diagram (or the space-charge box and its triangular
field); the right is the device itself: a p / n bar with mobile holes
and electrons, the fixed ionized dopant cores, the depletion layer of
exposed space charge in the middle, the built-in field, the applied
battery, and a small I-V inset with the operating point.

What to look for: at zero bias nothing flows and diffusion balances
drift. Pull the bias negative (reverse) and the depletion layer
visibly widens on the bar, the bands tilt harder, and the inset
current flattens to a tiny saturation value. Push it positive
(forward) and the layer thins, the battery flips to lower the
barrier, the cross-junction diffusion arrows thicken, and the inset
current turns on exponentially. The depletion always eats deeper into
the lighter-doped side (the charge balance NA x_p = ND x_n), so the
two doping sliders visibly shift the split as well as V_bi.

Controls: the bias slider sweeps reverse to slightly forward; the two
doping sliders set the acceptor and donor densities (log scale); the
view selector swaps the left panel between the band diagram and the
charge-and-field picture; Reset returns to a typical asymmetric
silicon junction.

## Reference

Primary citation: Sze and Ng, *Physics of Semiconductor Devices*
(3rd ed.), Ch. 2 (`sze-devices`); Kittel, *Introduction to Solid
State Physics* (8th ed.), Ch. 19 (`kittel-cm`).

## Verification

- Strong invariant: the ideal-diode law gives I = 0 at V = 0 and
  I0(e^4 - 1) at 4kT/q; the depletion width scales as
  sqrt(V_bi - V); the space charge balances exactly (NA x_p =
  ND x_n); the triangular-field area equals V_bi - V; and 1/C^2 is
  linear in V with the Mott-Schottky slope.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
