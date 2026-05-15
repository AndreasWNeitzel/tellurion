# Session Report: Catalog Upgrade Run 2026-05-15

## Phase 0: Catalog cleanup

Deletions (5):

* `playgrounds/bsc-y2s2/FIS2021-liouville-phase-volume-conservation` (superseded by `liouvillian-flow`)
* `playgrounds/bsc-y2s1/FIS2014-ising-triangular` (duplicate of `frustrated-triangular-af`)
* `playgrounds/bsc-y3s2/FIS3029-bloch-sphere-qubit-gates`
* `playgrounds/bsc-y3s2/FIS3029-harmonic-oscillator-coherent-state`
* `playgrounds/bsc-y3s2/FIS3029-tunneling-rectangular-barrier` (superseded by `1d-tdse-scattering-comparator`)

Deprecations (4 secondaries marked `status: deprecated` + `superseded_by`):

* `michelson-fringe-counter` -> `michelson-interferometer`
* `equipartition-from-collisions` -> `maxwell-boltzmann-emergence`
* `lorenz-attractor` -> `lorenz-attractor-3d-ensemble`
* `hydrogen-orbital-cross-sections-2d` -> `hydrogen-orbitals-3d`

The content merges (Michelson dual tab, Maxwell-Boltzmann + Equipartition dual readout, Hydrogen 2D slice toggle) were not unified; only deprecation markers were added.

## Phases 1 through 12: 12 new playgrounds

All 12 directories scaffolded and ALL have real, working playground.js implementations promoted to `status: implemented`:

* fourier-epicycle-drawing: DFT with sorted coefficients, animated epicycle chain, preset gallery, Parseval invariant
* quantum-random-walk: 1D Hadamard walk + binomial classical, side-by-side histograms, unitarity invariant
* gravity-assist-slingshot: hyperbola in planet frame + solar-frame vector addition, delta-v arrows, energy conservation invariant
* pulsar-dispersion-measure: dynamic spectrum with f^-2 sweep + per-channel shift-and-sum dedispersion, DM presets, delay-formula invariant
* gravitational-microlensing-event: Paczynski A(u) light curve + image positions theta_pm + animated lens transit
* gravitational-lensing-caustics: critical curves via det(J)=0 scan, single/binary toggle, clickable source
* stellar-oscillation-modes: real Y_l^m on visible hemisphere with diverging colormap + propagation diagram with mode-frequency line
* cosmic-ray-air-shower: Heitler binary tree to depth steps + ground detector array + Xmax marker + atmosphere gradient
* gravitational-wave-chirp-sonification: PN chirp f(t), strain panel, orbital animation, WebAudio chirp playback
* galaxy-merger-nbody: 600+600 Hernquist tracers feeling both halo potentials, halo centers as softened 2-body
* fluid-painter-lattice-boltzmann: D2Q9 192x96 LBM, bounce-back obstacles, click-drag to draw, viridis-like flow heatmap
* aperture-synthesis-uv-plane: world-map telescope positions + accumulating UV arcs + direct-sum dirty image of 3-source sky

## Phase 13: 6 engagement upgrades

Three were satisfied by creating NEW playgrounds that incorporate the upgrade idea from the start:

* Upgrade C: `cosmic-distance-ladder` (new). Click-through 4-rung journey: parallax, Cepheid P-L, Type Ia SN, Hubble flow, with cumulative error bar.
* Upgrade D: `slow-roll-inflation` (new). Ball rolls on V(phi) under Hubble friction; (n_s, r) plotted on Planck-style plane; quadratic, quartic, Starobinsky models.
* Upgrade F: `stellar-habitable-zone` (new). Planet color states (ice / liquid / steam) by equilibrium temperature; HZ band shown around the star.

Three upgrade existing playgrounds inline:

* Upgrade A: phonon-dispersion-1d-monatomic-diatomic. Animated lattice strip showing diatomic optical mode at zone boundary, m1/m2 in opposite phase with mass-inverse amplitudes.
* Upgrade B: nuclear-shell-model-magic-numbers. Add/Remove nucleon buttons with flash; magic-number flash highlights when N hits 2, 8, 20, 28, 50, 82, 126.
* Upgrade E: semi-empirical-mass-formula. Spec.md updated with planned-puzzle note; full slider-puzzle gameification not implemented in this run.

## Phase 14: Index regen

* `build-curriculum-index.mjs`: ok
* `build-landing.mjs`: 219 cards across landing + dist + docs/INDEX.md
* `build-index.mjs`: ok

## Counts

* Total playgrounds (post cleanup): 219 entries in INDEX.md
* New playgrounds added: 15 (12 from Phases 1 through 12 + 3 for Upgrades C, D, F)
* Deletions: 5
* Deprecations: 4
* Heroes unchanged: 6

## Reviewer cycle

* code-reviewer pass 1: flagged F1 (ambiguous slug resolver returning first match nondeterministically) and F2 (fourier-epicycle controls missing explicit ARIA labels).
* Both fixed: resolveSlug now collects ALL matches and errors with exit code 2 on ambiguity; controls now use explicit <label htmlFor=...> + aria-label.
* code-reviewer pass 2: both fixes confirmed clean, no regressions.

## Outstanding work for the next run

* Real CONTENT merges in the three deprecated pairs (tab UIs).
* Full SEMF puzzle gameification (Upgrade E).
* Engine reuse audit across the 12 new playgrounds: several (LBM, GW chirp, galaxy merger) currently run their math inline in playground.js rather than as shared engines in shared/js/engine/.
* Spec.md hook and one_paragraph fields are still STATUS placeholders across the catalog.
* Visual regression tests (visual.test.mjs) not yet authored for the 15 new playgrounds.
* Performance: the LBM and the dirty-image direct sum recompute every frame; both would benefit from incremental update.

## Structural issues

* `scripts/generate-playground-html.mjs` slug resolver patched twice: first to support `<prefix>-<slug>` matching for curriculum-tree dirs, then to error on ambiguous matches.
* Two playgrounds had `status: verified` despite being placeholders per the user's deletion spec; deleted anyway.
