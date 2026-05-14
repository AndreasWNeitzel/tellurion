---
title: Kepler Orbit Explorer
slug: kepler-orbit-explorer
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: []
curriculum_year: bsc-y2s1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [stellar, exoplanets, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Kepler Orbit Explorer

## Physical setup

A test particle orbits a fixed central mass under inverse-square gravity in 2D. The system is the Newtonian Kepler problem in geometric units $GM = 1$ with the central mass at the origin and the test particle at $(x, y)$. The orbit is integrated by the velocity-Verlet branch of `shared/js/engine/symplectic.js`, which conserves total energy and angular momentum to high precision over thousands of periods. The user sets the orbit by adjusting two sliders for semi-major axis $a$ and eccentricity $e$; the playground initializes the particle at apastron with the corresponding velocity and renders the resulting closed orbit alongside the live energy, angular momentum, and Laplace-Runge-Lenz (LRL) vector readouts. At low $e$ the orbit is a near-circle; at high $e$ it is a sharply elongated ellipse with rapid perihelion passage.

## Governing equations

The equations of motion in 2D Cartesian coordinates are

$$\ddot{x} = -\frac{x}{r^3}, \qquad \ddot{y} = -\frac{y}{r^3}, \qquad r = \sqrt{x^2 + y^2}.$$

Conserved quantities for the test particle:

$$E = \tfrac{1}{2}(v_x^2 + v_y^2) - \frac{1}{r}, \qquad L = x v_y - y v_x, \qquad \vec{A} = \vec{v} \times \vec{L} - \hat{r}.$$

For a bound orbit the semi-major axis and eccentricity follow from the conserved quantities: $a = -1/(2E)$, $|\vec{A}| = e$.

Initial conditions: place the particle at apastron $(r_\text{ap}, 0)$ with $r_\text{ap} = a(1 + e)$ and tangential velocity $v = \sqrt{(1 - e)/(a(1 + e))}$ in the $+y$ direction. With these IC, $E = -1/(2a)$ and $L = r_\text{ap} v$.

## Numerical method

- **Discretization**: velocity-Verlet from `shared/js/engine/symplectic.js`, integrator `'verlet'`. The Kepler problem is separable in $(q, p)$, so the symplectic property is exact (no predictor-corrector iteration is engaged). Diagnostics include `energyFn`, `angularMomentumFn`, and `lrlFn`.
- **Time step**: dt = 0.01 in geometric units. With period $T = 2\pi a^{3/2}$, dt covers each period by $\sim 2\pi a^{3/2} / 0.01 \approx 600 a^{3/2}$ steps; at $a = 1$ this is 628 steps per period, comfortable. At apastron the orbital timescale is well-resolved; at perihelion ($r = a(1 - e)$, $v = \sqrt{(1 + e)/(a(1 - e))}$) the local timescale tightens by a factor $\sqrt{(1 + e)/(1 - e)} / (1 - e)$. For $e = 0.6$, dt/tau_peri = 0.05, the value validated in `tests/engines/symplectic.test.mjs`.
- **Run length**: 10^4 periods at $a = 1$, $e = 0.6$ pass $|dE/E| < 10^{-3}$ and $|dL/L| < 10^{-10}$ in the engine test. The playground integrates indefinitely while playing; the live readout shows the running drift.
- **Trail**: the last 1500 trajectory samples are drawn as an accent-colored polyline trail behind the particle.
- **RNG**: not used. Deterministic IC, deterministic integrator.

## Controls

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| a (semi-major axis) | slider | dimensionless (GM=1) | 0.5 to 2.0 | 1.0 | size of the orbit; $T = 2\pi a^{3/2}$ |
| e (eccentricity) | slider | dimensionless | 0.0 to 0.9 | 0.6 | shape of the orbit; 0 circular, 1 parabolic |
| reset | button | N/A | N/A | N/A | re-seed IC at apastron with the current (a, e) and clear the trail |
| play / pause | button | N/A | N/A | play | toggle integration |

## Expected qualitative features

### Visible in the default golden frames

The captureFraction sweep maps to eccentricity along $e = 0.6 \cdot \text{frac}$ from 0 to 0.6 (frame to frame), with $a = 1$ fixed. Each frame integrates 1 period at the chosen eccentricity before capture. The five frames show:

- t-000 ($e = 0$): a perfect circular orbit, particle at $(1, 0)$ with the trail covering the full circle.
- t-025 ($e = 0.15$): slightly elongated ellipse.
- t-050 ($e = 0.3$): more elongated, perihelion now visible to the left.
- t-075 ($e = 0.45$): clearly eccentric, perihelion approaches the central mass.
- t-100 ($e = 0.6$): the engine-test benchmark eccentricity; visibly elongated, with the central mass close to the perihelion focus.

In every frame the central mass is a filled dot at the origin, the particle is a filled accent dot at apastron-end of its orbit (close to the starting position after one period), and the trail is the accent-colored polyline showing the orbit shape.

### Available via user interaction

- Dragging the eccentricity slider toward 0.9 increases the orbit elongation and decreases perihelion distance to $a(1 - e)$. At $e = 0.9$ perihelion is at $r = 0.1 a$, a regime where the engine test (run at $e = 0.6$) does not directly validate; the live $|dE/E|$ readout reports the drift for the user.
- Dragging $a$ toward 0.5 shrinks the orbit; toward 2.0 enlarges it. The period $T = 2\pi a^{3/2}$ is shown in the readout.

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold | notes |
|-----------|-------------------|-----------|-------|
| Energy conservation | strong | $|dE/E| < 10^{-3}$ over $10^3$ periods at $a = 1$, $e = 0.6$, dt = 0.01 | mirror of the `tests/engines/symplectic.test.mjs` Kepler case at a shorter run length |
| Angular momentum conservation | strong | $|dL/L| < 10^{-10}$ over $10^3$ periods at $a = 1$, $e = 0.6$ | central force; angular momentum is exact under symplectic Verlet to machine precision modulo cross-products |
| LRL vector bounded | medium | $|\,|\vec{A}|(t) - |\vec{A}|(0)\,| / |\vec{A}|(0) < 5 \times 10^{-3}$ over $10^3$ periods | secular drift would signal an integrator failure; bounded drift is the Verlet baseline |

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| $e = 0$ | circular orbit of radius $a$; constant speed $v = 1/\sqrt{a}$; $|\vec{A}| = 0$ exactly | elementary Kepler |
| $e \to 1$ | parabolic limit; orbit unbounded, $E \to 0$, $T \to \infty$ | elementary Kepler |
| small $a$ (close orbit) | rapid period, larger gravitational binding $|E| = 1/(2a)$ | elementary Kepler |
| $a = 1, e = 0.6$ canonical | $E = -0.5$, $L = 0.8$, $|\vec{A}| = e = 0.6$, $T = 2\pi$ | Newman Exercise 8.12 "Orbit of the Earth" |

## Visual fallback

Primary validation is via the three invariants. The SSIM > 0.92 visual gate confirms five eccentricity-sweep frames at fixed seed render reproducibly.

## Citations

1. **Newman, Mark.** "Computational Physics." Revised printing, CreateSpace, 2013. Bib key `newman2013`. Exercise 8.12 "Orbit of the Earth" presents the 2D Kepler problem in dimensionless form and discusses the velocity-Verlet integrator at the level used here. Verified in chapter_index.
2. Engine: `shared/js/engine/symplectic.js`, integrator `'verlet'`, validated in `tests/engines/symplectic.test.mjs` for Kepler at $e = 0.6$ over $10^4$ periods.

## Stretch goals

- Direct-manipulation IC: drag the particle to set the initial position; then drag a velocity vector to set $\vec{v}$. Computes $(a, e)$ on the fly.
- LRL vector overlay: render $\vec{A}$ as a small arrow from the central mass along the major axis (its analytic direction).
- General relativity toggle: switch to a Schwarzschild-corrected radial potential and show perihelion precession in real time.
- Multi-orbit comparison: overlay two orbits at different $(a, e)$ pairs in contrasting accent colors.
- Phase-space readout: side panel plotting $(r, \dot{r})$ as the integrand evolves.

## Risk register

1. **Floating-point error at high eccentricity.** At $e = 0.9$, perihelion is at $r = 0.1 a$ and $v$ is high; the velocity-Verlet error per step scales as $dt^2 / \tau_\text{peri}^3$, which grows steeply. Mitigation: the spec validates only at $e \le 0.6$; the slider extends to 0.9 with the explicit caveat that the live $|dE/E|$ reports the drift and the user can see when it crosses the gate.
2. **Long-run trail buffer.** The 1500-sample trail is comfortable for a $\le 2$-period view; at very small $a$ the period is short and the trail rapidly fills. Mitigation: trail length is fixed in samples, not in time; users may see only a partial orbit at $a = 0.5$.
3. **Slider re-init resets the trail.** Each slider change resets the IC at apastron, which is the right behavior for parameter exploration but loses the historical trail. Mitigation: explicitly documented; trail length is in samples after the most recent reset.
