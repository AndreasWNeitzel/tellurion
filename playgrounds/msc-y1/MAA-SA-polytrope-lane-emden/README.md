# Lane-Emden polytrope

A polytropic star with EOS $P = K \rho^{1+1/n}$ has a dimensionless density profile $\theta(\xi)$ satisfying the Lane-Emden equation $\theta'' + (2/\xi)\theta' + \theta^n = 0$. The first zero $\xi_1$ marks the stellar surface. Five indices are shown; $n = 0, 1, 5$ are closed form; $n = 3/2$ (brown dwarfs, low-mass MS) and $n = 3$ (Chandrasekhar-mass WD) require numerical RK4.

Look for the $n = 5$ curve: it never crosses zero (infinite radius); the rest do. The classic $\xi_1 = \sqrt{6}$ for $n = 0$ and $\xi_1 = \pi$ for $n = 1$ pop out immediately.

One dropdown selects the polytropic index.

## Reference

Primary citation: Hansen-Kawaler-Trimble, *Stellar Interiors*, 2e, Ch. 7 (`hansen-kawaler`).

## Verification

- Strong invariants: known $\xi_1$ values for $n = 0, 1, 1.5, 3$ within 1 percent; closed-form $n = 5$ exact to machine precision.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
