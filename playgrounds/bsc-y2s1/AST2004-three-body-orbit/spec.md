---
title: Three-Body Figure-Eight Choreography
slug: three-body-orbit
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: [FIS2021, FIS1013]
curriculum_year: bsc-y2s1
---

# Three-Body Figure-Eight Choreography

## Physical setup

Three equal masses $m_1 = m_2 = m_3 = 1$ interact under Newtonian gravity in 2D with $G = 1$. At the Chenciner-Montgomery initial condition (2000) the three masses chase one another on a single closed figure-eight curve, with period $T \approx 6.3259$. This is the most famous "choreography" solution of the planar three-body problem. The playground integrates the system with the symplectic engine and renders the three trails. A slider perturbs the initial velocity of body 3 by a small amount $\delta v$; at $\delta v = 0$ the choreography is stable indefinitely, and at $\delta v > 0$ the system slowly destabilizes.

## Governing equations

For three bodies indexed $i = 1, 2, 3$ with mass $m_i$ and position $\vec{r}_i$:

$$\ddot{\vec{r}}_i = \sum_{j \ne i} G m_j \frac{\vec{r}_j - \vec{r}_i}{|\vec{r}_j - \vec{r}_i|^3}.$$

Conserved quantities: total energy $E = \tfrac{1}{2}\sum_i m_i |\dot{\vec{r}}_i|^2 - G \sum_{i < j} m_i m_j / |\vec{r}_i - \vec{r}_j|$, total linear momentum $\vec{P} = \sum_i m_i \dot{\vec{r}}_i$, total angular momentum $L = \sum_i m_i (x_i \dot{y}_i - y_i \dot{x}_i)$.

Chenciner-Montgomery initial conditions ($G = m_i = 1$):

$$\vec{r}_1 = (0.97000436, -0.24308753), \qquad \vec{r}_2 = -\vec{r}_1, \qquad \vec{r}_3 = (0, 0).$$
$$\vec{v}_3 = (-0.93240737, -0.86473146), \qquad \vec{v}_1 = \vec{v}_2 = -\tfrac{1}{2}\vec{v}_3.$$

Period $T \approx 6.3259$.

## Numerical method

- **Discretization**: velocity-Verlet from `shared/js/engine/symplectic.js`, integrator `'verlet'`. State is the 6-vector of positions $q = (x_1, y_1, x_2, y_2, x_3, y_3)$; the engine treats it as a 6-DOF Hamiltonian with q-only acceleration.
- **accelerationFn**: pairwise gravity in $O(N^2)$. The three pairwise contributions are accumulated for each body.
- **Time step**: dt = 0.005. Period is $T \approx 6.326$, so dt resolves each period by 1265 steps. The minimum approach distance on the figure-eight is $\sim 0.4$ (the curve crosses itself at the origin); dt = 0.005 is well within the resolution at closest approach.
- **Run length**: the live integration runs indefinitely; visual capture spans 4 periods (~25 proper time units, 5000 steps).
- **Trails**: each body's trail stores the last 6000 (x, y) samples (~ 1 period of history at dt = 0.005).
- **RNG**: not used.

## Controls

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| dv (perturbation) | slider | velocity units | 0.0 to 0.01 | 0.0 | $\delta v$ added to body 3 initial velocity in $+x$; small $\delta v$ destabilizes the choreography over many periods |
| reset | button | N/A | N/A | N/A | re-seed Chenciner-Montgomery IC with current $\delta v$ |
| play / pause | button | N/A | N/A | play | toggle integration |

## Expected qualitative features

### Visible in the default golden frames

At $\delta v = 0$, captureFraction maps to 0 .. 4 periods of integration. The five frames show:

- t-000: three bodies at their initial positions on the figure-eight curve. No trails yet.
- t-025, t-050, t-075: progressively longer trails along the closed curve. By t-050 the trails cover roughly one period and start to overlap.
- t-100: trails cover ~4 periods; all three trails lie on top of each other on the same figure-eight curve (because each body traces the same path shifted in time by T/3).

In every frame the central crossing point of the figure-eight is at the origin; bodies are filled colored dots with three distinct categorical hues from the design tokens ($--cat-1$, $--cat-2$, $--cat-3$).

### Available via user interaction

- Dragging $\delta v$ to 0.01 perturbs the initial velocity; the closed figure-eight drifts off and one body eventually escapes over many periods.

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold | notes |
|-----------|-------------------|-----------|-------|
| Total energy conservation | strong | $|dE/E| < 10^{-3}$ over $10^4$ dt at canonical IC | symplectic Verlet on a separable Hamiltonian |
| Total linear momentum conservation | strong | $|\vec{P}(t) - \vec{P}(0)| < 10^{-10}$ over $10^4$ dt | pairwise internal forces sum to zero by Newton's third law; the integrator never adds external momentum |
| Total angular momentum conservation | strong | $|L(t) - L(0)| < 10^{-10}$ over $10^4$ dt | the canonical Chenciner-Montgomery IC has $L = 0$; numerical drift stays at machine precision |

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| $\delta v = 0$ (canonical IC) | stable figure-eight, all three bodies trace the same closed curve | Newman Exercise 8.16; Chenciner and Montgomery 2000 (no-source for the specific IC values) |
| $m_3 \to 0$ (set body 3 to test particle) | bodies 1 and 2 orbit Keplerian around the center of mass; body 3 is a passive tracer | Kepler problem (Newman Exercise 8.12) |

## Visual fallback

Primary validation is via the three invariants. SSIM > 0.92 against five committed golden frames at the canonical IC is the secondary gate.

## Citations

1. **Newman, Mark.** "Computational Physics." Revised printing, CreateSpace, 2013. Bib key `newman2013`. Exercise 8.16 "Three-body problem" sets up the planar three-body integration with mutual gravity. Verified in chapter_index.
2. Engine: `shared/js/engine/symplectic.js`, integrator `'verlet'`. Validated on Kepler at $e = 0.6$ over $10^4$ periods in `tests/engines/symplectic.test.mjs`; the 6-DOF three-body Hamiltonian is separable, so the symplectic guarantee is exact.
3. The Chenciner-Montgomery initial condition (2000) for the figure-eight choreography. Numerical values are reproduced from the original paper (Chenciner and Montgomery, Annals of Mathematics 152, 881-901, 2000); the project bibliography does not yet include celestial-mechanics journal entries beyond Benettin 1980. Tagged `[no-source: chenciner-montgomery-numerical-IC]` for the specific IC values.

## Stretch goals

- Replace the slider with a click-and-drag handle on the canvas: drag body 3's initial velocity vector to perturb.
- Speed-up slider for playback.
- Show the center of mass and the (theoretical) total-momentum vector overlay; both should be exactly zero by construction.
- Toggle between figure-eight and other classical three-body solutions (Schubart isosceles, Lagrange equilateral).

## Risk register

1. **Close-approach blow-up.** Large $\delta v$ can let two bodies come arbitrarily close, where Verlet at fixed dt loses precision and one body shoots off. Mitigation: slider range capped at 0.01 (empirical perturbation that destabilizes slowly).
2. **Trail clutter.** Three overlapping trails on the same curve are noisy. Mitigation: distinct categorical hues ($--cat-1$, $--cat-2$, $--cat-3$) plus alpha decay.
3. **Numerical drift of the choreography.** Even at $\delta v = 0$ the $O(dt^2)$ error slowly rotates the figure-eight; over 4 periods at dt = 0.005 this is invisible (<0.01 percent), but at very long runs it accumulates. Documented in the spec.
