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

# Two-Body Collision: Lab and CM Frames

## Explainer

### What you are looking at

The same collision looks completely different depending on where you
stand. In the lab a fast projectile hits a stationary target and both
fly off forward; in the centre-of-mass frame the two simply approach,
bounce, and recede symmetrically. The playground shows both views of
one collision side by side, which is the key trick for analysing
scattering.

### Conservation laws set the outcome

A collision conserves total momentum always, and kinetic energy only
if it is elastic. For a projectile $m_1$ at speed $v_0$ hitting a
target $m_2$ at rest, momentum and (for elastic) energy give the 1D
result

$$v_1' = \frac{m_1 - m_2}{m_1 + m_2}\,v_0,
  \qquad
  v_2' = \frac{2 m_1}{m_1 + m_2}\,v_0.$$

Equal masses: the projectile stops and the target leaves with $v_0$
(Newton's cradle). Heavy onto light: the projectile barely slows,
the target rockets off at up to $2v_0$. Light onto heavy: the
projectile bounces back.

### Why the CM frame is the natural one

Transform to the centre-of-mass frame, moving at
$V_\mathrm{cm} = m_1 v_0/(m_1+m_2)$. There the total momentum is zero,
so the two particles always move oppositely, and in an elastic
collision each simply reverses with its speed unchanged: the whole
collision is a single scattering angle $\theta_\mathrm{cm}$. Every
lab-frame quantity is then just that simple CM picture boosted back
by $V_\mathrm{cm}$, which is why particle physics quotes
cross-sections in the CM frame. The inelastic case keeps momentum but
converts a fraction $1-e^2$ of the CM kinetic energy into heat (the
coefficient of restitution $e$); a perfectly inelastic hit ($e=0$)
loses the most while still conserving momentum. The playground lets
you set the masses and $e$ and shows the lab and CM trajectories,
velocities, and the energy ledger together.

### Things to try

- Set $m_1=m_2$ elastic and watch the projectile stop dead while the
  target leaves with the full speed.
- Switch to the CM frame and see the symmetric approach/recede that
  any elastic collision reduces to.
- Lower the restitution $e$ toward 0 and watch CM kinetic energy
  drain to heat while momentum stays exactly conserved.

### Where this comes from

The lab/CM transformation, elastic and inelastic collisions, and the
reduced-mass reduction follow Kleppner and Kolenkow, *An Introduction
to Mechanics*, Chapter 4, and Taylor, *Classical Mechanics*,
Chapter 14.

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
