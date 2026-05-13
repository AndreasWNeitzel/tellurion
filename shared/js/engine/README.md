# shared/js/engine/

Headless numerical engines. No DOM, no `performance.now`, no `window`. Each engine exports the API contract from `docs/ARCHITECTURE.md`:

```
create(state)        // factory
step(instance, dt)   // mutate state in place
diagnostics(instance) // return scalar invariants
snapshot(instance)   // structured-cloneable copy
seed(instance, n)    // for stochastic engines
```

Build engines in the order set by `docs/BUILD_ORDER.md`. The `numerics-skeptic` subagent reviews each engine's integrator and stability bounds before implementation.

Engines under this directory are imported by playgrounds and by `tests/engines/*.test.mjs`. Each must ship its own unit test alongside the playground that first depends on it.

## Current engines

| name | depends on | implemented |
|------|------------|-------------|
| symplectic.js | none | yes |
| fd-grid.js | none | no |
| yee-fdtd.js | none | no |
| mcmc-harness.js | rng.js, invariants/ess.js | yes |
| optimizer-harness.js | none | no |
| barnes-hut.js | none | no |
| lattice-mc.js | rng.js | no |
| mlp-trainer.js | optimizer-harness | no |
| ode-rk.js | none | no |
| billiards.js | none | no |
| particle-mesh.js | none (FFT in-line) | no |
| sph-2d.js | none | no |
| pic-2d.js | particle-mesh.js | no |
| gp-solver.js | none | no |

## Engines surfaced by the 40-entry ratified catalog

The catalog in `docs/BUILD_ORDER.md` introduces six new engines beyond the eight originally named. Each carries an API contract that mirrors the existing engines (create / step / diagnostics / snapshot) so playgrounds switching between them never have to relearn the surface.

### ode-rk.js

Non-symplectic explicit Runge-Kutta integrator for dissipative or otherwise non-Hamiltonian flows. Ships with RK4 (fixed step) and DOP853 (adaptive, embedded 8(5,3) Dormand-Prince) modes. API matches `symplectic.js`: `create({ positions, velocities, acceleration, time = 0, method = 'rk4' })`. Seeds: lorenz-attractor, rossler-funnel, duffing-oscillator, wkb-vs-shooting.

### billiards.js

Geometric collision integrator for hard-wall billiards. State is a list of (position, velocity) tuples. Step advances each particle in straight-line free flight to the next wall intersection, then applies specular reflection. Seeds: billiards-circle-stadium-sinai.

### particle-mesh.js

FFT-based Poisson solver on a regular 2D grid. Charges or masses are deposited via cloud-in-cell, the potential is computed in Fourier space, and the gradient is interpolated back to particles. API: `create({ N, gridSize, boundary: 'periodic' })`. Seeds: particle-mesh-2d-disk; reused as the field-solve in pic-2d.

### sph-2d.js

Smoothed-particle hydrodynamics on a 2D domain. Cubic-spline kernel, density summation, ideal-gas EOS, artificial viscosity. API: `create({ N, kernel, eos, h })`. Seeds: sph-sod-shock-tube.

### pic-2d.js

Particle-in-cell electrostatic plasma simulator. Depends on particle-mesh.js for the Poisson solve; tracks two species (electrons + ions) on the same mesh. Seeds: two-stream-pic-plasma.

### gp-solver.js

Gaussian-process regression core. Cholesky factorization of the kernel matrix with white-noise jitter, posterior mean and covariance for arbitrary query points. API: `create({ trainX, trainY, kernel, sigmaNoise })`. Seeds: gp-kernel-zoo.

## Engines surfaced by the UPorto curriculum additions

Phase 4 (UPorto curriculum reorganization, 2026-05-13) adds five new engine stubs. Each is named by a draft playground whose strong invariant calls for it. Implementation lands at the first playground that consumes the engine; until then the stub is informational.

### ode-leapfrog.js

Kick-drift-kick leapfrog integrator distinct from the velocity-Verlet form in `symplectic.js`. Wanted where the separated explicit form is more readable than the in-place Verlet pair (Hamiltonian phase-space visualizations, N-body codes that interleave drift and kick at half-steps). Seeds: `kepler-orbit-elements`, `orbits-in-axisymmetric-potential`, `secular-perturbation-laplace-lagrange`. RK4/DOP853 in `ode-rk.js` already covers the non-symplectic adaptive RK45 case named in the directive; no separate `ode-rk45.js` is needed.

### fft-1d-2d.js

Cooley-Tukey FFT for 1D real / complex inputs and 2D images. Seeds: `wavepacket-dispersion-1d` (Gaussian wavepacket spreading), `cmb-power-spectrum-toy` (angular power spectrum from a map), `baryon-acoustic-oscillation-toy` (sound horizon Fourier features). Output convention: numpy `fftfreq` ordering; no normalization shortcut, the playground pays the explicit `1/N` factor.

### kepler-solver.js

Newton iteration on `M = E - e sin E` for a single mean anomaly M and eccentricity e, with quadratic convergence from `E_0 = M`. Vectorized variant for an array of M at fixed e. Seeds: `kepler-orbit-elements`, `kepler-equation-newton-iteration`, `transit-mandel-agol-analytic`, `radial-velocity-orbital-trace`, `resonance-mean-motion-toy`.

### blackbody-planck.js

Analytic Planck function `B(nu, T) = (2 h nu^3 / c^2) / (exp(h nu / k T) - 1)` with overflow-safe form `expm1` and a vectorized frequency-grid path. Returns `B_nu`, `B_lambda`, and the bolometric integral via Stefan-Boltzmann. Seeds: `stellar-blackbody-vs-line`, `eddington-grey-atmosphere`, `cmb-power-spectrum-toy`.

### voigt-profile.js

Voigt profile via the Faddeeva function approximation (Humlicek 1982 rational fit). Convolution of a Gaussian (Doppler width) with a Lorentzian (natural plus pressure broadening) on a frequency grid. Seeds: `voigt-profile-decomposition`, `stellar-blackbody-vs-line` (line on a blackbody continuum), `radiative-transfer-1d-slab` (line transfer).
