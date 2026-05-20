# Cosmology Legend

Four-mode laboratory for the universe at large. The same Omega_m and
Omega_Lambda are shared across modes; one mental model spans the
Hubble lattice, its four fates, the CMB last-scattering surface, and
the inflationary mechanism that seeded it all.

## Modes

- **Expansion**: WebGL2 comoving lattice (shared cosmic-lattice-3d
  shader) whose proper sizes scale with a(t) from the Friedmann
  equation. Pick LCDM, matter-only, closed Big Crunch, or empty
  coasting via the preset selector.
- **Fate**: a(t) curve panel with all four fates overlaid. The
  current preset is bold; t = now is marked. The single number
  Omega_Lambda sets which fate the lattice follows.
- **CMB**: 3D sphere of last scattering, tinted with a deterministic
  random temperature field at the Planck Delta T / T ~ 1e-5
  amplitude. The orbit camera rotates around the surface so you can
  inspect the anisotropies from different angles.
- **Inflation**: V(phi) curve for two slow-roll potentials
  (quadratic phi^2 and Starobinsky R^2) with the inflaton's position
  at N e-folds before the end of inflation. Right panel: (n_s, r)
  plane with both potential tracks and the Planck 2018 2-sigma box;
  phi^2 is outside (excluded), Starobinsky inside (favoured).

## What to look for

- Slide Omega_Lambda to zero and Omega_m above 1: closed universe
  recollapses to a Big Crunch.
- Slide Omega_m to 1, Omega_Lambda to 0: Einstein-de-Sitter
  matter-only universe, a ~ t^(2/3) for ever.
- Switch to CMB mode: the sphere is the surface of last scattering;
  the textured tints are the anisotropies that seeded structure.
- Switch to Inflation mode and toggle the potential: the marker
  jumps in the (n_s, r) plane between phi^2 (excluded) and
  Starobinsky (favoured).

## Source

Ryden, *Introduction to Cosmology*, 2nd ed., CUP 2017, Ch. 5 to 6
(`ryden-cosmology`); Mukhanov, *Physical Foundations of Cosmology*,
CUP 2005 (`mukhanov-cosmology`); Baumann, *Cosmology*, CUP 2022
(`baumann-cosmology`); Planck Collaboration, *A&A* 641 (2020) A6
(`planck-2018-cosmology`).
