# Airy diffraction pattern from a circular aperture

Shine a clean plane wave at a round hole, look at the screen far behind it: you do not get a sharp disc but a bright central spot surrounded by faint concentric rings. The Airy pattern is the resolution-limiting form for every round-pupil instrument. Intensity I(theta)/I_0 = (2 J_1(x)/x)^2 where J_1 is the first Bessel function.

What to look for: the central bright disc carries 83.8 percent of the total power. The first dark ring sits at x = 3.8317, which is the Rayleigh criterion theta_1 = 1.22 lambda/D. Drag the gamma slider down to see the very faint outer rings; the heatmap saturates at the central peak otherwise.

Controls: x_max sets the radial extent of the displayed field. Gamma controls the displayed brightness of the dim outer rings. Quick-zoom buttons jump to a tight or wide view.

## Reference

Hecht 2017, Optics, 5e, Section 10.2.5; Born and Wolf 1999, Principles of Optics, 7e, Section 8.6.2.

## Verification

- Strong invariants: J_1 matches A&S tables, J_1 zeros at canonical values, I(0) = 1, central disc encloses 83.8 percent of power.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
