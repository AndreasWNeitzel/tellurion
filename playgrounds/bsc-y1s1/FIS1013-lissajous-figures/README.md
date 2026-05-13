# Lissajous figures

Two perpendicular harmonic oscillations traced together produce a Lissajous
figure: x(t) = sin(a t + delta), y(t) = sin(b t). The shape depends only
on the ratio a / b and the phase delta. For rational a / b the curve closes
after time T = 2 pi / gcd(a, b); for irrational ratios the trajectory
never closes and densely fills a square box.

Look for: the 1:1 preset traces a circle (delta = pi / 2) or a line
(delta = 0). The 1:2 preset traces a figure-eight; 2:3 a 6-lobed bowtie;
3:5 and 5:7 progressively denser quasi-grids. Sliding the phase delta
smoothly deforms each figure. With non-integer or irrational ratios the
curve "fills in" rather than closing.

Use the six preset buttons for canonical ratios. Sliders set a, b, delta
directly. Speed controls pen velocity. Reset clears the trail and restarts
at t = 0.

## Reference

- Crawford, Waves and Oscillations, Berkeley Physics Vol. 3 Ch. 1
  (`crawford-waves`).

## Verification

- Strong invariant: integer-ratio closure to 1e-10; circle identity at 1:1
  delta = pi / 2 to 1e-12.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
