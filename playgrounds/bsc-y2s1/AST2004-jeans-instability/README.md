# Jeans instability

In a uniform self-gravitating medium of density $\rho$ and sound speed $c_s$, plane-wave density perturbations follow the dispersion $\omega^2 = c_s^2 k^2 - 4 \pi G \rho$. Long-wavelength modes ($k$ small) have $\omega^2 < 0$ and grow exponentially: this is gravitational instability, the seed of star formation. The crossover is at the Jeans length $\lambda_J = \sqrt{\pi c_s^2 / G \rho}$.

Look for the parabola $\omega^2(k)$. The shaded band ($k < k_J$) is the Jeans-unstable region. Increasing density shrinks $\lambda_J$, increasing temperature grows it. For a cold dense cloud ($T = 10$ K, $n = 10^3$ cm$^{-3}$) the readout shows $\lambda_J \sim 1.5$ pc and $M_J \sim 50\,M_\odot$.

Two sliders set the temperature in K and the number density as $\log_{10}(n/\text{cm}^{-3})$.

## Reference

Primary citation: Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 12 (`carroll-ostlie`).

## Verification

- Strong invariants: $\omega^2 = 0$ at $k = k_J$; $\lambda_J \propto c_s / \sqrt{\rho}$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
