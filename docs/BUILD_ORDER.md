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
| symplectic | double-pendulum, barnes-hut-nbody, schwarzschild-geodesics, lagrange-points-cr3bp, mercury-precession-pn, schwarzschild-photon-sphere |
| fd-grid | schrodinger-1d, advection-burgers-kdv, heat, allen-cahn, 1d-tdse-scattering-comparator, advection-scheme-shootout |
| yee-fdtd | slit-grating-diffraction, photonic-band, mie-scattering |
| mcmc-harness | mcmc-comparator, bayesian-shrinkage, hmc-on-funnel |
| optimizer-harness | optimization-landscape, nn-decision-boundary (uses subset), maxent-distribution-zoo, tsne-vs-umap-vs-isomap, mean-field-vi-on-banana, em-on-gmm-2d |
| barnes-hut | barnes-hut-nbody, cluster-cold-collapse, plummer-relaxation |
| lattice-mc | ising-2d-wolff, rg-flow-ising, percolation, q-state-potts, ising-triangular, potts-q-state-transition, xy-model-bkt, frustrated-triangular-af, percolation-2d |
| mlp-trainer | nn-decision-boundary, manifold-evolution, normalizing-flow-2d, backprop-tiny-net |
| ode-rk (new) | lorenz-attractor, rossler-funnel, duffing-oscillator, wkb-vs-shooting |
| billiards (new) | billiards-circle-stadium-sinai |
| particle-mesh (new) | particle-mesh-2d-disk |
| sph-2d (new) | sph-sod-shock-tube |
| pic-2d (new) | two-stream-pic-plasma |
| gp-solver (new) | gp-kernel-zoo |

## Stretch playgrounds beyond Phase 6

- `lyapunov-spectrum`: Henon and standard map, Benettin QR algorithm.
- `pca-vs-umap-vs-tsne`: side-by-side manifold unfolding on Swiss roll and S-curve.
- `gaussian-process-regression`: interactive kernel selection with credible bands.
- `hmc-vs-mh-on-banana`: instructional sampler comparison.
- `tov-neutron-star`: polytrope mass-radius curve with general-relativistic correction toggle.
- `liouvillian-flow`: phase-space density evolution for a 1D oscillator, visualizing conservation of phase volume.

Ship 12 to 18 of these in six months. Six well-built playgrounds beat fifteen rushed ones.

## Catalog: ratified concepts

Forty-one ratified playground concepts beyond Phases 1 through 6 and the Stretch list, organized by topical group. Each row names the playground slug, group, engine reuse (existing or newly named), primary citation key, and the strong invariant with its quantitative threshold.

### Group A: Ising and lattice spin variants

| slug | group | engine reuse | primary citation | strong invariant + threshold |
| ising-triangular | A | lattice-mc | Newman-Barkema Ch. 3 | Tc = 4/ln(3) ~ 3.6410 within 1 percent at L >= 64 |
| potts-q-state-transition | A | lattice-mc | Newman-Barkema Ch. 5 | 2nd-order transition for q <= 4; 1st-order discontinuity for q >= 5 in 2D |
| xy-model-bkt | A | lattice-mc | Newman-Barkema Ch. 5 | Nelson-Kosterlitz helicity-modulus jump at T_BKT = 2/pi |
| frustrated-triangular-af | A | lattice-mc | Krauth Ch. 5 | Wannier 1950 ground-state entropy S/N = 0.3231... |
| percolation-2d | A | lattice-mc (percolation submodule) | Stauffer-Aharony | site p_c = 0.59275 and bond p_c = 0.5 within 0.5 percent on L = 256 |

### Group B: Chaos and dynamical systems

| slug | group | engine reuse | primary citation | strong invariant + threshold |
| lorenz-attractor | B | ode-rk (new) | Strogatz Ch. 9 | max-Lyapunov 0.906 within 5 percent and Kaplan-Yorke 2.06 within 5 percent |
| rossler-funnel | B | ode-rk (new) | Ott Ch. 3 | Hopf bifurcation at c = 5.7 for a = b = 0.2 within 1 percent |
| henon-strange-attractor | B | none (pure 2D map) | Strogatz Ch. 12 | max-Lyapunov 0.4192 within 5 percent and box-count dim 1.26 within 5 percent |
| billiards-circle-stadium-sinai | B | billiards (new) | Berry 1981 | escape-rate / ergodicity contrast: stadium and Sinai mix; circle does not |
| standard-map-kam | B | none (pure 2D map) | Ott Ch. 7 | Greene K_c = 0.971635 within 1 percent for golden-mean torus breakup |
| duffing-oscillator | B | ode-rk (new) | Strogatz Ch. 12 | period-doubling cascade with Feigenbaum delta ~ 4.669 within 5 percent |
| arnold-cat-map | B | none (pure 2D map) | Ott Ch. 2 | Lyapunov exponent log((3 + sqrt(5)) / 2) within 1e-6 |

### Group C: Quantum mechanics

| slug | group | engine reuse | primary citation | strong invariant + threshold |
| particle-in-a-well-zoo | C | none (analytic eigenfunctions) | Griffiths QM Ch. 2 | orthonormality < 1e-10 and ascending E_n ordering |
| harmonic-oscillator-coherent-state | C | none (analytic) | Sakurai Ch. 2 | mean number = abs(alpha)^2 within 1e-10 and exact period 2 pi / omega |
| tunneling-rectangular-barrier | C | none (analytic) | Griffiths QM Ch. 2 | analytic T(E) closed form agreement within 1e-10 |
| hydrogen-orbital-cross-sections-2d | C | none (analytic R_nl * Y_lm) | Griffiths QM Ch. 4 | analytic radial times spherical agreement within 1e-10 |
| kronig-penney-bands | C | none (transcendental root-find) | Shankar Ch. 5 | band-edge equation cos(ka) = analytic RHS within 1e-8 |
| 1d-tdse-scattering-comparator | C | fd-grid | Newman Ex. 9.8 | norm conservation 1 plus or minus 1e-10 per Crank-Nicolson step |
| wkb-vs-shooting | C | ode-rk (new) | Griffiths QM Ch. 8 | Bohr-Sommerfeld quantization at large n within 1 percent |
| bloch-sphere-qubit-gates | C | none | Sakurai Ch. 1; Nielsen-Chuang Ch. 4 (bib NEW) | SU(2) unitarity norm(U dagger U minus I) < 1e-12 |

### Group D: Wave and PDE comparators

| slug | group | engine reuse | primary citation | strong invariant + threshold |
| advection-scheme-shootout | D | fd-grid | LeVeque FD Ch. 9 | FTCS unstable as predicted; upwind TVD verified to 1e-12 |
| airy-pattern-circular-aperture | D | none (analytic Bessel) | Griffiths E&M Ch. 9; Hecht Ch. 10 (bib NEW) | first zero at 1.22 lambda / D within 0.5 percent |
| gaussian-beam-paraxial | D | none (analytic ABCD q) | Siegman Ch. 17 (bib NEW) | beam q-parameter ABCD agreement within 1e-10 |

### Group E: Information theory

| slug | group | engine reuse | primary citation | strong invariant + threshold |
| kl-divergence-asymmetry | E | none | MacKay Ch. 2 | analytic Gaussian KL agreement within 1e-10 |
| mutual-information-2d | E | none | MacKay Ch. 2 | I(X;Y) = H(X) + H(Y) minus H(X,Y) within 1e-10 |
| maxent-distribution-zoo | E | optimizer-harness | MacKay Ch. 22 | Gaussian recovered at fixed variance constraint within 1e-6 KL |

### Group F: ML beyond core

| slug | group | engine reuse | primary citation | strong invariant + threshold |
| tsne-vs-umap-vs-isomap | F | optimizer-harness | Murphy Vol. 1 Ch. 20 | stress monotone non-increasing per iteration |
| backprop-tiny-net | F | mlp-trainer | Goodfellow Ch. 6 (bib NEW) | gradcheck against finite difference < 1e-5 |
| mean-field-vi-on-banana | F | optimizer-harness | Bishop-Bishop Ch. 16 | ELBO at most log evidence; ELBO monotone non-decreasing |
| gp-kernel-zoo | F | gp-solver (new) | Murphy Vol. 1 Ch. 17; MacKay Ch. 45 | posterior interpolates training data within 1e-10; KL to prior > 0 |
| em-on-gmm-2d | F | optimizer-harness | Bishop-Bishop Ch. 15 | log-likelihood monotone non-decreasing per EM step |
| bayesian-coin-update | F | none | Gelman BDA3 Ch. 2 | Beta-Binomial conjugate posterior within 1e-10 |
| attention-as-soft-retrieval | F | none | Vaswani 2017 (bib NEW); Bishop-Bishop Ch. 12 | tau approaches 0 collapses to argmax; tau large approaches uniform |

### Group G: Particle methods

| slug | group | engine reuse | primary citation | strong invariant + threshold |
| particle-mesh-2d-disk | G | particle-mesh (new) | Hockney-Eastwood Ch. 5 through 7 | virial 2T + U = 0 in equilibrium within 5 percent over 100 dt |
| sph-sod-shock-tube | G | sph-2d (new) | LeVeque FV Ch. 14 | Rankine-Hugoniot shock condition within 5 percent at t = 0.2 |
| two-stream-pic-plasma | G | pic-2d (new) | Hockney-Eastwood Ch. 8 | linear growth rate matches cold-limit theory within 5 percent |

### Group H: Astrophysical and GR (self-contained, no external data grids)

| slug | group | engine reuse | primary citation | strong invariant + threshold |
| lagrange-points-cr3bp | H | symplectic | Murray-Dermott Ch. 3 (bib NEW) | quintic roots for L1/L2/L3 within 1e-10; L4/L5 Routh stability for mu < 0.0385 |
| mercury-precession-pn | H | symplectic | Hartle Ch. 9 | 43 arcsec per century for the GR 1PN orbit within 5 percent |
| roche-tidal-disruption | H | none (analytic limit) | Binney-Tremaine Ch. 8 | d/R = 2.44 (rigid) and 2.45 (fluid) within 1 percent |
| relativistic-beaming-azimuth | H | none | Rybicki-Lightman Ch. 4 (bib NEW) | Doppler-boost ratio D to the (3 + alpha) within 1e-6 |
| schwarzschild-photon-sphere | H | symplectic | Carroll Ch. 5; Hartle Ch. 9 | b_crit = 3 sqrt(3) M within 0.1 percent |
