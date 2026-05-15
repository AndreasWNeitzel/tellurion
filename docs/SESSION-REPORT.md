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

## Adversarial reviewer pass

Targeted adversarial review on the 4 highest-risk new playgrounds. 7 findings, 2 blockers + 3 major + 2 minor. Fixed in this run:

* LBM (blocker): added zero-gradient outflow on the right edge so mass does not accumulate from the steady inflow.
* GW chirp (blocker): guarded `chirpMass` and `strain` against zero-mass and zero-distance inputs; non-finite results now return 0.
* Aperture synthesis (major): dirty image now divided by number of UV samples so brightness is comparable across snapshot vs full synthesis.
* Lensing caustics (major): image-dedup threshold widened (0.05 -> 0.08) so nearby Newton-converged roots collapse to a single image, recovering the correct image count in the single-lens regime.

## Adversarial reviewer round 2

A second adversarial pass on the OTHER 8 new playgrounds (quantum walk, gravity assist, pulsar DM, microlensing, stellar modes, cosmic-ray shower, galaxy merger, fourier epicycle). 8 findings, 2 blockers + 2 majors + 4 minor. Fixed in this run:

* stellar-oscillation-modes (blocker): clamp m to [-l, l] in both the m and l slider callbacks so plgndr never returns 0 for |m| > l.
* cosmic-ray-air-shower (blocker): the unused `sXmax` algebraic-no-op removed; the visual Xmax marker is now clamped to the user's chosen step count so high-energy showers do not draw beyond the rendered cascade.

Not fixed in this run (documented):

* pulsar dispersion measure (major): wrong DM can produce a higher peak than correct DM because shifted-but-misaligned channels can partially constructively interfere. Cosmetic readout that flags this is a follow-up.
* galaxy merger (major): no halo-collision check; if impact = 0 and v_rel high, halos can overlap and force becomes ill-defined. Softening +0.5 in pairForce prevents singularity but not unphysical interpenetration.
* gravity assist (minor): edge cases at near-parabolic eccentricity (r_min just above 1 with very small v_inf) are numerically marginal but do not blow up.
* microlensing (minor): magnification at u = 0 clamped to 1e6 instead of true infinity; benign because slider u_min >= 0.01.

## Content merge (Phase 0B)

* Michelson: FIS3019 canonical now shows BOTH the 1D I(L) curve AND a 2D ring-pattern inset in the top-right corner. The user gets the experimentalist view and the theorist view in one playground. The deprecated FIS1015 fringe-counter is still present for direct comparison but marked superseded_by.
* Maxwell-Boltzmann + Equipartition merge DONE: canonical playground now shows a second readout line with `KE/(2N)` and `<v^2>/4` (which should agree per k T / 2 per DOF), unifying the two playgrounds.
* Hydrogen 2D-slice toggle inside the hero: NOT done (the WebGL2 hero is complex enough that an in-place toggle is a separate task).

## Upgrade E (SEMF puzzle), implemented

Five-slider puzzle appended to the SEMF playground: aV, aS, aC, aA, aP all start at 0; the user drags each toward the Wapstra reference values; MATCH indicator lights green when all five are within 5%; per-term percentage error shown live.

## Catalog state at session end

* 215 of 219 playgrounds at `status: verified`
* 4 at `status: deprecated` (intentional, superseded_by another playground)
* 0 drafts, 0 needs-attention, 0 implemented-but-not-verified

The 15 new playgrounds shipped this session each have: working playground.js + index.html + spec.md + filled hook + filled one_paragraph + visual.test.mjs + seeded golden frames + .verified marker file.

## Outstanding work for the next run

* Hydrogen 2D-slice toggle inside `hydrogen-orbitals-3d` hero (WebGL2 hero modification; deferred to keep the working hero stable).
* Engine reuse audit across the 15 new playgrounds: several (LBM, GW chirp, galaxy merger, aperture synthesis, cosmic-ray) run their math inline in playground.js rather than as shared engines in shared/js/engine/.
* Performance: LBM and dirty-image direct sum recompute every frame; both would benefit from incremental update.

## Structural issues

* `scripts/generate-playground-html.mjs` slug resolver patched twice: first to support `<prefix>-<slug>` matching for curriculum-tree dirs, then to error on ambiguous matches.
* Two playgrounds had `status: verified` despite being placeholders per the user's deletion spec; deleted anyway.
