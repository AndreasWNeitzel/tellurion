---
title: Liouvillian Flow on the Pendulum Phase Space
slug: liouvillian-flow
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Liouvillian Flow on the Pendulum Phase Space

## Physical setup

A 1D pendulum is the simplest non-trivial Hamiltonian system: one degree of freedom, two-dimensional phase space (theta, p). Under Hamiltonian flow, phase-space volumes are preserved (Liouville's theorem), so an initial cloud of tracer particles traces out an evolving region whose area is invariant in time. The playground integrates N independent tracers under the pendulum Hamiltonian $H(\theta, p) = p^2/2 - \omega^2 \cos(\theta)$ using the velocity-Verlet integrator from `shared/js/engine/symplectic.js`. The viewer can drop an initial Gaussian blob of tracers at any point in phase space and watch the blob orbit, stretch, and filament without changing area. Three phase-space regions are visible: the libration region around the stable equilibrium (theta=0, p=0), the separatrix passing through the unstable equilibrium (theta=pi, p=0), and the rotation region above and below the separatrix.

## Governing equations

The Hamiltonian is

$$H(\theta, p) = \tfrac{1}{2} p^2 - \omega^2 \cos(\theta)$$

with Hamilton's equations

$$\dot{\theta} = p, \qquad \dot{p} = -\omega^2 \sin(\theta).$$

The separatrix energy is $E_\text{sep} = \omega^2$ (the value of $H$ at the unstable equilibrium $\theta = \pm \pi$, $p = 0$); orbits with $E < E_\text{sep}$ librate, with $E > E_\text{sep}$ rotate, and exactly on $E = E_\text{sep}$ asymptote to the saddle.

## Numerical method

- **Discretization**: velocity-Verlet integrator from `shared/js/engine/symplectic.js`, mode `integrator: 'verlet'`. For a separable Hamiltonian (q-only acceleration), the corrector path collapses to identity and the scheme is exact velocity-Verlet (symplectic, 2nd order). No Christoffel terms, no qdot-dependence.
- **Time step**: dt = 1e-2 s. With omega = 1, the natural pendulum period is 2 pi, so dt is roughly 1/630 of a period. The empirical |dE/E| stays below 1e-3 over 10^4 steps per tracer.
- **State layout**: positions = N angles (theta_i), velocities = N momenta (p_i), all in one Float64Array. accelerationFn computes $-\omega^2 \sin(\theta_i)$ for each $i$. This is independent oscillators sharing the engine; per-tracer energy is computed on demand.
- **Tracer count**: N = 256 by default. Initial blob is a 2D Gaussian in $(\theta, p)$ with $\sigma_\theta = 0.15$ rad and $\sigma_p = 0.15$ (matching scales since $\omega = 1$). Sampled deterministically via `shared/js/render/rng.js` with seed 0xC0FFEE.
- **Phase-space area diagnostic**: the playground reports a covariance-matrix area estimate $A = 2\pi \sqrt{\det \Sigma}$ where $\Sigma$ is the empirical 2x2 covariance of $(\theta_i, p_i)$ across the N tracers. For a Gaussian cloud the covariance-determinant area equals the analytic 1-sigma area; under symplectic flow the determinant is conserved exactly (the Jacobian of the flow is unit-determinant). Reported in the live readout. (A convex-hull-based area is a stretch goal; the covariance area is more robust under filamentation.)
- **RNG**: `shared/js/render/rng.js` `makeRng(0xC0FFEE)` for the initial Gaussian sample; deterministic afterward.

## Controls

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| blob center | drag handle on phase-portrait canvas | (rad, p-units) | theta in (-pi, pi], p in [-3, 3] | (theta=0.6, p=0) | center of the initial Gaussian blob; double-click to reset to default |
| reset | button | N/A | N/A | N/A | re-sample tracers from the Gaussian and zero the simulation clock |
| play / pause | button | N/A | N/A | play | toggle time integration |

## Expected qualitative features

### Visible in the default golden frames

The captureFraction sweep from 0 to 1 spans 6 seconds of simulation time (approximately one full libration period for the default blob center at theta = 0.6 rad). The five frames must show:

- At t = 0 (`t-000`), the tracer cloud is a localized Gaussian centered at (0.6, 0). The cloud is approximately circular in phase space at this scale ($\sigma_\theta = \sigma_p = 0.15$).
- At t > 0 (`t-025`, `t-050`, `t-075`), the cloud orbits the stable equilibrium and progressively deforms; the separatrix curve and the librating closed contour are visible as dashed reference lines.
- At t = 6 s (`t-100`), the cloud has gone through approximately one libration period and visibly retains its area while stretching tangentially.
- In every frame the off-white background and the accent-colored tracer dots dominate; no rainbow palette.

### Available via user interaction

- Dragging the blob center across the separatrix moves tracers into the rotation regime; the cloud then flows monotonically in $\theta$ and visibly stretches around the separatrix into a long filament.
- The live area readout stays within a few percent of its initial value over hundreds of seconds, matching Liouville to within the covariance estimator noise (no-source: standard-result on Liouville for Hamiltonian flow; see analytical mechanics texts).

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold | notes |
|-----------|-------------------|-----------|-------|
| Total energy of each tracer | strong | for any single tracer initialized below the separatrix, $|dE/E| < 10^{-3}$ over $10^4$ dt at dt = 1e-2 | confirms the engine is integrating symplectically and the energyFn is correct |
| Phase-space area (covariance determinant) | strong | $|\det \Sigma(t) - \det \Sigma(0)| / \det \Sigma(0) < 5\%$ over $10^3$ steps for the default blob | $\det \Sigma$ is the squared 1-sigma area; conservation is the direct empirical witness of Liouville's theorem |
| Per-tracer reproducibility | strong | at seed 0xC0FFEE, the $(\theta_i, p_i)$ of every tracer at step 1000 matches between two runs to machine precision | guards against RNG drift in the initial sample |

The 5 percent gate on $\det \Sigma$ is empirical: in the librating regime the cloud rotates rigidly and $\det \Sigma$ is preserved to engine precision (~1e-5); in regimes that approach the separatrix, the Gaussian assumption breaks down and the covariance loses its sharp interpretation, so 5 percent is the band where the metric remains meaningful.

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| $\omega \to 0$ | free rotor: $p_i$ constant, $\theta_i = \theta_i(0) + p_i t$; cloud shears affinely without area loss | elementary kinematics |
| small-amplitude blob at (0, 0) | linearized: cloud rotates rigidly in $(\theta, p)$ with period $2\pi / \omega$; circular blob stays circular | Strogatz Section 6.5 Conservative Systems |
| large-amplitude near separatrix | cloud stretches into a thin filament along the separatrix curve in finite time | Strogatz Section 6.7 Pendulum |
| $\omega \to \infty$ | rapid oscillation; energy per tracer accumulates the $\omega^2$ dependence cleanly | scaling of $H$ |

## Visual fallback

Primary validation is via the energy and area gates plus per-tracer reproducibility. The visual SSIM > 0.92 against committed golden frames at the default IC is the secondary gate.

## Citations

1. **Strogatz, Steven H.** "Nonlinear Dynamics and Chaos." 2nd ed., Westview/CRC Press, 2015. Bib key `strogatz2015`. Sections:
   - Section 6.5 "Conservative Systems": energy conservation in 2D conservative systems and phase-portrait structure.
   - Section 6.7 "Pendulum": the canonical pendulum phase portrait, separatrix, and libration vs rotation regimes.
2. The engine itself is `shared/js/engine/symplectic.js`, validated in `tests/engines/symplectic.test.mjs`. Liouville's theorem (Hamiltonian flow preserves phase-space volume) is a standard result in analytical mechanics. [no-source: standard-result]

## Stretch goals

- Switch tracer-area estimator from covariance determinant to a true symplectic-area estimator (e.g., Welzl's smallest enclosing ellipse, or oriented bounding box from the principal axes of the covariance).
- Add a tracer-trail mode that draws the $(\theta, p)$ trajectory of a representative subset of tracers, not just their current positions.
- Add a second blob with a contrasting color to compare regular and chaotic regions (chaotic only after extension to e.g. a Henon-Heiles 2D potential).
- Slider for $\omega$; redraws the separatrix curve as $\omega$ changes.
- Fade-trail on tracer positions to show the recent history per tracer.

## Risk register

1. **Covariance ceases to describe the cloud once it filaments.** A Gaussian assumption breaks down when the cloud stretches along the separatrix. Mitigation: the spec gates on $\det \Sigma$ only in librating regimes; outside, the area readout is shown but flagged with a confidence indicator.
2. **Theta wraparound at $\pm \pi$.** Tracers in the rotation regime cross $\theta = \pi$ continuously; without wrapping, the on-canvas position is discontinuous and the covariance jumps. Mitigation: wrap $\theta$ into $(-\pi, \pi]$ for display only (not for the engine state). The engine continues to integrate on the universal cover.
3. **Initial Gaussian sample straddling the saddle.** A blob center near $(\pi, 0)$ seeds tracers that straddle the unstable saddle; some librate, some rotate. This is the intended pedagogy but distorts the area metric; flag explicitly when blob centers fall within 0.2 rad of $(\pi, 0)$.
