# Van der Waals Condensation and the Maxwell Construction

This playground shows a van der Waals fluid in reduced units,
`p = 8T/(3V-1) - 3/V^2`, as a piston-cylinder. Below the critical
temperature the cubic isotherm is non-monotonic, which is
unphysical; the real behaviour is a flat coexistence pressure fixed
by the Maxwell equal-area construction. The left scene is the
physical instantiation (piston, molecules, a rising liquid meniscus
by the lever rule); the right panel is the p-V isotherm with the
S-curve, the Maxwell line, and the binodal/spinodal envelope.

Run the default auto cycle: as the piston compresses the vapour past
the gas binodal, a liquid pool nucleates and its meniscus climbs
while the operating point parks on the flat Maxwell line and the
pressure readout sticks at `p_co`. Keep compressing and the liquid
binodal is reached, after which the pressure shoots up because the
liquid barely compresses. Raise the temperature slider through
`T/Tc = 1` and the meniscus and the Maxwell line both disappear: the
fluid is supercritical and the two phases are no longer distinct.

The temperature slider sets `T/Tc`; the volume slider scrubs `V/Vc`
manually (grabbing it leaves the auto cycle); the motion selector
switches between the auto compress-expand cycle and manual control;
Reset restores the default isotherm and Pause freezes the animation.
The readout reports temperature, volume, observed pressure, liquid
fraction, phase, and the coexistence pressure.

## Reference

Primary citation: Callen, *Thermodynamics* (2nd ed.), Sec. 3.6 and
Problem 9.4-1 (`callen`).

## Verification

- Strong invariant: Maxwell equal-area with `p(V_l) = p(V_g) = p_co`
  (threshold 1e-4); critical inflection `dp/dV = d2p/dV2 = 0` at
  `(1, 1)` within 1e-9.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
