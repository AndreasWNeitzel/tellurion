---
title: Kepler Orbit Explorer
slug: kepler-orbit-explorer
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
primary_citation: carroll-ostlie
supporting_ucs: []
curriculum_year: bsc-y2s1
hook: 'Set an orbit''s size and eccentricity and see all three Kepler laws at once: the ellipse with the Sun at a focus, the equal-area sweep, and T squared proportional to a cubed.'
one_paragraph: 'One controllable orbit (semi-major axis a, eccentricity e) shows all three of Kepler''s laws. The body traces an ellipse with the Sun at a focus (first law); the radius vector sweeps equal-area wedges in equal time (second law: the shaded wedges all have the same area, so the body races at perihelion and crawls at aphelion); and the period follows T squared proportional to a cubed (third law, in the diagnostic). The motion is inverse-square gravity integrated with an energy-conserving symplectic velocity-Verlet step; the equal-time wedges are placed from Kepler''s equation. The inner planets (Mercury to Mars, real eccentricities) can be toggled on as context and to populate the third-law line. Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 2.'
tags: [stellar, exoplanets, animation, live-readout, interactive]
difficulty: 3
tier: hero
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Raise the eccentricity: the wedges near the Sun get short and fat, those far away long and thin, but all equal in area.
  - Watch the speed readout peak at perihelion and bottom out at aphelion.
  - Slide the semi-major axis and your point climbs the third-law line; toggle the planets on for context.
references:
  - "Carroll, Ostlie, An Introduction to Modern Astrophysics, Second ed."
---

# Kepler Orbit Explorer

## Explainer

### What you are looking at

A planet orbits a star. Set the size and the shape with two sliders and
watch the closed ellipse it traces, with live readouts of the three
quantities that never change: energy, angular momentum, and a third,
less famous one (the Laplace-Runge-Lenz vector) that points along the
orbit and explains why the ellipse does not slowly rotate.

### The equations

In units where $GM = 1$, the inverse-square law of gravity gives

$$\ddot x = -\frac{x}{r^3}, \qquad \ddot y = -\frac{y}{r^3},
  \qquad r = \sqrt{x^2 + y^2}.$$

Three conserved quantities pin the orbit down:

$$E = \tfrac12 v^2 - \frac1r, \qquad L = x v_y - y v_x,
  \qquad \vec A = \vec v \times \vec L - \hat r.$$

$E$ (energy) fixes the size, $a = -1/(2E)$. $L$ (angular momentum) sets
how round it is. The Laplace-Runge-Lenz vector $\vec A$ points from the
focus to perihelion and has magnitude equal to the eccentricity,
$|\vec A| = e$. Its constancy is special to the $1/r$ force, which is
exactly why Kepler orbits are closed ellipses and not precessing
rosettes (Bertrand's theorem again).

### Why the readouts matter

The simulation integrates the motion with a symplectic velocity-Verlet
scheme, which is built to conserve energy and angular momentum over
thousands of orbits rather than letting them creep. The live $|dE/E|$
and $|dL/L|$ are tiny, which is the honesty check: the closed,
non-drifting ellipse you see is the real physics, not a numerical
artifact. Watch $\vec A$ stay frozen in direction; that frozen arrow is
the deep reason the orbit closes.

### Things to try

- Raise the eccentricity and watch the orbit elongate, fast at
  perihelion, slow at aphelion (Kepler's second law in action).
- Confirm $a$ tracks $-1/(2E)$ and $|\vec A|$ tracks $e$ in the
  readouts as you move the sliders.
- Note the LRL arrow never rotates: pure $1/r$ gravity, no precession.

### Where this comes from

The dimensionless Kepler problem, the conserved $E$, $L$, and
Laplace-Runge-Lenz vector, and the velocity-Verlet integration follow
Newman, *Computational Physics* (2013), Exercise 8.12, with the LRL
treatment standard in Goldstein, *Classical Mechanics*, Chapter 3.

## Physical setup

The four inner planets (Mercury, Venus, Earth, Mars, with real semi-major axes and eccentricities) and one adjustable comet orbit a fixed central mass under inverse-square gravity in 2D, in geometric units GM = 1 (a = 1 is Earth's orbit, period 1 yr = 2 pi). Each body is independent (no mutual interaction) and is integrated by the velocity-Verlet branch of `shared/js/engine/symplectic.js`, which conserves total energy over thousands of periods. Each body starts at periastron with the analytic speed. The scene renders the orbit ellipses, trails, and the Sun; the diagnostic plots Kepler's third law for every body.

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

- comet a (0.5 to 2.4): the semi-major axis of the adjustable comet; its
  point slides along the Kepler-III line and its orbit resizes.
- speed (0.3 to 3): the time rate of the animation.
- Reset, Pause.

The four planets are fixed at their real elements; only the comet and the
playback speed are adjustable.

## Expected qualitative features

- Inner planets orbit faster than outer ones: Mercury laps several times
  per Earth year; Mars takes nearly two years.
- Each body speeds through perihelion and slows at aphelion (Kepler II),
  visible in the eccentric comet and Mercury.
- Every body (planets and comet) lies on a single straight line in the
  T-squared versus a-cubed diagnostic (Kepler III).
- Sliding the comet outward moves its point up the Kepler-III line and
  enlarges its eccentric orbit in the scene.
- The energy-drift readout stays tiny (symplectic integration), so the
  orbits remain closed.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| periastron IC matches a(1-e) and the analytic speed | < 1e-8 | invariants test |
| Kepler's third law T = 2 pi a^(3/2) | exact | invariants test |
| eccentricity and a recovered from the state | < 1e-8 | invariants test |
| Earth returns near its IC after one period | < 2% of a | invariants test |
| total energy conserved (symplectic) | rel drift < 1e-2 | live readout |
| reproducible: bit-identical after 1000 steps | exact | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

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
