# Bohr hydrogen energy levels and emission spectrum

A single electron orbits a proton in a Coulomb potential with quantized energies $E_n = -13.6 \, \mathrm{eV} / n^2$. Transitions $n_h \to n_\ell$ emit photons at wavelengths $1/\lambda = R_H (1/n_\ell^2 - 1/n_h^2)$, where $R_H$ is the hydrogen Rydberg constant. The Lyman series is in the UV, the Balmer series is in the visible (including H-alpha at 656.3 nm), Paschen onward is in the IR.

Look for the series structure: each series (n_low fixed) accumulates an infinite
number of lines as n_high grows, all bunching up at the series limit. The dashed
tick in the spectrum marks that limit. The rainbow strip on the wavelength axis is
the visible window; only the lowest few Balmer lines fall there, drawn in their
true colours, which is why H-alpha (red, 656 nm), H-beta and H-gamma look so
iconic. The big empty gap in the energy ladder between n = 1 and n = 2 is the
energetic Lyman jump, the reason those lines are ultraviolet.

Use the series selector and the upper-level slider: the electron drops from the
chosen level to the series floor, emitting a photon, and the matching spectral
line is highlighted. Pause freezes the transition animation and Reset restores
the Balmer series with the H-alpha transition.

## Reference

Primary citation: Carroll and Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 5 (`carroll-ostlie`).

## Verification

- Strong invariants: E_1 = -13.6 eV exact; Lyman alpha and Balmer alpha within
  Bohr-level tolerance (a few 1e-4 fractional); series wavelength ordering;
  series limits at the closed-form values.
- Live readout: photon energy from the level difference equals hc/lambda from the
  Rydberg wavelength, checked each frame in the rail.
