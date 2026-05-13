# Matter, radiation, and dark energy

The three components of the cosmological energy density evolve very differently with the scale factor: matter dilutes as $a^{-3}$, radiation as $a^{-4}$, and the cosmological constant stays flat. The crossover from radiation-dominated to matter-dominated universe happens at $a_\text{eq} = \Omega_r / \Omega_m$, with $z_\text{eq} \approx 3410$ for standard LCDM.

Look for the three slopes on the log-log plot: steepest blue (radiation, slope $-4$), middle yellow (matter, $-3$), flat orange (Lambda). The dashed red vertical is $a_\text{eq}$; the dotted white vertical is today. Reduce $\Omega_r$ to shift the radiation curve down and push $a_\text{eq}$ leftward.

Two sliders set $\Omega_m$ and $\Omega_r$. $\Omega_\Lambda$ is set automatically to keep the universe flat.

## Reference

Primary citation: Liddle, *An Introduction to Modern Cosmology*, 3e, Ch. 4 (`liddle-cosmology`).

## Verification

- Strong invariants: $\rho_m/\rho_r = a/a_\text{eq}$ exact; today's $H/H_0 = 1$ for any flat universe within $10^{-12}$.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
