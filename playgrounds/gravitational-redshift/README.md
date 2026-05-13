# Gravitational redshift in Schwarzschild spacetime

A photon emitted at radius r_em from a Schwarzschild black hole reaches
an observer at infinity with frequency reduced by the factor
sqrt(1 - 2M / r_em). At the horizon r = 2M the photon arrives with zero
frequency (infinite redshift). Far from the hole the shift is tiny.

Look for: as r_em / 2M decreases from 20 toward 1, the redshift factor
curve drops sharply, and the observed wavelength of a green 530 nm
source stretches all the way to infrared and beyond. The Pound-Rebka
experiment measured this effect at z ~ 10^-15 using gamma rays falling
through Harvard's Jefferson Lab tower.

Use the r_em / 2M slider to set the emission radius. Speed auto-sweeps.
Reset returns to r/2M = 2.

## Reference

- Hartle, Gravity Ch. 9 (`schutz-firstcourse`).
- Carroll, Spacetime and Geometry Ch. 5.

## Verification

- Strong invariant: f_obs/f_em = sqrt(1 - 2M/r) exact; horizon factor 0;
  reciprocity; weak-field expansion.
- Visual gate: SSIM > 0.92 across 5 frames sweeping r.
- Last verified: see `.verified`.
