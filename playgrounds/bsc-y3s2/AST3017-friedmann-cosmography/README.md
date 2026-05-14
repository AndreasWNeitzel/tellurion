# Friedmann cosmography

In a flat LCDM universe, the dimensionless Hubble function $E(z) = \sqrt{\Omega_m (1+z)^3 + \Omega_\Lambda}$ and the cosmic age $t(z)$ follow from the Friedmann equation. Planck 2018 defaults ($\Omega_m = 0.315$, $H_0 = 67.4$ km/s/Mpc) give $t_0 = 13.8$ Gyr.

Look for the Einstein-de Sitter case ($\Omega_m = 1$): age drops to $2/(3 H_0) \sim 9.7$ Gyr at $H_0 = 67.4$. Lambda-dominated ($\Omega_m \to 0$): age diverges. The comoving distance to $z = 1$ is also reported.

Two sliders: $\Omega_m$ and $H_0$.

## Reference

Primary citation: Liddle, *An Introduction to Modern Cosmology*, 3e, Ch. 4 (`liddle-cosmology`).

## Verification

- Strong invariants: $E(0) = 1$ exact; EdS age $= 2/(3 H_0)$; LCDM age 13.8 Gyr.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
