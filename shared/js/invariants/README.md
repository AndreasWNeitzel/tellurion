# shared/js/invariants/

Reusable invariant checkers. Headless modules, deterministic, pure functions. Each module exports the small set of helpers a playground needs to verify a conservation law, statistical property, or analytic identity at gate time.

## Current helpers

| name | purpose | playgrounds |
| :-- | :-- | :-- |
| energy.js | energy drift bookkeeping | every Hamiltonian playground |
| ess.js | effective sample size and integrated autocorrelation | mcmc-comparator and every MCMC playground |

## Helpers surfaced by the 40-entry ratified catalog

The catalog in `docs/BUILD_ORDER.md` introduces six additional invariant helpers that several playgrounds will share. Each gets a stub note here; implementation lands at the first playground that needs it.

### kl-divergence.js

KL divergence helpers: closed-form Gaussian-to-Gaussian KL, generic Monte Carlo KL with importance sampling, plug-in estimator for histogrammed distributions. Seeds: kl-divergence-asymmetry, mean-field-vi-on-banana, mcmc-comparator (gate threshold), gp-kernel-zoo (KL to prior).

### mutual-information.js

Mutual information helpers: `H(X) + H(Y) - H(X, Y)` over a 2D histogram, plus the analytic Gaussian case `MI = -1/2 log(1 - rho^2)`. Seeds: mutual-information-2d, attention-as-soft-retrieval (entropy of softmax weights).

### lyapunov-spectrum.js

Maximum and full Lyapunov-exponent estimation via the Benettin-Galgani-Giorgilli-Strelcyn QR method plus the Wolf small-perturbation method. Returns the spectrum with confidence intervals. Seeds: lorenz-attractor, rossler-funnel, henon-strange-attractor, standard-map-kam, duffing-oscillator, arnold-cat-map.

### detailed-balance.js

Detailed-balance probe: given a target log-density and a sampler step, computes the empirical forward and reverse acceptance rates between pairs of states and asserts `pi(x) p(x to y) = pi(y) p(y to x)`. Seeds: every MCMC playground, every lattice-MC playground.

### rankine-hugoniot.js

Rankine-Hugoniot jump conditions across a 1D shock: mass, momentum, and energy flux continuity. Returns the ratio of post- to pre-shock state plus the analytic Sod-tube solution at any time. Seeds: sph-sod-shock-tube.

### gradcheck.js

Symmetric finite-difference gradient check. Given a scalar function f and its analytic gradient g, picks random unit directions and verifies `(f(x + eps * d) - f(x - eps * d)) / (2 eps)` agrees with `g . d` to a threshold. Seeds: backprop-tiny-net, em-on-gmm-2d, mean-field-vi-on-banana.

### union-find.js (added during Phase 3 cross-cutting work)

Union-find with path compression, plus the Hoshen-Kopelman one-pass cluster labeler for square lattices. Not strictly an invariant but needed by the percolation cluster geometry. Seeds: percolation-2d (catalog Group A).
