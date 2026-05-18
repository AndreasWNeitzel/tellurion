# Gravitational-Wave Detector: Inspiral Chirp and Matched Filter

This playground follows a compact binary from inspiral to merger and
shows how a LIGO-type interferometer hears it. The top panel is the
L-shaped Michelson interferometer: a laser, a beamsplitter, and two
4 km arms whose lengths the passing wave stretches and squeezes by
h L / 2. The lower-left panel is the chirp strain h(t) building to
merger; the lower-right panel is the matched-filter SNR, the
correlation of the noisy data with a template.

Watch the chirp: as the black holes spiral in, the gravitational-wave
frequency and amplitude both climb, ending in the characteristic sweep
to a few hundred hertz at merger (the audible "whoop" of GW150914).
The arm displacement is around 2e-18 metres, a thousandth of the
diameter of a proton, which is why the schematic magnifies it
enormously while the readout shows the true value. The matched filter
turns that buried wiggle into a sharp spike at the moment of
coalescence, and the chirp mass it reads back from the rising frequency
matches the true value to better than 0.1%.

`m1` and `m2` set the component masses (hence the chirp mass and how
fast it sweeps); `distance` sets how far away the merger is, with the
strain falling as 1/distance. Reset returns to a 30 + 30 solar-mass
binary at 400 Mpc (a GW150914-like event). Pause/Play stops or replays
the inspiral, and Copy URL shares the exact state. The panels read
without motion for `prefers-reduced-motion`.

## Reference

Primary citation: `peters1964` (the quadrupole inspiral and chirp);
see also `maggiore-gw` and `abbott-gw150914-2016`.

## Verification

- Strong invariant: the chirp mass is recovered from `(f, df/dt)` to
  better than 0.1%; the strain is `~1e-21` for `30+30 Msun` at
  `400 Mpc` and scales as `1/D`; the matched filter peaks at zero lag
  for the correct template.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
