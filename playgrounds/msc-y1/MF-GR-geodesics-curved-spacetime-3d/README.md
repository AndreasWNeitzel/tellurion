# Geodesics in Curved Spacetime: Schwarzschild, Kerr, FLRW

This playground traces geodesics in three spacetimes. In Schwarzschild
mode the top panel is the equatorial null-geodesic fan: a parallel
bundle of photons coming in past a black hole, integrated from the
orbit equation. The lower-left panel is the null effective potential
with the energy line, and the lower-right panel is the capture map
versus impact parameter. Kerr mode adds the ergosphere and a
frame-drag twist; FLRW mode replaces the view with the comoving
lattice and the Hubble flow.

Watch the photon-sphere whirl: a ray aimed just outside the critical
impact parameter `b_c = 3 sqrt(3) M` loops several times near `r = 3M`
and then escapes, while one just inside is swallowed, and the capture
map shows that the boundary is razor sharp at exactly `b_c`. The
effective potential makes it obvious: when the `1/b^2` line sits at
the `r = 3M` peak the photon barely clears the barrier. Switch to Kerr
and the horizon shrinks and the ergosphere appears; switch to FLRW and
every comoving galaxy recedes with `v = H0 d`, turning red and
superluminal beyond the Hubble radius (which general relativity
allows), inside a growing particle horizon.

`spacetime` selects Schwarzschild, Kerr, or FLRW. The primary slider
is the probe impact parameter (Schwarzschild/Kerr); the secondary
slider is the Kerr spin `a/M` or the FLRW matter density. Reset returns
to Schwarzschild at `b = 5.2 M`. Pause/Play stops or replays the ray
fan / cosmic-time sweep, and Copy URL shares the exact state. The
panels read without motion for `prefers-reduced-motion`. The
photorealistic ray-trace ships separately as the
`schwarzschild-kerr-blackhole-3d` hero; this is its geodesic-physics
companion (see `spec.md` for the Canvas2D rationale).

## Reference

Primary citation: `carroll-spacetime` (geodesics, black holes); see
also `shapiro-teukolsky` Ch. 12, `hubble1929`, and `friedmann1922`.

## Verification

- Strong invariant: `b_c = 3 sqrt(3) M` to 0.1%; the null first
  integral is conserved to machine precision; the Hubble law is
  exactly `v = H0 d`; the scale factor expands monotonically.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
