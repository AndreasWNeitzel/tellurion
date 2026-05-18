# Spontaneous Symmetry Breaking: the Mexican-Hat Potential

This playground is the wine-bottle potential of a complex scalar
field. The top panel is the potential as a pseudo-3D surface; the
lower-left panel is its radial slice (a double well) with a ball and
the Higgs and Goldstone directions labelled; the lower-right panel is
the order parameter versus temperature.

The symmetric point at the centre is a hilltop, not a valley, so the
field rolls down and settles somewhere on the circular brim, picking a
phase out of nowhere: that is spontaneous symmetry breaking. Wobbling
in and out of the brim costs energy (the Higgs boson, with mass
sqrt(2) times mu), but sliding around the brim costs nothing at all
(the massless Goldstone boson, Goldstone's theorem made visible). Heat
the system and a thermal mass fills in the dip; at the critical
temperature the brim collapses to the centre and the symmetry is
restored, with the order parameter vanishing as the square root of the
distance to T_c, the signature of a second-order phase transition.

`mu^2` sets how tachyonic the origin is (deeper hat, heavier Higgs).
`lambda` is the quartic coupling (a larger value pulls the brim in,
v ~ 1/sqrt(lambda)). `view` switches between rolling to the brim
(breaking the symmetry) and heating up (restoring it). Reset returns
to mu^2 = 2, lambda = 0.5. Pause/Play stops or replays the sweep, and
Copy URL shares the exact state. The slice and order-parameter panels
read without motion for `prefers-reduced-motion`. The 3D surface is a
Canvas2D wireframe (no WebGL); see `spec.md`.

## Reference

Primary citation: `higgs1964` (the radial mode); see also
`goldstone1961` (the massless mode) and `peskin-schroeder` Ch. 11.

## Verification

- Strong invariant: the vacuum is v = sqrt(mu^2/2 lambda) to 0.1%;
  m_H = sqrt(2) mu with a massless Goldstone; the symmetry is restored
  at T_c with v ~ sqrt(T_c - T).
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
