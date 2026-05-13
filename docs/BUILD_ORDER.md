# Build order

Ship two anchor pieces first, then build engines that seed multiple playgrounds, then the headliners. See the playground catalog in the project's research report for the full justification.

## Phase 1 (weeks 1-2): aesthetic baseline and infrastructure validation

| order | playground | books | engine | invariant gate | reason to lead |
|-------|------------|-------|--------|----------------|----------------|
| 1 | `logistic-cobweb` | Strogatz Ch. 10 | none (pure iteration) | Feigenbaum delta within 0.1 percent at zoom level 5 | small, fast, exercises rendering stack |
| 2 | `double-pendulum` | Newman Ex. 8.13 | `shared/js/engine/symplectic.js` | dE/E < 1e-3 over 10^4 dt | validates symplectic engine and phase-portrait rendering |

Definition of done for Phase 1: token system locked, drag handle and knob primitives shipped, KaTeX integration confirmed, Playwright capture pipeline producing deterministic frames, two playgrounds passing all four gates.

## Phase 2 (weeks 3-5): MCMC and optimization harnesses

Build `shared/js/engine/mcmc-harness.js` and `shared/js/engine/optimizer-harness.js`. Each ships with a plug-in registry for proposals or step rules.

| order | playground | books | engine | gates |
|-------|------------|-------|--------|-------|
| 3 | `mcmc-comparator` | MacKay Ch. 29-30, Bishop-Bishop Ch. 14, Robert-Casella, Gelman BDA3 | mcmc-harness | KL to analytic banana < 0.05 |
| 4 | `optimization-landscape` | Boyd Ch. 9, Goodfellow Ch. 8 | optimizer-harness | Newton quadratic convergence on quadratic test |

## Phase 3 (weeks 5-8): field-equation engines

Build `shared/js/engine/fd-grid.js` (regular grid finite difference, supports diffusion, advection, KdV, Schrodinger, Allen-Cahn) and `shared/js/engine/yee-fdtd.js` (2D TM Yee with PML and TF/SF source).

| order | playground | books | engine | gates |
|-------|------------|-------|--------|-------|
| 5 | `schrodinger-1d` | Newman Ex. 9.8, Griffiths QM Ch. 2 | fd-grid | norm conserved to 1e-10 per step |
| 6 | `advection-burgers-kdv` | LeVeque Ch. 9-11, Trefethen Program 27 | fd-grid | total variation non-increase on monotone limiter |
| 7 | `slit-grating-diffraction` | Newman Ex. 5.13, Taflove Ch. 3-4 | yee-fdtd | EM energy conserved to 1 percent in PML-masked region |
| 8 | `photonic-band` | Taflove + Joannopoulos | yee-fdtd (extended Bloch BC) | band gap within 5 percent of plane-wave reference |

## Phase 4 (weeks 8-12): N-body and astrophysics

Build `shared/js/engine/barnes-hut.js` (quadtree O(N log N) gravity) and a galaxy rotation curve module.

| order | playground | books | engine | gates |
|-------|------------|-------|--------|-------|
| 9 | `barnes-hut-nbody` | Binney-Tremaine 2.9, Aarseth Ch. 7, Hockney-Eastwood | barnes-hut | dE/E < 1e-3, dL/L below machine precision modulo softening |
| 10 | `rotation-curve-explorer` | Binney-Tremaine Ch. 2 | none (analytic profiles) | NGC 3198 fit within 5 percent of published decomposition |

## Phase 5 (weeks 12-16): GR and ML headliners

| order | playground | books | engine | gates |
|-------|------------|-------|--------|-------|
| 11 | `schwarzschild-geodesics` | Hartle Ch. 9, Carroll Ch. 5 | symplectic (extended with effective potential) | photon sphere b_crit = 3 sqrt 3 M within 0.1 percent |
| 12 | `nn-decision-boundary` | Bishop-Bishop Ch. 6-7, HTF Ch. 11 | mlp-trainer | seeded run matches reference within SSIM 0.95 on final boundary |
| 13 | `normalizing-flow-2d` | Bishop-Bishop Ch. 18, Murphy Vol. 2 Ch. 23 | new: flow-trainer | change-of-variables mass conservation verified per training step |

## Phase 6 (weeks 16-20): the Ising / RG flagship

Build `shared/js/engine/lattice-mc.js` (Wolff + Metropolis + Swendsen-Wang + Wang-Landau).

| order | playground | books | engine | gates |
|-------|------------|-------|--------|-------|
| 14 | `ising-2d-wolff` | Newman-Barkema Ch. 3-4, Krauth Ch. 5 | lattice-mc | nu approx 1, beta approx 1/8 from finite-size scaling |
| 15 | `rg-flow-ising` | extends 14 | lattice-mc + block-spin | recovers Tc and critical exponents within 3 percent |

## Engine reuse map

| engine | seeds playgrounds |
|--------|-------------------|
| symplectic | double-pendulum, barnes-hut-nbody, schwarzschild-geodesics |
| fd-grid | schrodinger-1d, advection-burgers-kdv, heat, allen-cahn |
| yee-fdtd | slit-grating-diffraction, photonic-band, mie-scattering |
| mcmc-harness | mcmc-comparator, bayesian-shrinkage, hmc-on-funnel |
| optimizer-harness | optimization-landscape, nn-decision-boundary (uses subset) |
| barnes-hut | barnes-hut-nbody, cluster-cold-collapse, plummer-relaxation |
| lattice-mc | ising-2d-wolff, rg-flow-ising, percolation, q-state-potts |
| mlp-trainer | nn-decision-boundary, manifold-evolution, normalizing-flow-2d |

## Stretch playgrounds beyond Phase 6

- `lyapunov-spectrum`: Henon and standard map, Benettin QR algorithm.
- `pca-vs-umap-vs-tsne`: side-by-side manifold unfolding on Swiss roll and S-curve.
- `gaussian-process-regression`: interactive kernel selection with credible bands.
- `hmc-vs-mh-on-banana`: instructional sampler comparison.
- `tov-neutron-star`: polytrope mass-radius curve with general-relativistic correction toggle.
- `liouvillian-flow`: phase-space density evolution for a 1D oscillator, visualizing conservation of phase volume.

Ship 12 to 18 of these in six months. Six well-built playgrounds beat fifteen rushed ones.
