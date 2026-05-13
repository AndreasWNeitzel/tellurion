# Stellar aberration

A moving observer sees star positions pulled toward the forward direction by the Lorentz aberration formula. For Earth's annual orbital motion ($\beta \approx 10^{-4}$), the maximum shift is $\sim 20.5"$ at $\theta = \pi/2$; this is the constant of aberration measured by Bradley in 1729.

Look for two effects as you increase $\beta$: the maximum shift grows, and the entire celestial sphere starts to crowd into the forward direction. At $\beta = 0.99$ nearly every cyan dot has an orange counterpart on the forward axis.

One slider: $\log_{10}\beta$.

## Reference

Primary citation: Jackson, *Classical Electrodynamics*, 3e, Ch. 11 (`jackson1998`).

## Verification

- Strong invariants: forward/backward fixed; Earth annual aberration $20.5"$ exact; inverse round-trip within $10^{-12}$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
