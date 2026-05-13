# de Broglie wavelength

A particle of rest mass $m$ and kinetic energy $T$ has a quantum wavelength $\lambda = h/p$, with the relativistic momentum $pc = \sqrt{(T+mc^2)^2 - (mc^2)^2}$. The plot shows $\lambda$ versus $T$ on a log-log axis for photon, electron, proton, neutron, and a $^{12}$C atom over a 15-decade range in kinetic energy.

Look for two regimes. Below $T \sim mc^2$ the slope is $-1/2$ (non-relativistic, $\lambda \propto T^{-1/2}$); above it the slope is $-1$ (ultra-relativistic, $\lambda \propto T^{-1}$), converging to the photon line. The atomic dashed reference at 0.1 nm is crossed by the electron near 100 eV (Davisson-Germer); the nuclear reference at 1 fm is crossed by the proton near 1 GeV.

Dropdown picks the species and slider sets $\log_{10}(T/\mathrm{eV})$. The dashed vertical marks the chosen energy; the colored dot marks $\lambda$ at that energy for the selected species.

## Reference

Primary citation: Eisberg and Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles*, 2e, Ch. 3 (`eisberg-resnick`).

## Verification

- Strong invariants: photon $\lambda = hc/E$ exact; canonical 100-eV electron 0.123 nm; thermal-neutron 0.18 nm; high-T relativistic / non-rel divergence visible.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
