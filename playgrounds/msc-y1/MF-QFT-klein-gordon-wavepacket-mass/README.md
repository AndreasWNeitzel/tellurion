# Klein-Gordon Wave Packet: Mass, Dispersion and the Light Cone

This playground propagates a relativistic scalar wave packet built
from Klein-Gordon modes with omega = sqrt(k^2 + m^2). The top panel
shows the probability density moving along x with the light cone
x = t drawn in, and the faint initial packet kept for comparison. The
lower-left panel is the dispersion relation with the light line and a
tangent whose slope is the group velocity; the lower-right panel
tracks the packet centroid against the light cone and its RMS width.

Set the mass to zero and the packet is dispersion-free: it keeps its
shape and its centroid rides exactly on the light cone, because every
mode travels at c. Turn the mass up and two things happen at once: the
packet slows down (its centroid stays inside the light cone, because
the group velocity p/E is always less than c) and it spreads, because
different wavelengths now travel at different speeds. The phase
velocity is faster than light, but it is the group velocity that
carries the energy and the signal, and that is always causal.

`mass m` switches between the massless light-cone packet and a massive
sub-luminal one. `momentum k0` sets the mean wavenumber and hence the
group velocity. `packet width sigma0` sets the initial spatial width
(a narrower packet spreads faster). Reset returns to m = 1.5, k0 = 2.
Pause/Play stops or replays the propagation, and Copy URL shares the
exact state. The dispersion and track panels read without motion for
`prefers-reduced-motion`.

## Reference

Primary citation: `peskin-schroeder` (the Klein-Gordon equation and
dispersion); see also `greiner-rqm`.

## Verification

- Strong invariant: omega^2 = k^2 + m^2 with v_g v_p = 1; v_g < c for
  m > 0 and = c for m = 0 (dispersion-free); the massive centroid is
  sub-luminal and the norm is conserved.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
