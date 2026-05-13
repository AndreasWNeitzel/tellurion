# Thin-film interference and iridescent colors

A thin film of refractive index n on a substrate of n = 1.5 (glass) under
normal-incidence white light. Reflections from the top and bottom of the
film interfere; for each wavelength, the result depends on the round-trip
phase delta = 4 pi n d / lambda. Constructive maxima sit at
lambda = 2 n d / m (low-high-high case), giving wavelength-selective
reflection.

Look for: the top panel shows R(lambda) for the current thickness d. The
bottom-left swatch shows what color a viewer would perceive (integrated
over the visible spectrum). The right strip records the swatch as d
sweeps, giving the rainbow band you see on oil slicks, soap bubbles, and
some butterfly wings.

Use the d slider for thickness, n_film for refractive index. Speed
controls the auto-sweep; set 0 to lock on the slider.

## Reference

- Hecht, Optics 5e Ch. 9.

## Verification

- Strong invariant: R in [0,1]; constructive maxima at predicted lambda;
  zero-thickness limit; periodicity in d.
- Visual gate: SSIM > 0.92 across 5 frames spanning a d sweep.
- Last verified: see `.verified`.
