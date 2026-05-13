# Bohr hydrogen energy levels and emission spectrum

A single electron orbits a proton in a Coulomb potential with quantized energies $E_n = -13.6 \, \mathrm{eV} / n^2$. Transitions $n_h \to n_\ell$ emit photons at wavelengths $1/\lambda = R_H (1/n_\ell^2 - 1/n_h^2)$, where $R_H$ is the hydrogen Rydberg constant. The Lyman series is in the UV, the Balmer series is in the visible (including H-alpha at 656.3 nm), Paschen onward is in the IR.

Look for the series structure: each series ($n_\ell$ fixed) accumulates an infinite number of lines as $n_h \to \infty$, all bunching up at the series limit $\lambda \to n_\ell^2 / R_H$. The dashed line in the spectrum marks that limit. The shaded blue band on the wavelength axis is the visible window; only the lowest few Balmer lines fall there, which is why H-alpha, H-beta, H-gamma look so iconic.

Sliders set the series filter, the maximum quantum number $n_{max}$, and which transition is highlighted. The energy ladder on the left shows the levels with the filtered transition arrows; the right panel shows the corresponding emission lines color-coded by series.

## Reference

Primary citation: Carroll and Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 5 (`carroll-ostlie`).

## Verification

- Strong invariant: $E_1 = -13.6$ eV exact; Lyman alpha and Balmer alpha within Bohr-level tolerance (a few 1e-4 fractional).
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
