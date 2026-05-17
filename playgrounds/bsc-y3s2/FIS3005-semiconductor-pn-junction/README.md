# The p-n Junction

Press a p-type and an n-type semiconductor together and the carriers
near the contact diffuse across and annihilate, leaving a bare
charged layer, the depletion region, with a built-in field that bends
the energy bands. That single picture explains the diode. The left
panel is the band diagram (or the space-charge box and its triangular
field); the right is the current-voltage curve with a dot marking
where the bias slider has you.

What to look for: at zero bias nothing flows and the bands sit in
equilibrium. Pull the bias negative (reverse) and the depletion layer
visibly widens, the bands tilt harder, and the current flattens to a
tiny saturation value. Push it positive (forward) and the layer
thins, the barrier drops, and the current turns on exponentially,
the diode switching on. The width breathes as the square root of
V_bi minus V, which is why the readout W and the depletion shading
track the bias so sharply. Crank the doping sliders and watch V_bi
rise and the layer shrink.

Controls: the bias slider sweeps reverse to slightly forward; the two
doping sliders set the acceptor and donor densities (log scale); the
view selector swaps the band diagram for the charge-and-field
picture; Reset returns to a typical asymmetric silicon junction.

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
