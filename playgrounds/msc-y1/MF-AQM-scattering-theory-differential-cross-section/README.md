# Scattering Theory: Differential Cross Section and Partial Waves

This playground builds the quantum elastic-scattering picture from the
partial-wave expansion. The top panel draws the differential cross
section as a wireframe surface of revolution about the beam axis, with
the incident plane wave on the left and the outgoing spherical wave;
an amber probe ring sweeps the polar angle. The lower-left panel shows
the partial-wave phase shifts and their `sin^2` weights for a hard
sphere, or the potential `V(r)` for the Born targets. The lower-right
panel is the polar `dsigma/dOmega(theta)` with the running probe
marker and the total cross section.

Watch how the angular pattern concentrates forward as `ka` grows: more
partial waves contribute and the diffraction peak narrows. The total
cross section read out from the partial-wave sum equals
`(4 pi / k) Im f(0)` to machine precision, which is the optical
theorem, the statement that the forward amplitude already encodes the
total scattered flux. A hard sphere is `4 pi a^2` at low energy (four
times the geometric area) and falls toward `2 pi a^2` at high energy
(the geometric cross section plus an equal shadow term). Switch to a
Yukawa or square-well target and the amplitude becomes the Fourier
transform of the potential shown alongside.

`target` chooses the hard sphere (partial waves) or a Born target.
`ka` is size times energy and sets how many partial waves matter.
`strength` is the Born potential depth. Reset returns to the hard
sphere at `ka = 3`. Pause/Play stops or resumes the angle probe, and
Copy URL shares the exact state. The surface and pattern read without
motion for `prefers-reduced-motion`. The 3D surface is a plain
Canvas2D depth-shaded wireframe (no WebGL); see `spec.md`.

## Reference

Primary citation: `taylor-scattering1972` (partial waves and the
optical theorem); see also `sakurai2020` Ch. 6 and `griffithsqm2018`
Ch. 11.

## Verification

- Strong invariant: the optical theorem (`sigma_tot = (4 pi/k) Im
  f(0)`, also the `|f|^2` integral) holds to 0.1%; the hard sphere
  tends to `4 pi a^2` then `2 pi a^2`; the Born amplitude equals the
  analytic Fourier transform.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
