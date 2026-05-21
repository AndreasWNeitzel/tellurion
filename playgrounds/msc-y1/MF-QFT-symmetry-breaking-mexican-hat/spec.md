---
title: Spontaneous Symmetry Breaking: the Mexican-Hat Potential
slug: symmetry-breaking-mexican-hat
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-QFT
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: higgs1964
hook: 'A complex scalar with V = -mu^2 |phi|^2 + lambda |phi|^4 cannot sit at the symmetric point: it rolls off the unstable peak to the brim at v = sqrt(mu^2/2 lambda), choosing a phase. The radial wobble is the Higgs (m_H = sqrt(2) mu) and the free run around the brim is the massless Goldstone; heat melts the order.'
one_paragraph: 'An interactive Mexican-hat (wine-bottle) potential for a complex scalar (Goldstone 1961; Higgs 1964; Peskin and Schroeder Ch. 11). V(rho) = -mu^2 rho^2 + lambda rho^4 with rho = |phi| has an unstable maximum at rho = 0 and a degenerate circle of minima at v = sqrt(mu^2/2 lambda) (depth -mu^4/4 lambda); the field picks one point on the brim, spontaneously breaking the U(1) symmetry. The radial excitation is the Higgs with m_H = sqrt(2) mu (canonical normalisation) and the angular excitation along the flat brim is the massless Goldstone boson. A thermal mass shifts the rho^2 coefficient to -mu^2 + c T^2, so above T_c = sqrt(mu^2/c) the minimum returns to the origin and the symmetry is restored in a second-order transition with v(T) ~ sqrt(T_c - T). The surface panel shows V as a 3D hat; the slice panel is the double well with the steep Higgs direction and the flat Goldstone direction and a ball that rolls into the brim; the order-parameter panel plots v(T) restoring to zero above the critical temperature. This one toy potential carries the core ideas of spontaneous symmetry breaking, the Goldstone theorem and finite-temperature symmetry restoration that underlie the Higgs mechanism and phase transitions. Reference: Peskin and Schroeder, An Introduction to Quantum Field Theory, Chapter 11; Goldstone 1961; Higgs 1964.'
tags: [quantum-field-theory, symmetry-breaking, higgs, goldstone, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [mu, lam, view]
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
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---

# Spontaneous Symmetry Breaking: the Mexican-Hat Potential

## Explainer

### What you are looking at

Sometimes the laws are symmetric but the world is not: a pencil
balanced on its tip obeys rotationally symmetric physics yet must
fall in one direction. Spontaneous symmetry breaking is that idea in
field theory, and it is how particles get mass (the Higgs mechanism).
The playground shows the Mexican-hat potential and what happens when
the field rolls off the top.

### The Mexican-hat potential

A complex scalar field $\phi$ has the potential

$$V(\phi) = -\,\mu^2\,|\phi|^2
  + \lambda\,|\phi|^4.$$

For $\mu^2<0$ the minimum is at $\phi=0$ (a symmetric bowl). But for
$\mu^2>0$ the origin becomes a hilltop and the minima form a circular
valley (the wine-bottle / sombrero shape) at

$$|\phi| = v = \sqrt{\frac{\mu^2}{2\lambda}}.$$

The Lagrangian is still perfectly symmetric under the phase rotation
$\phi\to e^{i\alpha}\phi$, but the field must settle at one point on
the circle, picking a direction and breaking the symmetry.

### Goldstone and Higgs

Expanding around the chosen vacuum splits the field's two real
components into two very different excitations:

- A radial mode (climbing the steep wall of the valley): massive,
  this is the Higgs boson, with $m_H^2 = 2\mu^2$.
- An angular mode (running freely around the flat circular valley):
  massless, the Goldstone boson, one for every broken continuous
  symmetry (Goldstone's theorem).

If the broken symmetry is gauged, that would-be massless Goldstone
mode is "eaten" by the gauge field, which thereby acquires a mass:
the Higgs mechanism, the reason the $W$ and $Z$ are heavy while the
photon stays massless. The playground sweeps $\mu^2$ and $\lambda$
and shows the potential change shape, the vacuum move onto the
circle, and the radial-vs-angular mode masses.

### Things to try

- Sweep $\mu^2$ through zero and watch the single central minimum
  split into a circular valley (the symmetry breaking).
- Identify the steep radial direction (massive Higgs) versus the
  flat angular direction (massless Goldstone).
- Increase $\lambda$ and watch the vacuum radius $v$ shrink while
  the Higgs mass changes.

### Where this comes from

The Mexican-hat potential, Goldstone's theorem, and the Higgs
mechanism follow Peskin and Schroeder, *An Introduction to Quantum
Field Theory*, Chapters 11 and 20, and Goldstone, Salam and Weinberg,
Phys. Rev. 127, 965 (1962).

## Physical setup

A complex scalar field `phi` with a wine-bottle potential. The
symmetric point `phi = 0` is an unstable maximum, so the field rolls
down to the circular trough (the brim) and settles at one phase,
spontaneously breaking the rotational `U(1)` symmetry. The radial
oscillation costs energy (the Higgs); the free slide around the brim
costs none (the massless Goldstone). Raising the temperature adds a
thermal mass that eventually flattens the hat and restores the
symmetry.

## Governing equations

Goldstone 1961; Higgs 1964:

```math
V(\rho) = -\mu^2 \rho^2 + \lambda \rho^4,\quad \rho = |\phi|,\quad
v = \sqrt{\frac{\mu^2}{2\lambda}},\quad V(v) = -\frac{\mu^4}{4\lambda},
```

`m_H = \sqrt{2}\,\mu` (radial, canonical normalisation),
`m_G = 0` (flat brim). Finite temperature:
`V_{eff} = (-\mu^2 + cT^2)\rho^2 + \lambda\rho^4`,
`T_c = \sqrt{\mu^2/c}`, and for `T < T_c`
`v(T) = \sqrt{(\mu^2 - cT^2)/2\lambda} \sim \sqrt{T_c - T}`.

## Stack note (WebGL relaxed to Canvas2D)

The backlog tagged this `webgl2`. The potential is axially symmetric,
so a depth-shaded Canvas2D pseudo-3D wireframe of revolution conveys
the wine-bottle shape, the rolling ball and the thermal flattening
exactly as a GPU surface would, while keeping the playground
deterministically gate-verifiable and avoiding the
WebGL-under-SwiftShader capture path. This satisfies the project stack
constraint with a documented justification (the same relaxation used
by the geodesics and scattering heroes). The simple wireframe has no
hidden-surface removal, so the ball depth on the surface is slightly
ambiguous; the radial-slice panel shows the ball at the exact
potential minimum without ambiguity.

## Numerical method

The potential, vacuum, depth, Higgs mass and the temperature-dependent
vev are closed form; the radial profile is sampled directly. The
sweep either rolls the ball from the peak to the brim (`roll`) or
heats the system through `T_c` (`heat`); the capture path maps capture
fraction directly to that, so reference frames are reproducible and
frame-rate independent. Deterministic, no RNG.

## Controls

- `mu^2` (share key `mu`): the tachyonic mass term; larger means a
  deeper hat and heavier Higgs.
- `lambda` (share key `lam`): the quartic coupling; larger pulls the
  brim inward (`v ~ 1/sqrt(lambda)`).
- `view` (share key `view`): roll to the brim (break the symmetry) or
  heat up (restore it).
- Reset (`mu^2 = 2`, `lambda = 0.5`, roll), Pause/Play (the sweep),
  Copy URL.

## Expected qualitative features

- The surface is a sombrero: a central bump, a circular trough at
  `v`, an outer wall.
- The radial slice is a double well; the ball sits at the minimum;
  the brim direction is flat (Goldstone).
- Heating raises `T`; the brim shrinks to the centre at `T_c` and
  `v(T) -> 0` as `sqrt(T_c - T)`.
- `m_H = sqrt(2) mu`; the Goldstone is exactly massless.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (8 tests):

1. `v = sqrt(mu^2/2 lambda)` to 0.1%, a stable minimum
   (`rho = 0` unstable).
2. `m_H = sqrt(2) mu`; Goldstone massless; `V` flat around the brim.
3. `V(v) = -mu^4/4 lambda < 0 = V(0)` (broken vacuum lower).
4. Restoration at `T_c = sqrt(mu^2/c)`, second order:
   `v(T) ~ sqrt(T_c - T)`, zero above `T_c`.
5. The finite-`T` potential is a wine bottle below `T_c`, a single
   bowl above.
6. Axial symmetry: `V` depends only on `|phi|`.
7. Scaling: `m_H ~ mu`, `v ~ 1/sqrt(lambda)`, depth `~ mu^4/lambda`.
8. Determinism.

## Limiting cases for verification

- `rho = 0`: unstable maximum (`V'' < 0`) (test 1).
- `T -> T_c`: `v -> 0` continuously (test 4).
- `T > T_c`: single symmetric minimum at the origin (test 5).
- Any phase on the brim: identical energy (Goldstone) (test 2).

## Visual fallback

Static three-panel Canvas2D: the radial-slice double well and the
`v(T)` order parameter are fully informative without animation; only
the surface ball and the sweep move.

## Citations

- Higgs, P. W., Phys. Rev. Lett. 13, 508 (1964). `higgs1964`.
- Goldstone, J., Nuovo Cimento 19, 154 (1961). `goldstone1961`.
- Peskin, M. E. and Schroeder, D. V., *An Introduction to Quantum
  Field Theory*, Ch. 11. `peskin-schroeder`.

## Stretch goals

- Gauge the U(1): the Higgs mechanism eats the Goldstone (massive
  gauge boson).
- First-order transition with a cubic term (a barrier and latent
  heat).
- The effective potential at one loop (Coleman-Weinberg).

## Risk register

- The Higgs mass uses the canonical `rho = v + h/sqrt(2)`
  normalisation (`m_H^2 = 2 mu^2`); the bare radial curvature
  `V''(v) = 4 mu^2` differs by that factor of two, which is stated.
- The thermal coefficient `c` is a representative constant (set so
  `T_c = mu` at `c = 1`); the real value depends on the couplings.
  The qualitative restoration and the order of the transition are the
  gate-tested claims.
- The pseudo-3D wireframe lacks occlusion; the radial-slice panel is
  the unambiguous reference for the ball position.
