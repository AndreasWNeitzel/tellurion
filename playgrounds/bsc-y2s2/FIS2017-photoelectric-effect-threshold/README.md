# Photoelectric effect: $KE_{max}$ vs photon frequency

A monochromatic beam at frequency $\nu$ ejects electrons from a metal cathode with maximum kinetic energy $KE_{max} = h\nu - \phi$, where $\phi$ is the metal's work function. Below the threshold $\nu_0 = \phi/h$ no electrons are ejected, regardless of light intensity; this is the central quantum signature that classical wave theory cannot explain.

Look for the eight parallel lines, one per metal, with shared slope $h$ (the universal Planck constant) and metal-specific x-intercepts $\nu_0$. Cesium (lowest $\phi = 2.14$ eV) responds to red-visible light; platinum ($\phi = 6.35$ eV) needs deep UV. The highlighted metal's current $KE_{max}$ at the chosen frequency is shown as a colored dot on the dashed vertical marker.

Drop-down picks the metal; slider sets the photon frequency in PHz. Both are independent controls; the dot tracks both.

## Reference

Primary citation: Eisberg and Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles*, 2e, Ch. 2 (`eisberg-resnick`).

## Verification

- Strong invariant: sharp threshold at $\nu_0$; slope identically $h$.
- Energy conservation $KE_{max} + \phi = h\nu$ verified to $10^{-12}$ relative.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
