---
title: Lorenz Attractor
slug: lorenz-attractor
status: deprecated
superseded_by: lorenz-attractor-3d-ensemble
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

# Lorenz Attractor

## Physical setup

The Lorenz 1963 system: a three-variable truncation of the Saltzman convection equations, written

$$\dot x = \sigma (y - x),\quad \dot y = x (\rho - z) - y,\quad \dot z = x y - \beta z.$$

For the classical parameter set $\sigma = 10,\ \rho = 28,\ \beta = 8/3$ the system has a strange attractor whose two-lobed butterfly geometry has become the canonical pictorial signature of deterministic chaos. The playground renders the (x, z) projection in real time, with the live state position highlighted.

## Governing equations

Three-dimensional first-order ODE in $\mathbb{R}^3$, integrated by `shared/js/engine/ode-rk.js` (classical RK4 by default; user can switch to adaptive DP54). The system is dissipative, with phase-space contraction rate $\nabla \cdot F = -(\sigma + 1 + \beta) = -41/3$ for the default parameters. Beyond the supercritical Hopf bifurcation at $\rho_H = \sigma(\sigma + \beta + 3) / (\sigma - \beta - 1) \approx 24.74$ both nontrivial fixed points are unstable and trajectories settle onto the strange attractor.

## Numerical method

- **Discretization**: RK4 with fixed $dt = 0.005$. Five orders smaller than the slowest timescale on the attractor (about 1 time unit). For analysts who want adaptive control, the engine `method: 'dop853'` mode is also exposed; goldens use RK4 for reproducibility.
- **Spatial domain**: none (ODE system).
- **Initial condition**: $(x, y, z) = (1, 1, 1)$ by default; warmup of 1000 steps before any drawing or invariant measurement to land on the attractor.
- **Max-Lyapunov estimator**: parallel tangent-vector integration with periodic renormalization (Benettin et al. 1980). Tangent vector is rescaled to unit norm every 50 steps; the accumulated log stretch divided by elapsed affine parameter gives the running estimate of $\lambda_\max$.
- **Seed**: not stochastic; deterministic given IC.

## Controls

| name | type | range | default | sets |
|------|------|-------|---------|------|
| sigma | slider | 5 to 20 | 10 | Prandtl number |
| rho | slider | 10 to 60 | 28 | Rayleigh number |
| beta | slider | 1 to 4 | 8/3 | aspect ratio |
| speed | slider | 0.5 to 5 | 1 | simulation-time units per real second |
| reset | button | n/a | n/a | clear trail, restart from default IC |
| pause | button | n/a | n/a | freeze the integrator |

## Expected qualitative features

### Default golden frames

Capture sweep holds parameters at the classical (10, 28, 8/3) and varies the integration-time fraction. `t-000` shows the first trail samples emerging from the IC, `t-100` shows ~ 80 dimensionless time units of attractor traversal. Each frame must include:

- The (x, z) projection of the trail in the accent colour, with the current state marked as a filled dot.
- An info readout in monospace: current $\rho$, current $(\sigma, \beta)$, running $\lambda_\max$ estimate, integration time, step count.
- Both wing lobes of the attractor visible at t-050 onwards.

### Through user interaction

- Lowering $\rho$ below the Hopf threshold should drive the trajectory onto one of the two nontrivial fixed points.
- Setting $\rho \approx 100$ enters the periodic-orbit regime (period-doubling cascade).
- Switching to DP54 mode reveals adaptive timestep behaviour (visible in the readout's `lastDt` field).

## Invariants and acceptance thresholds

| invariant | strong / medium | threshold | notes |
|-----------|-----------------|-----------|-------|
| Max-Lyapunov exponent | strong | $\lambda_\max \in [0.7, 1.05]$ over $10^4$ tangent-rescale cycles | analytic value 0.9056 (Sprott 2003 review) |
| Trajectory boundedness | strong | $\max\sqrt{x^2 + y^2 + z^2} < 100$ over 50 time units | attractor is bounded |
| Reproducibility | strong | bit-identical $y(t)$ at fixed IC and fixed RK4 dt | RK4 is deterministic |
| Phase-space contraction | medium | average divergence converges to $-(\sigma + 1 + \beta)$ within 5 percent | not enforced as a gate |

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| $\rho < 1$ | origin globally attracting | Strogatz Section 9.2 |
| $1 < \rho < \rho_H$ | two stable fixed points at $C^\pm = (\pm\sqrt{\beta(\rho-1)}, \pm\sqrt{\beta(\rho-1)}, \rho-1)$ | Strogatz Section 9.2 |
| $\rho > \rho_H$ (classical $\rho = 28$) | strange attractor | Strogatz Section 9.3 |
| $\rho \gg 28$ | windows of periodic orbits interleaving chaos | Strogatz Section 9.5 |

## Aesthetic waivers

1. **Canvas 2D font sizes hard-coded** in the readout overlay. Standard waiver across all rendered playgrounds.

## Citations

1. **Strogatz, S.** "Nonlinear Dynamics and Chaos", 2nd ed., Westview / CRC Press, 2015. Bib key `strogatz2015`. Sections 9.1 (A Chaotic Waterwheel), 9.2 (Simple Properties of the Lorenz Equations), 9.3 (Chaos on a Strange Attractor), 9.4 (Lorenz Map), 9.5 (Exploring Parameter Space). All verified in chapter_index.
2. **Ott, E.** "Chaos in Dynamical Systems", 2nd ed., Cambridge University Press, 2002. Bib key `ott2002`. Sections 3.2 (The Lorenz system) and 3.4 (Strange attractors and chaos). Verified.
3. **Benettin, G., Galgani, L., Giorgilli, A., and Strelcyn, J.-M.** Meccanica 15:9-20 (1980). Bib key `benettin1980`. The tangent-vector renormalization method used for $\lambda_\max$.

## Stretch goals

- Add a full Lyapunov-spectrum readout (three exponents via Benettin QR).
- Kaplan-Yorke dimension panel (medium invariant).
- Parameter-space sweep showing the period-doubling cascade.

## Risk register

1. **Long Lyapunov runs are slow.** The 12,000-sample test takes ~ 1 sec headless; in-browser the playground caps the live Lyapunov estimator at one renormalization every 50 frames.
2. **At very small $\beta$ or very large $\rho$ the integrator can transiently overshoot the basin** before re-entering. Mitigation: warmup window before drawing.
