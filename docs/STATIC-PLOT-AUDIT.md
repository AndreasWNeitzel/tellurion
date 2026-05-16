# Static-Plot Audit

Playgrounds heuristically flagged as static-plot-plus-slider (score >= 3).
Higher score = more likely a boring plot needing a spatial/animated makeover.
Generated: 2026-05-16
Flagged: 6

- [4] `bsc-y1s1/CC1017-floating-point-precision-pitfalls`  Floating-Point Precision Pitfalls  (spec plot-only, <=1 slider, axes, no object loop)
- [4] `bsc-y1s1/FIS1013-catenary-hanging-chain`  "Catenary: Shape of a Hanging Chain"  (spec plot-only, <=1 slider, axes, no object loop)
- [4] `bsc-y2s1/AST2004-transit-mandel-agol-analytic`  Mandel-Agol Analytic Transit  (spec plot-only, <=1 slider, axes, no object loop)
- [4] `bsc-y3s2/FIS3030-nuclear-beta-decay-fermi-vs-gt`  Beta Decay - Fermi vs Gamow-Teller  (spec plot-only, <=1 slider, axes, no object loop)
- [4] `msc-y1/MAA-CS-matter-radiation-equality`  Matter-Radiation Equality  (spec plot-only, <=1 slider, axes, no object loop)
- [3] `bsc-y1s1/CC1017-big-o-empirical`  Big-O Empirical Scaling  (spec plot-only, <=1 slider)

## User-identified worklist (authoritative; not caught by the heuristic)

Broken (fix first):
- fourier-epicycle-drawing: does not reproduce presets
- kepler-equation Newton iteration: broken
- galaxy-merger-nbody: galaxies do not collide; dials inert
- synchrotron-spectrum: sliders broken
- wave-heightfield hero: click offset, damping range, missing gaussian-width

Boring static plot, need spatial/animated makeover:
- toy parton distribution
- Friedmann cosmography
- Gamow tunneling
- Fabry-Perot
- Runge vs Chebyshev
- de Broglie wavelength
- CKM matrix
- matter-radiation equality
- Lane-Emden
- Sturm-Liouville eigenfunctions
- bremsstrahlung
- Parker solar wind
- p/g-mode cavity diagram
- chandrasekhar-dynamical-friction
- parallel-transport-on-sphere (add animation + torus/other shapes)
- slow-roll-inflation (add real visual)
- relativistic-beaming-pattern (3D shader)
- gravitational-wave-chirp (3D inspiral that actually merges)

Targeted enhancements:
- cosmic-ray-shower: streaming incoming-particle animation
- galaxy-rotation-curve: promote to hero, dense spiral-arm particle render
- tiny-mlp-backprop: more examples + more points; clamp hidden layers 1-3, neurons<=8
