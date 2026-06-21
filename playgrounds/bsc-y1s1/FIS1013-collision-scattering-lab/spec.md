---
title: Scattering off a Central Potential
slug: collision-scattering-lab
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Fire a parallel beam at a fixed center and the deflection of each particle is set entirely by how far off-axis it was aimed.'
one_paragraph: 'Elastic scattering of a parallel beam off a fixed central potential, reduced to one body of mass mu. The scene fires a beam, colored by impact parameter b, that fans out after the encounter (hard sphere, Coulomb, or screened Yukawa center), with one ray highlighted. The diagnostic plots the deflection function chi(b), the mapping from impact parameter to scattering angle that is the whole content of a scattering experiment: Coulomb backscatters the closest rays (the Rutherford result), the hard sphere cuts off at b = R, and Yukawa screening softens the long-range tail. Hard sphere and Coulomb are closed-form; Yukawa is integrated.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-1S'
primary_uc: F1006
primary_citation: marion-thornton
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
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "Marion, Thornton, Classical Dynamics of Particles and Systems, Fifth ed."
---

# Scattering off a Central Potential

## Explainer

### What you are looking at

A parallel beam of identical particles is fired at a fixed scattering
center. Each particle is aimed at a different sideways distance from
the center, its impact parameter $b$. Particles aimed near the center
swing through a large angle; particles aimed wide barely turn. The
beam fans out, and the mapping from $b$ to the deflection angle $\chi$
is the deflection function, the central object of any scattering
experiment.

### The deflection function

For a central potential the encounter conserves energy and angular
momentum, so the outgoing angle depends only on $b$ (and the energy).
Three cases are built in. A hard sphere of radius $R$ reflects
specularly, $\chi = \pi - 2\arcsin(b/R)$, and misses cleanly for
$b > R$. An inverse-square (Coulomb) center gives
$\cot(\chi/2) = 2bE/\alpha$, so the closest particles come almost
straight back: this Rutherford backscattering is what revealed that an
atom's positive charge sits in a tiny dense nucleus. A screened Yukawa
center, $V = (\alpha/r)\,e^{-r/\lambda}$, behaves like Coulomb up
close but its exponential screening kills the long-range tail, so
wide-$b$ particles pass almost undeflected.

### Why energy and impact parameter set everything

Raising the energy means each particle spends less time near the
center, so every deflection shrinks. Raising the strength (or the
sphere radius) does the opposite. The differential cross section,
$d\sigma/d\Omega = (b/\sin\chi)\,|db/d\chi|$, is just the deflection
function rewritten as the area of beam scattered into each angle, the
quantity a detector actually measures.

### Things to try

- Drag the impact parameter and watch the highlighted ray and the
  cursor on $\chi(b)$ move together.
- In Coulomb, push $b$ small and watch the ray come nearly straight
  back ($\chi \to 180^\circ$).
- Compare Yukawa with Coulomb at large $b$: screening leaves the wide
  rays almost straight.

### Where this comes from

The deflection function, the cross section, and the Rutherford and
Yukawa results follow Goldstein, *Classical Mechanics*, 3rd ed.,
Ch. 3.7, and Landau and Lifshitz, *Mechanics*, Sec. 18-19.

## Physical setup

A beam scatters off a fixed central potential. The two-body problem is
reduced to one body of reduced mass `mu = m1 m2 / (m1+m2)` moving in
the potential. The animated beam (one ray per impact parameter) is the
primary scene; the deflection function `chi(b)` is the diagnostic.

## Governing equations

$$\frac{d\sigma}{d\Omega}=\frac{b}{\sin\chi}\left|\frac{db}{d\chi}\right|.$$

Hard sphere: `chi = pi - 2 arcsin(b/R)`, isotropic `dsigma/dOmega =
R^2/4`. Coulomb: `cot(chi/2) = 2 b E / alpha`, Rutherford
`dsigma/dOmega = (alpha/4E)^2 / sin^4(chi/2)`. Yukawa
`V = (alpha/r) e^{-r/lambda}` is integrated (velocity-Verlet) to get
`chi(b)`.

## Numerical method

Closed forms for hard sphere and Coulomb; RK / Verlet orbit
integration for the screened Yukawa deflection function and the
animated relative trajectory.

## Controls

- potential selector (hard sphere, Coulomb, Yukawa).
- impact parameter `b` (highlights one ray and the cursor on the curve).
- strength (`R` for the hard sphere, `alpha` for Coulomb and Yukawa).
- energy `E`; Reset, Pause.

## Expected qualitative features

- A parallel beam fans out, each ray bending by the amount its impact
  parameter dictates; small `b` bends hard, large `b` barely turns.
- Coulomb back-scatters the closest rays (chi -> 180 deg as b -> 0), the
  Rutherford result; the deflection function chi(b) shows this decay.
- Hard sphere bounces specularly and cuts off at `b = R`; Yukawa screening
  kills the long-range tail so wide-b rays pass nearly undeflected.
- Raising the energy shrinks every deflection (less time near the center).

## Invariants and acceptance thresholds

- Reduced mass identities; `mu < min(m1,m2)`.
- Hard sphere `chi = pi - 2 arcsin(b/R)`; isotropic `R^2/4`.
- Coulomb head-on backscatters; `chi` monotone decreasing in `b`.
- Rutherford follows the `1/sin^4(chi/2)` law within 0.1%.
- Integrated Yukawa deflection positive, decreasing in `b`.
- Large `b` gives negligible deflection for every potential.

## Limiting cases for verification

- `b -> 0`: head-on, `chi -> pi`.
- `b` large: `chi -> 0`, no scattering.
- Yukawa with large `lambda`: approaches the bare Coulomb behaviour.

Source: Goldstein, *Classical Mechanics*, 3rd ed., Ch. 3.7; Landau and Lifshitz, *Mechanics*, Sec. 18-19.
