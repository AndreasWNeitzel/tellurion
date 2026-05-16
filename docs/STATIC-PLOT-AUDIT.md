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

## Progress log (session 2026-05-16)

DONE (committed, invariants pass, captures refreshed):
- fourier-epicycle-drawing: signed DFT frequencies; presets reproduce
- kepler-equation-newton-iteration: convergence polyline + correct residual
- galaxy-merger-nbody: real collision, live dials, auto-replay
- wave-heightfield hero: click offset, damping clamp 0-0.1, perturbation shapes + standing modes
- synchrotron-spectrum: absolute frequency axis so sliders act
- transit-mandel-agol: planet/marker phase-sync + dip width
- bremsstrahlung-spectrum: electron-deflected-by-ion scene + EM wavefronts
- parallel-transport-on-sphere: animated transported vector + holonomy ghost
- galaxy-rotation-curve: dense ~8000-particle render + dark sky (arm/core balance noted follow-up)
- tiny-mlp-backprop: live network graph, 1-3 layers/<=8 neurons, +circles/+gaussians, N=360
- cosmic-ray-air-shower: animated primary entry + descending front + energy-coloured cone + lit detectors
- gravitational-wave-chirp: real 3D inspiral, barycentric Kepler orbit, spiral worldlines, GW fronts, merger flash + ringdown remnant
- relativistic-beaming: pseudo-3D shaded solid-of-revolution lobe + aberrated photon stream collimating into the 1/gamma cone
- sturm-liouville: vibrating-string instantiation, modes oscillating at omega_n=n, click-to-pluck
- parker-solar-wind: radial streaming parcels, dr/dt=u(r), Mach-coloured sonic crossing + u(r) strip
- polytrope-lane-emden: density-shaded star (cutaway wedge + isodensity), structure restructures with n, linked theta(xi) strip
- alpha-decay-gamow-tunneling: animated alpha wavefunction tunneling + nucleus emitting alphas at the Geiger-Nuttall rate
- de-broglie-wavelength: matter-wave double-slit, stochastic single-particle interference build-up, classical limit for heavy/fast
- fabry-perot-finesse: scanned cavity flashes bright on resonance, multiple-beam rays, synced Airy strip, finesse sharpening

REMAINING boring->spatial makeovers (next sessions):
- toy parton, Friedmann cosmography,
  runge-chebyshev, CKM, matter-radiation equality,
  p/g-mode cavity, slow-roll inflation
- parallel-transport: add torus + other surfaces (sphere done)
- chandrasekhar: already a particle sim (Phase 1-G), not static
