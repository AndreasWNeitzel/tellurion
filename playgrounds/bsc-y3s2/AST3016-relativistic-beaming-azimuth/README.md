# Relativistic beaming pattern

A source emitting isotropically in its rest frame looks like a focused headlight when boosted. Move the gamma slider from 1 (rest) to 20 (ultra-relativistic) and watch the polar plot collapse from a circle to a narrow forward cone. The forward intensity scales as D^{3+alpha}; the back-lobe scales as the inverse. This is how blazars work.

What to look for: at gamma = 5, alpha = 0, the front/back intensity ratio is already ~ 1e4. The yellow arrow shows the velocity direction; the bright lobe is along it. Pushing alpha up sharpens the beam.

Controls: gamma (Lorentz factor), alpha (spectral index).

## Reference

Rybicki and Lightman 1979, Radiative Processes in Astrophysics, Section 4.8.

## Verification

- Strong invariants: closed-form Doppler at theta = 0 and pi, beam half-angle ~ 1/gamma at high gamma, I(0)/I(pi) = ((1+beta)/(1-beta))^3.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
