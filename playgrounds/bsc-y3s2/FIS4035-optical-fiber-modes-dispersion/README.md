# Optical Fiber: LP Modes, Dispersion and Pulse Broadening

This playground shows the guided modes of a weakly guiding step-index
fibre and how a pulse spreads as it travels. The top panel is the
universal b-V dispersion diagram: each LP mode has a normalised index
`b` that climbs from 0 at its cutoff toward 1 as the normalised
frequency `V` grows. The single-mode region `V < 2.405` is shaded. The
lower-left panel draws the `|E|^2` cross-section of the selected mode,
and the lower-right panel sweeps a Gaussian pulse along the fibre and
broadens it by group-velocity dispersion.

The thing to watch is the cutoff structure. LP01 has no cutoff: it is
guided for every `V`, which is why it is the only mode below
`V = 2.405` (the first zero of the Bessel function J0) and why telecom
fibre is run there. Push `V` past 2.405 and LP11 switches on, then
LP21 and LP02 near 3.83; the readout shows the guided-mode count
jumping. Switch the mode selector and the cross-section changes from a
single central spot (LP01) to two lobes (LP11) to a four-lobe pattern
with a dark centre (LP21), the `cos(l phi)` azimuthal structure. In the
pulse panel the Gaussian keeps its area but its width grows as
`sqrt(1 + (z/L_D)^2)`, so it is `sqrt(5)` times wider after two
dispersion lengths.

`mode` picks the highlighted dispersion curve and the cross-section.
`V-number` moves the operating point across the cutoffs (watch the
mode count). `dispersion L_D` sets how quickly the pulse broadens with
distance. Reset returns to LP01 at `V = 3.8`; Pause/Play stops or
replays the pulse sweep, and Copy URL shares the exact state. The
dispersion and cross-section panels need no motion, so the physics
reads with `prefers-reduced-motion`.

## Reference

Primary citation: `gloge1971` (Gloge, Appl. Opt. 10, 2252, 1971); see
also `snyder-love1983`, `agrawal-nfo2019`, and `abramowitz-stegun1964`
for the Bessel-function approximations.

## Verification

- Strong invariant: the LP11 single-mode cutoff equals the first zero
  of J0 (`V = 2.40483`) to within 0.1%; Gaussian broadening follows
  `T(z) = T0 sqrt(1 + (z/L_D)^2)` exactly.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
