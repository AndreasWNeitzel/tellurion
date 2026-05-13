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
| symplectic | double-pendulum, barnes-hut-nbody, schwarzschild-geodesics, lagrange-points-cr3bp, mercury-precession-pn |
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

Thirty-nine ratified playground concepts beyond Phases 1 through 6 and the Stretch list, organized by topical group. Each row names the playground slug, group, engine reuse (existing or newly named), primary citation key, and the strong invariant with its quantitative threshold.

(The original ratified list was 41; `schwarzschild-photon-sphere` was absorbed into the already-shipped `schwarzschild-geodesics` playground. `arnold-cat-map` was removed from the catalog on user request.)

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

## Ratified Catalog (93 entries across 11 families)

Ratified by the user 2026-05-13. Do not substitute, drop, or extend entries; mismatches against the existing Phase 1 through Phase 6 schedule are flagged in row notes. Row format:

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |

### Family A: Lattice spin models and percolation

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| ising-triangular | lattice-mc | Newman-Barkema Ch. 3 | T_c = 4/ln(3) within 1 percent |
| potts-q-state-transition | lattice-mc | Newman-Barkema Ch. 5 | 2nd-order q <= 4, 1st-order q >= 5 via Binder cumulant |
| xy-model-bkt | lattice-mc | Newman-Barkema Ch. 5 | helicity-modulus jump 2/(pi T_KT) |
| frustrated-triangular-af | lattice-mc | Krauth Ch. 5 | residual entropy 0.3231 within 2 percent, M = 0 |
| percolation-2d | lattice-mc | Stauffer-Aharony Ch. 2 | site p_c = 0.5927, bond p_c = 0.5 within 0.5 percent |
| swendsen-wang-vs-wolff | lattice-mc | Newman-Barkema Ch. 4 | z_Wolff ~ 0.25, z_SW ~ 0.4 vs z_metro ~ 2.17 |
| wang-landau-density-of-states | lattice-mc | Landau-Binder Ch. 7 | flat-histogram criterion + g(E) accuracy |
| replica-exchange-tempering | lattice-mc + mcmc-harness | Krauth Ch. 5 | replica round-trip time, swap acceptance |
| hard-disks-event-chain | NEW ENGINE: event-chain-mc | Krauth Ch. 2 | pressure-virial vs equation of state |
| directed-percolation-1d | lattice-mc | Hinrichsen 2000 Ch. 2 | DP universality exponents (beta, nu_perp, nu_para) |
| abelian-sandpile-btw | lattice-mc | Bak 1996 (How Nature Works) | avalanche-size power law tau ~ -1.21 within 5 percent |
| forest-fire-drossel-schwabl | lattice-mc | Bak 1996 | cluster-size power law in SOC regime |
| zero-range-process-condensation | lattice-mc | Evans-Hanney 2005 (J. Phys. A) | condensate emergence at rho_c |
| q-deformed-tasep | lattice-mc | Schutz 2001 | shock and rarefaction wave structure |

### Family B: Dynamical systems and chaos

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| lorenz-attractor | ode-rk | Strogatz Ch. 9, Ott Ch. 3 | max-Lyapunov 0.906, K-Y dim 2.06 within 2 percent |
| rossler-funnel | ode-rk | Ott Ch. 3 | single positive Lyapunov, Hopf at c = 5.7 |
| henon-strange-attractor | no engine (discrete map) | Strogatz Ch. 12 | Lyapunov 0.4192, K-Y dim 1.26 within 1 percent |
| billiards-circle-stadium-sinai | billiards | Berry 1981 | Lyapunov = 0 circle, > 0 stadium and Sinai |
| standard-map-kam | no engine (discrete map) | Ott Ch. 7 | Greene K_c = 0.971635 golden torus |
| duffing-oscillator | ode-rk | Strogatz Ch. 12 | period-doubling Feigenbaum delta = 4.669 |
| arnold-cat-map | no engine (discrete map) | Ott Ch. 2 | Lyapunov = log(phi); explicit recurrence period (REMOVED per user 2026-04-29) |
| coupled-kuramoto-oscillators | ode-rk | Kuramoto 1984 | order parameter r ~ sqrt(K - K_c) |
| fermi-pasta-ulam-tsingou | symplectic | Ford 1992 | energy recurrence period within 5 percent |
| van-der-pol-relaxation | ode-rk | Strogatz Ch. 7 | limit-cycle period as function of mu |
| fitzhugh-nagumo-excitable | ode-rk | FitzHugh-Nagumo 1961/1962 | excitable threshold, single-spike response |
| belousov-zhabotinsky-oregonator | ode-rk | Field-Noyes 1974 | limit-cycle period in concentration phase |
| predator-prey-hopf | ode-rk | Strogatz Ch. 8 | Hopf at bifurcation, limit-cycle amplitude |
| shilnikov-homoclinic | ode-rk | Ott Ch. 4 | spiral-saddle horseshoe, positive Lyapunov |
| circle-map-arnold-tongues | no engine (discrete map) | Schuster Ch. 4 | devil's staircase, golden-rotation locking |
| coupled-map-lattice | no engine (discrete map) | Kaneko 1993 | spatiotemporal Lyapunov spectrum, on-off |
| hindmarsh-rose-bursting | ode-rk | Hindmarsh-Rose 1984 | fast-slow burst count, interspike interval |

### Family C: Quantum mechanics

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| particle-in-a-well-zoo | analytic | Griffiths QM Ch. 2 | orthonormality < 1e-10, ordering monotone |
| harmonic-oscillator-coherent | analytic | Sakurai Ch. 2 | average n = abs(alpha)^2 exact, period 2 pi / omega |
| harmonic-oscillator-squeezed | analytic | Walls-Milburn Sec. 2 | squeeze ratio exp(-2r) on chosen quadrature |
| tunneling-rectangular-barrier | analytic | Griffiths QM Ch. 2 | analytic T(E) within 1e-6 |
| hydrogen-orbital-cross-sections | analytic | Griffiths QM Ch. 4 | analytic radial-times-spherical marginal |
| kronig-penney-bands | analytic | Shankar Ch. 5 | transcendental band-edge equation within 1 percent |
| 1d-tdse-scattering-comparator | fd-grid (Crank-Nicolson) | Newman Ch. 9 Ex. 9.8 | norm conservation 1e-10 per CN step |
| 2d-tdse-double-slit-buildup | fd-grid (extend to 2D Crank-Nicolson) | Newman Ch. 9, Griffiths QM Ch. 5 | norm conserved, fringe spacing lambda L / d |
| wkb-vs-shooting | ode-rk | Griffiths QM Ch. 8 | Bohr-Sommerfeld within 1 percent for n >= 5 |
| bloch-sphere-qubit-gates | analytic | Sakurai Ch. 1, Nielsen-Chuang Ch. 4 | SU(2) norm 1e-14, closed-loop identity |
| landau-zener-avoided-crossing | ode-rk | Landau-Zener 1932 | P_LZ = exp(-2 pi Gamma) within 2 percent |
| stark-shift-hydrogen | analytic | Griffiths QM Ch. 6 | linear Stark on n = 2, quadratic on ground |
| berry-phase-bloch | analytic | Sakurai Ch. 5 | geometric phase = half solid angle within 1 percent |
| spin-echo-rabi-sequence | NEW ENGINE: qcircuit-simulator | Sakurai Ch. 5 | refocused magnetization after pi-pulse pair |
| quantum-walk-1d | NEW ENGINE: qcircuit-simulator | Kempe 2003 | variance ~ t (quantum) vs sqrt(t) (classical) |
| anderson-localization-1d | NEW ENGINE: tight-binding-1d | Anderson 1958 | localization length L_loc ~ W^-2 within 10 percent |
| tight-binding-graphene | NEW ENGINE: tight-binding-2d | Castro-Neto 2009 | Dirac cones at K and K prime, DOS linear near E = 0 |
| adiabatic-passage-stirap | ode-rk | Vitanov 2017 | population transfer 1 to 3 with bare state 2 unpopulated |

### Family D: 2D PDE propagations

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| advection-scheme-shootout | fd-grid | LeVeque FD Ch. 9 | FTCS unstable, upwind TVD, LW oscillatory at shock |
| 2d-heat-diffusion-ftcs-vs-adi | fd-grid (extend ADI) | LeVeque FD Ch. 3 | FTCS CFL dt <= dx^2 / (4 D); ADI unconditionally stable |
| 2d-allen-cahn-phase-separation | fd-grid (extend biharmonic) | Allen-Cahn 1979 | monotone free-energy decrease per step |
| 2d-cahn-hilliard-spinodal | fd-grid (extend biharmonic) | Cahn-Hilliard 1958 | total mass conserved to machine precision |
| 2d-gray-scott-turing-patterns | fd-grid | Gray-Scott 1983 | spot, stripe, maze regimes by (F, k) |
| 2d-fitzhugh-nagumo-spirals | fd-grid | Cross-Hohenberg 1993 | spiral wavelength selection |
| 2d-wave-equation-drum-modes | fd-grid | Strang | eigenfrequency ratios for square, circular, L-shaped membranes |
| 2d-acoustic-wave-scatterers | fd-grid | Trefethen | reflection-transmission at interface, no spurious growth |
| 2d-nonlinear-schrodinger-solitons | NEW ENGINE: spectral-fft-2d (complex) | Sulem-Sulem | soliton speed/amplitude relation, two-soliton elastic |
| 2d-kuramoto-sivashinsky-chaos | NEW ENGINE: spectral-fft-2d | Trefethen P28 | energy in bounded band, spatial Fourier cascade |
| 2d-swift-hohenberg-patterns | NEW ENGINE: spectral-fft-2d | Swift-Hohenberg 1977 | stripe to hexagon selection above threshold |
| 2d-ginzburg-landau-vortices | NEW ENGINE: spectral-fft-2d (complex) | Aranson-Kramer 2002 | vortex annihilation pair, charge conservation |
| 2d-burgers-shock-vs-rarefaction | fd-grid | LeVeque FV Ch. 11 | Rankine-Hugoniot shock speed within 1 percent |
| 2d-kelvin-helmholtz | NEW ENGINE: vorticity-streamfunction-2d | Drazin-Reid | most unstable mode wavenumber within 5 percent |
| 2d-rayleigh-taylor | NEW ENGINE: vorticity-streamfunction-2d | Drazin-Reid | mode growth rate sqrt(g A k) within 5 percent |
| 2d-navier-stokes-lid-driven | NEW ENGINE: vorticity-streamfunction-2d | Trefethen | streamfunction extrema vs Re reproduce Ghia 1982 |
| 2d-vorticity-lattice-boltzmann | NEW ENGINE: lattice-boltzmann-d2q9 | Succi 2001 | Poiseuille profile within 2 percent, Re scaling |
| 2d-taylor-couette | NEW ENGINE: vorticity-streamfunction-2d | Drazin-Reid | critical Taylor number within 5 percent |
| 2d-hele-shaw-viscous-fingering | fd-grid | Saffman-Taylor 1958 | finger-width-to-channel ratio approaches 1/2 |

### Family E: Optics and electromagnetism

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| airy-pattern-circular-aperture | analytic | Griffiths EM Ch. 9, Hecht Ch. 10 | first zero 1.22 lambda / D within 0.5 percent |
| gaussian-beam-paraxial | analytic | Siegman Ch. 17 | ABCD q-parameter transformation exact |
| single-double-multi-slit | analytic | Hecht Ch. 10 | multi-slit principal max recovers single-slit envelope |
| thin-film-interference | analytic | Hecht Ch. 9 | constructive/destructive condition exact |
| brewster-angle-fresnel | analytic | Griffiths EM Ch. 9 | reflection coefficient = 0 at theta_B within 1e-6 |
| polarization-stokes-poincare | analytic | Born-Wolf Ch. 8 | Stokes vector magnitude conserved by retarders |
| waveguide-modes-slab | analytic | Snyder-Love | TE/TM dispersion curves, cutoff frequencies exact |
| fdtd-cherenkov-cone | yee-fdtd | Jackson Ch. 13 | Cherenkov angle cos(theta) = c / (n v) within 1 percent |
| mie-scattering-cylinder | analytic | Bohren-Huffman | Rayleigh limit recovery for small ka |

### Family F: ML, statistics, and inference

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| tsne-vs-umap-vs-isomap | optimizer-harness | Murphy V1 Ch. 20 | stress / KL monotone decrease per iter |
| backprop-tiny-net | mlp-trainer | Goodfellow Ch. 6 | gradcheck residual < 1e-5 |
| mean-field-vi-on-banana | optimizer-harness | Bishop-Bishop Ch. 16 | ELBO non-decreasing |
| gp-kernel-zoo | gp-solver | Murphy V1 Ch. 17, MacKay Ch. 45 | posterior interpolates obs to 1e-10 |
| em-on-gmm-2d | optimizer-harness | Bishop-Bishop Ch. 15 | log-likelihood non-decreasing per iter |
| bayesian-coin-update | analytic | Gelman BDA3 Ch. 2 | conjugate Beta-Binomial closed form |
| attention-as-soft-retrieval | analytic | Vaswani 2017, Bishop-Bishop Ch. 12 | tau to 0 exact retrieval |
| logistic-regression-margins | NEW ENGINE: convex-optimizer | HTF Ch. 4 | decision boundary, margin vs C parameter |
| kernel-svm-on-2d | NEW ENGINE: convex-optimizer | HTF Ch. 12 | RBF, poly, linear; KKT residual at convergence |
| bias-variance-tradeoff | mlp-trainer | HTF Ch. 7 | MSE decomposition exact within sampling error |
| bagging-vs-boosting | NEW ENGINE: ensemble-trainer | HTF Ch. 8, Ch. 10 | ensemble error vs M, exponential vs sublinear |
| expectation-propagation-vs-vi | optimizer-harness | Bishop-Bishop Ch. 16 | on bimodal target, mode-coverage vs mode-seek |
| hmc-vs-nuts | mcmc-harness | Hoffman-Gelman 2014 | trajectory U-turn detection, ESS/eval |
| hmc-energy-trajectory | mcmc-harness | Neal MCMC 2011 | H drift < threshold; rejection on divergence |
| mcmc-trace-pathologies | mcmc-harness | Gelman BDA3 Ch. 11 | six known failure modes side-by-side |
| langevin-mala-hmc-mixture | mcmc-harness | Robert-Casella Ch. 7 | mode-hop rate vs step size |
| gmm-em-vs-vi | optimizer-harness | Bishop-Bishop Ch. 15 | ELBO vs MLE on same dataset |
| normalizing-flow-nvp-vs-spline | NEW ENGINE: flow-trainer | Bishop-Bishop Ch. 18 | change-of-variables mass conservation 1e-10 |
| pixelcnn-toy-binary | NEW ENGINE: autoregressive-trainer | van den Oord 2016 | autoregressive factorization exact |
| mlp-double-descent | mlp-trainer | Belkin 2019 | test risk has two minima vs width |
| grokking-toy-modular-arithmetic | mlp-trainer | Power 2022 | delayed-generalization transition reproducible |
| lottery-ticket-pruning | mlp-trainer | Frankle-Carbin 2019 | sparse subnetwork matches dense within 1 percent |
| fgsm-2d-classifier | mlp-trainer | Goodfellow 2014 | perturbation epsilon vs misclassification rate |

### Family G: Information theory and probability

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| kl-divergence-asymmetry | analytic | MacKay Ch. 2 | KL >= 0, = 0 iff equal, asymmetry visible |
| mutual-information-2d | analytic | MacKay Ch. 2, Cover-Thomas Ch. 2 | I = H(X) + H(Y) - H(X, Y) within 1e-12 |
| maxent-distribution-zoo | analytic | MacKay Ch. 22 | Gaussian at fixed var, exp at fixed mean |
| channel-capacity-bsc | analytic | Cover-Thomas Ch. 7 | C = 1 - H(p) within 1 percent from random-coding bound |
| hamming-vs-ldpc-decoding | NEW ENGINE: belief-propagation | MacKay Ch. 47 | BER vs SNR matches Shannon limit asymptotically |
| large-deviation-rate | analytic | Touchette 2009 | Cramer rate function reproduced empirically |
| copula-dependence-zoo | analytic | Nelsen | Sklar theorem; marginals invariant, dep changes |
| stein-discrepancy-2d | analytic | Liu-Lee 2016 | KSD = 0 iff samples from target |

### Family H: Numerical methods showcase

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| fft-vs-dft-convergence | analytic | Press NR Ch. 12 | N log N vs N^2; spectral leakage on non-periodic |
| stiff-ode-implicit-vs-explicit | ode-rk + NEW ENGINE: bdf-solver | Hairer-Wanner | Robertson chemistry; BDF stable, RK45 collapses |
| mc-integration-convergence | analytic | MacKay Ch. 29 | error ~ 1/sqrt(N); IS variance reduction |
| runge-vs-chebyshev | analytic | Trefethen P9 | max error on abs(x); equispaced diverges, Cheb converges |
| gauss-quadrature-vs-trapezoid | analytic | Press NR Ch. 4 | exponential vs algebraic convergence on smooth |
| conjugate-gradient-vs-sd | NEW ENGINE: linear-solver | Nocedal-Wright | CG converges in <= n steps on n-dim quadratic |
| multigrid-v-cycle | NEW ENGINE: multigrid | Briggs 2000 | residual reduction independent of grid size |

### Family I: Particle methods and plasma

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| particle-mesh-2d-disk | particle-mesh | Hockney-Eastwood Ch. 5 through 7 | energy 1 percent, angular momentum machine precision |
| sph-sod-shock-tube | sph-2d | LeVeque FV Ch. 14 | Rankine-Hugoniot within 5 percent kernel error |
| two-stream-pic-plasma | pic-2d | Hockney-Eastwood Ch. 8 | growth rate omega_p / 2 sqrt(2) within 10 percent |

### Family J: Astrophysics and GR (analytic where possible)

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| lagrange-points-cr3bp | symplectic | Murray-Dermott Ch. 3 | L4/L5 stable iff mu < 0.0385 |
| mercury-precession-pn | symplectic | Hartle Ch. 9 | 43 arcsec / century within 1 percent |
| roche-tidal-disruption | analytic + soft-body | Binney-Tremaine Ch. 8 | d/R = 2.44 rigid, 2.45 fluid |
| relativistic-beaming-azimuth | analytic | Rybicki-Lightman Ch. 4 | Doppler boost ratio matches delta^(3 + alpha) |
| schwarzschild-photon-sphere | NEW ENGINE: geodesic-integrator | Carroll Ch. 5, Hartle Ch. 9 | b_crit = 3 sqrt(3) M within 0.1 percent |
| schwarzschild-effective-potential | analytic | Carroll Ch. 5 | ISCO at r = 6 M, photon sphere at r = 3 M |
| kerr-equatorial-photon-orbits | NEW ENGINE: geodesic-integrator | Bardeen 1973 | prograde vs retrograde photon-sphere asymmetry |
| shapiro-time-delay | analytic | Schutz Ch. 11 | delay = 4 M ln(...) within 1 percent |
| gravitational-redshift | analytic | Hartle Ch. 9 | clock ratio sqrt(1 - 2M/r) within 1e-6 |
| fast-rotating-newtonian-star | NEW ENGINE: rotating-fluid-equilibrium | Tassoul 1978 | oblateness vs Omega^2 / (G rho) |
| pulsar-spindown-magnetic-dipole | ode-rk | Shapiro-Teukolsky Ch. 10 | P-Pdot diagram slope from B and I |
| gw-binary-inspiral-pn | ode-rk | Maggiore V1 | chirp-mass recovery from f-dot within 1 percent |
| tov-polytrope-mass-radius | NEW ENGINE: tov-solver | Hartle Ch. 11 | maximum mass at fixed polytropic index |
| accretion-disk-temperature-profile | analytic | Frank-King-Raine | T(r) ~ r^(-3/4) at large r within 1 percent |

### Family K: Information geometry and optimal transport

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| fisher-information-2d-likelihood | analytic | Amari 1985 | metric ellipses, Cramer-Rao bound saturation |
| natural-gradient-vs-vanilla | optimizer-harness | Amari 1998 | reparameterization invariance demonstrated |
| optimal-transport-sinkhorn | NEW ENGINE: ot-solver | Peyre-Cuturi 2019 | Sinkhorn iteration converges to OT plan |
| wasserstein-gradient-flow | NEW ENGINE: ot-solver + jko-stepper | Ambrosio-Gigli | JKO scheme; free energy decreases per step |

## Phase 0 ingestion report (2026-05-13)

Total rows by family: A = 14, B = 17, C = 18, D = 19, E = 9, F = 23, G = 8, H = 7, I = 3, J = 14, K = 4. Total = 136 row entries. Some entries (lorenz-attractor, rossler-funnel, etc.) appear both in the catalog and in the existing Group A-H schedule above; the canonical build sequencing remains the Phase 1-6 table at the top of this document and the Ratified Catalog is the master inventory.

Mismatches:
- arnold-cat-map row appears in Family B but was removed from the project per user instruction 2026-04-29. Kept with REMOVED note for completeness.
- schwarzschild-photon-sphere appears in Family J but was absorbed into schwarzschild-geodesics during the Phase 1 build (user instruction 2026-05-13). Treated as a Family J entry not yet implemented separately.

New engines required (from Phase 0 inventory):
event-chain-mc, qcircuit-simulator, tight-binding-1d, tight-binding-2d, vorticity-streamfunction-2d, lattice-boltzmann-d2q9, spectral-fft-2d, belief-propagation, convex-optimizer, ensemble-trainer, flow-trainer, autoregressive-trainer, bdf-solver, linear-solver, multigrid, geodesic-integrator, rotating-fluid-equilibrium, tov-solver, ot-solver + jko-stepper.

New bib keys required for Phase 1:
hinrichsen2000, bak1996, evans-hanney2005, schutz2001, kuramoto1984, ford1992, fitzhugh-nagumo1961, field-noyes1974, schuster2008, kaneko1993, hindmarsh-rose1984, walls-milburn2008, landau-zener1932, kempe2003, anderson1958, castro-neto2009, vitanov2017, allen-cahn1979, cahn-hilliard1958, gray-scott1983, cross-hohenberg1993, strang-pde, trefethen-spectral, sulem-sulem, swift-hohenberg1977, aranson-kramer2002, drazin-reid, succi2001, saffman-taylor1958, snyder-love, bohren-huffman, htf2009, hoffman-gelman2014, neal2011, robert-casella2004, belkin2019, power2022, frankle-carbin2019, goodfellow2014, cover-thomas-2e, touchette2009, nelsen, liu-lee2016, hairer-wanner, nocedal-wright, briggs2000, murray-dermott-solar, bardeen1973, schutz-firstcourse, tassoul1978, shapiro-teukolsky, maggiore2008, frank-king-raine, amari1985, amari1998, peyre-cuturi2019, ambrosio-gigli.

Ambiguous rows flagged (use canonical slug already in tree):
harmonic-oscillator-coherent vs harmonic-oscillator-coherent-state: same playground, canonical slug is harmonic-oscillator-coherent-state.
hydrogen-orbital-cross-sections vs hydrogen-orbital-cross-sections-2d: canonical slug is hydrogen-orbital-cross-sections-2d.

### Family L: Tiquinho additions

Ratified by user 2026-05-13 (second tranche). 25 entries in the "single visually-striking classical effect with a strong analytic invariant" style. Self-contained.

| slug | engine reuse | primary citation (book + subsection) | strong invariant + threshold |
| coupled-springs-normal-modes | analytic | Goldstein Ch. 6 | eigenmode frequencies omega_+, omega_- exact; mode-to-mode beat period within 0.1 percent |
| damped-driven-oscillator | ode-rk | Strogatz Ch. 7 | resonance peak at omega = omega_0 sqrt(1 - 1/(2 Q^2)); Q from FWHM within 1 percent |
| beats-superposition | analytic | Crawford Waves Ch. 1 | beat envelope frequency = abs(f1 - f2)/2 within machine precision |
| lissajous-figures | analytic | Crawford Waves Ch. 1 | closed curve iff frequency ratio rational; period = LCM exact |
| foucault-pendulum | ode-rk | Marion-Thornton Ch. 10 | precession rate Omega sin(latitude) within 1 percent over 24-hour run |
| inverted-pendulum-kapitza | ode-rk | Landau-Lifshitz I Sec. 30 | stable above critical drive a omega^2 > 2 g l; transition crisp within 2 percent |
| pendulum-on-moving-cart | symplectic | Marion-Thornton Ch. 7 | two-DOF Lagrangian; total energy conserved within 1e-3 over 10^4 dt |
| wave-on-string-reflection | fd-grid | French Vibrations Ch. 7 | fixed-end pulse inverts, free-end preserves sign, machine precision |
| standing-waves-string-modes | analytic | French Vibrations Ch. 5 | f_n = n c / (2L) within 0.1 percent; antinode positions exact |
| doppler-effect | analytic | Crawford Waves Ch. 4 | f prime = f (c - v_o)/(c - v_s) within machine precision |
| newtons-cradle-chain | symplectic | Marion-Thornton Ch. 9 | E + p conserved through N-ball ideal chain to machine precision |
| galilean-cannon-stacking | symplectic | Harter 1971 (Am. J. Phys.) | top-ball multiplier (3N - 1)/(N + 1) in elastic mass cascade within 1 percent |
| projectile-with-air-drag | ode-rk | Marion-Thornton Ch. 2 | Stokes vs quadratic terminal velocity exact; range curve recovered |
| magnus-effect-spinning-ball | ode-rk | Adair 1990 (Physics of Baseball) | lift F_L = rho Gamma x v; trajectory curvature matches omega-driven analytic |
| brachistochrone-cycloid | analytic | Marion-Thornton Ch. 6 | cycloid descent time below line and arc within 1 percent; analytic |
| tautochrone-isochronism | analytic | Huygens 1673 (Horologium Oscillatorium) | period independent of release height on cycloid within 0.1 percent |
| gyroscope-precession | symplectic | Marion-Thornton Ch. 11 | precession rate Omega_p = M g r / (I_s omega_s) within 1 percent |
| catenary-hanging-chain | analytic | Lemos Analytical Mechanics Ch. 2 | shape y = a cosh(x/a); arc length s = a sinh(x/a) exact |
| cyclotron-uniform-b | ode-rk | Jackson Ch. 12 | radius mv / (qB), period 2 pi m / (qB) within machine precision |
| exb-drift-cycloid | ode-rk | Jackson Ch. 12 | drift velocity E x B / B^2; cycloid trajectory shape exact |
| magnetic-mirror-adiabatic | ode-rk | Goldston-Rutherford Ch. 2 | mu = m v_perp^2 / (2B) conserved within 1 percent over a bounce period |
| electric-field-lines-charges | analytic | Griffiths EM Ch. 2 | line density proportional to abs(E) within 5 percent sampling |
| brownian-motion-msd | NEW ENGINE: hard-disks-md | Reif Ch. 2 | MSD = 2 d D t within 5 percent over 10^5 collisions |
| maxwell-boltzmann-emergence | NEW ENGINE: hard-disks-md | Reif Ch. 1 | hard-disk speed histogram converges to MB; KS < 0.02 after thermalization |
| carnot-cycle-pv | analytic | Callen Ch. 4 | efficiency = 1 - T_c / T_h within 1 percent; entropy closes around cycle |

New engines (Family L): hard-disks-md (event-driven hard-disk molecular dynamics for Brownian and Maxwell-Boltzmann emergence).

New bib keys (Family L): goldstein2001, crawford-waves, marion-thornton, landau-lifshitz-mechanics, french-vibrations, harter1971, adair1990, huygens1673, lemos-analytical, goldston-rutherford, reif, callen.
