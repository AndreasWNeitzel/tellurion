# Paraxial Gaussian beam (TEM_00)

The fundamental laser-cavity mode propagating along z. The intensity heatmap shows the characteristic hyperbolic envelope: tightest at the waist (z = 0, w = w_0), opening up to sqrt(2) w_0 at +/- z_R, then growing linearly at far z with slope +/- theta = lambda / (pi w_0).

What to look for: increase lambda to see z_R shrink and the beam open up faster (diffraction is wavelength-proportional). Decrease w_0 to see theta increase (you cannot focus tightly without diverging fast: it's an uncertainty trade). The dashed red markers at +/- z_R are the boundary between near and far field; the yellow curves are +/- w(z).

Controls: w_0 (waist), lambda (wavelength), z range (display window).

## Reference

Siegman 1986, Lasers, Chapter 17; Hecht 2017, Optics 5e, Section 13.1.

## Verification

- Strong invariants: z_R formula, w(0) = w_0, w(z_R) = sqrt(2) w_0, far-field linear asymptote, power-through-aperture = 1 - e^{-2}.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
