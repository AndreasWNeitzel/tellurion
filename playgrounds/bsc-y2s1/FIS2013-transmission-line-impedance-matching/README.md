# Transmission line impedance matching

A coaxial line of characteristic impedance $Z_0 = 50\,\Omega$ terminated by a resistive load $Z_L$ has reflection coefficient $\Gamma = (Z_L - Z_0)/(Z_L + Z_0)$. Matched ($Z_L = Z_0$) means $\Gamma = 0$ and full power transfer; open / short give $|\Gamma| = 1$ and a pure standing wave.

Look for the envelope shape: flat at $Z_L = 50\,\Omega$, fully modulated at $Z_L = 0$ or $\to\infty$, partially modulated in between. The animated waveform inside the dashed envelope shows the forward + reflected sum sweeping past at $\omega$.

One slider for $Z_L$ in ohms.

## Reference

Primary citation: Jackson, *Classical Electrodynamics*, 3e, Ch. 8 (`jackson1998`).

## Verification

- Strong invariants: $\Gamma = 0$ at match; $|\Gamma| \to 1$ at open or short; power balance to $10^{-12}$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
