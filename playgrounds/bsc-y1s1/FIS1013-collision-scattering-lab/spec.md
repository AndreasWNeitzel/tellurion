---
title: Two-Body Collision: Lab and CM Frames
slug: collision-scattering-lab
status: verified
audience: portfolio
created: 2026-05-17
hook: 'The same collision looks like a glancing nudge in the lab and a clean back-to-back recoil in the centre-of-mass frame.'
one_paragraph: 'Elastic two-body scattering reduced to one body of mass mu in a central potential. The centre-of-mass collision is the primary scene (particles meet and recoil back-to-back through the deflection angle chi); a compact lab-frame inset, a V(r) profile and a fixed-scale differential cross-section polar with the analytic Rutherford overlay are secondary panels. Hard sphere and Coulomb are closed-form; Yukawa is integrated.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-1S'
primary_uc: F1006
share_state_keys: []
---

# Two-Body Collision: Lab and CM Frames

## Physical setup

A projectile of mass `m1` scatters off a target `m2` initially at
rest. The two-body problem reduces to one body of reduced mass
`mu = m1 m2 / (m1+m2)` in a central potential. The CM-frame encounter
is the primary scene; the lab trajectory, the potential profile and
the differential cross-section are secondary panels.

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

- mass ratio `m2/m1`, launch speed `v1`, impact parameter `b`.
- potential selector (inverse-square, hard sphere, Yukawa);
  Reset, Pause.

## Expected qualitative features

- CM particles always recoil exactly back-to-back through `chi`.
- Small `b` gives back-scatter; large `b` gives forward scatter.
- Hard sphere cross section is isotropic; Coulomb is forward-peaked
  and matches the dashed analytic Rutherford curve.

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

Source: Goldstein, *Classical Mechanics*, 3rd ed., Ch. 3.7
(`goldstein`); Landau and Lifshitz, *Mechanics*, Sec. 18-19
(`landau-mechanics`).
