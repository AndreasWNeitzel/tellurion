# Single, double, and multi-slit diffraction

The far-field diffraction pattern from N identical slits of width a and
separation d under coherent illumination is the product of two factors:
the single-slit sinc^2 envelope (orange) and the N-slit array factor
[sin(N alpha)/sin(alpha)]^2 (cyan). For N = 1 only the envelope remains;
for N = 2 a cos^2 modulation appears; for N >= 3 the envelope contains
sharp principal maxima at d sin(theta) = m lambda separated by N - 2
secondary maxima.

Look for: at N = 1 the cyan curve coincides with the orange envelope.
Increasing N narrows the principal maxima and raises their peak (as N^2)
while introducing more secondary minima between them. The envelope zeros
at sin(theta) = m lambda / a suppress orders whose principal-max position
coincides with an envelope zero (missing-order condition).

Use the N slider to set the number of slits, d/a to set the ratio.
Speed runs an auto-sweep over N. Reset returns to N = 4.

## Reference

- Hecht, Optics 5e Ch. 10.

## Verification

- Strong invariant: peak I(0) = N^2; N = 1 matches sinc^2; principal
  maxima at predicted angles; envelope zeros suppress single-slit.
- Visual gate: SSIM > 0.92 across 5 frames sweeping N from 1 to 8.
- Last verified: see `.verified`.
