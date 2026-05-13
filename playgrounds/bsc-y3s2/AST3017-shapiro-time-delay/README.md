# Shapiro time delay

A light signal passing close to a massive body experiences a time delay
relative to flat-space propagation. The leading-order PPN expression is
delta t = 2M ln(4 r_E r_R / b^2) where r_E, r_R are distances from
emitter and receiver to the mass, and b is the impact parameter. This
test of GR was famously confirmed by Cassini in 2003 grazing the Sun on
its way to Saturn.

Look for: the top panel shows the ray geometry (Sun = yellow, signal =
cyan with arrow, emitter and receiver = white). The bottom panel plots
delay vs b. Drag the b slider toward 1M and the delay grows
logarithmically; at b = 100M the extra delay is small.

Use the b/M slider for impact parameter and r for emitter/receiver
distance. Speed auto-sweeps b. Reset returns b = 20.

## Reference

- Schutz, A First Course in GR 2e Ch. 11 (`schutz-firstcourse`).
- Bertotti, Iess, Tortora 2003 Nature.

## Verification

- Strong invariant: leading-order vs full formula agreement at b << r;
  linear in M; logarithmic in r.
- Visual gate: SSIM > 0.92 across 5 frames sweeping b.
- Last verified: see `.verified`.
