# Slit Experiment Legend

One playground replaces four. The slit-experiment legend covers the
full slit-and-screen family in a single canvas with mode tabs.

## Four modes

- **Wave field**: continuous Fraunhofer intensity, green wavefronts
  emanate from each slit, screen lights up in the source wavelength.
- **Particle accumulator**: one photon (or electron) at a time builds
  up the same Fraunhofer pattern as a histogram on the screen, with
  the analytic curve overlaid.
- **Grating**: N goes to 5+; principal maxima sharpen into the bright
  lines of a diffraction grating.
- **Davisson-Germer**: replaces the slit mask with a nickel (111)
  lattice ($d = 2.15\,\mathrm{\AA}$); electron beam at chosen energy
  gives Bragg-scattered peaks; 54 eV reproduces the 1927 result.

## Controls

- Mode dropdown (4 modes above).
- $N$ slits (1 to 10).
- Slit width $a$ (0.2 to 20 microns).
- Slit pitch $d$ (2 to 50 microns).
- Particle type (photon or electron).
- Wavelength (50 to 800 nm) for photons.
- Electron kinetic energy (10 to 500 eV); de Broglie computes
  $\lambda = h / \sqrt{2 m_e E}$.
- Particle rate for the accumulator mode.

## Source

Hecht, *Optics*, 5th ed., Pearson 2017, Chapter 10 (single slit,
double slit, grating). Tonomura et al., *Am. J. Phys.* 57 (1989) 117
(single-electron biprism). Davisson and Germer, *Nature* 119 (1927)
558. The four playgrounds this legend replaces, marked `status:
superseded`:

- `_heroes/double-slit-single-photon-accumulator-3d`
- `bsc-y2s2/FIS2003-quantum-double-slit-accumulator`
- `bsc-y2s1/FIS2016-single-double-multi-slit`
- `bsc-y2s2/FIS2017-davisson-germer-diffraction`
