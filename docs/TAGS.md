# Controlled tag vocabulary

Each playground's spec.md frontmatter `tags` list must draw from exactly these 24 strings.

## Topic tags (17)

- mechanics
- waves
- optics
- electromagnetism
- thermodynamics
- statistical-physics
- quantum
- atomic-molecular
- nuclear-particle
- solid-state
- fluids-mhd
- relativity
- cosmology
- stellar
- galactic
- exoplanets
- numerics

## Style tags (7)

- interactive-drag
- click-seed
- live-readout
- multi-panel
- log-scale
- animation
- toggle-choices

## Usage

Tags are listed under `tags:` in spec.md frontmatter as a YAML list. Mix freely: a transit playground might be `[exoplanets, optics, live-readout, animation]`. A grating playground might be `[optics, log-scale, multi-panel]`.

Tags are not curriculum-aware; that role is played by `primary_uc` and `curriculum_year`.
