# Michelson interferometer

A Michelson interferometer with a moving mirror produces fringes at the detector with intensity $I = \tfrac12(1 + V \cos(2\pi L / \lambda))$. The visibility $V = e^{-(L/L_c)^2}$ falls off over the temporal coherence length $L_c$, with corresponding spectral bandwidth $\Delta\nu \sim 0.44 c / L_c$.

Look for the difference between a laser-like (large $L_c$, fringes persist over the full plot) and a sunlight-like source (small $L_c$, only the central fringe).

Two sliders: wavelength $\lambda$ and $\log_{10} L_c$.

## Reference

Primary citation: Hecht, *Optics*, 5e, Ch. 9 (`hecht2017`).

## Verification

- Strong invariants: $V(0) = 1$ exact; $V(L_c) = 1/e$ exact; fringe period = $\lambda$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
