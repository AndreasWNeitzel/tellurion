# The 2D Ising Phase Transition

This is the canonical model of a continuous phase transition: a grid
of spins that each want to align with their neighbours, fighting
thermal noise. The lattice is updated by the Metropolis rule in
checkerboard order (the shared, separately tested Monte Carlo
engine). The right panel draws the exact Onsager magnetization curve;
the red dot is what this finite lattice actually measures, and the
faint trail is the history of measurements as you move the
temperature.

What to look for: start hot and the lattice is an incoherent fizz,
magnetization near zero. Drag the temperature down. Nothing dramatic
until you approach Tc (the dashed gold line, 2.269), where suddenly
clusters of every size appear and the pattern churns slowly: this is
critical slowing down, the relaxation time diverging. Push below Tc
and the symmetry breaks, one colour wins, domains coarsen and the
measured point climbs onto the steep Onsager curve. The exponent on
that curve is 1/8, which is why the magnetization switches on so
abruptly.

Controls: the temperature slider quenches or anneals the current
lattice in place (so you see domains coarsen or melt); sweeps per
frame trades speed for smoothness; start chooses a hot random or cold
aligned initial state; Reset returns to a hot lattice and Pause
freezes it. The chi readout is the susceptibility from magnetization
fluctuations and it spikes as you cross Tc.

## Reference

Primary citation: Onsager, *Physical Review* 65, 117 (1944)
(`onsager1944`); Newman and Barkema, *Monte Carlo Methods in
Statistical Physics*, Ch. 3 (`newman-barkema`).

## Verification

- Strong invariant: the Onsager critical temperature is exact to
  0.5 percent and 1e-9; the measured magnetization below Tc tracks
  the exact Onsager curve within statistical tolerance; |M| saturates
  to 1 with E/spin to -2J as T to 0; the susceptibility peaks at Tc;
  the order-parameter exponent is beta = 1/8. The Metropolis engine
  is gate-tested in tests/engines/lattice-mc.test.mjs.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
