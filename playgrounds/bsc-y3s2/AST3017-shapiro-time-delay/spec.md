---
title: Shapiro Time Delay
slug: shapiro-time-delay
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
hook: 'Radar a planet across the Sun and the echo comes back late; the curved spacetime near the Sun literally lengthens the path light takes.'
one_paragraph: 'The Shapiro delay is the fourth classical test of general relativity: light passing close to a mass takes measurably longer than it would in flat space, not because it slows locally but because the spacetime it crosses is curved. The leading-order delay grows logarithmically with how closely the ray grazes the body, delta t = 2M ln(4 r_E r_R / b^2). The playground varies the impact parameter and shows the extra round-trip time, the effect Irwin Shapiro measured by bouncing radar off Venus and that pulsar timing now uses to weigh neutron stars. Reference: Hartle, Gravity, Ch. 10.'
tags: [cosmology, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Shapiro time delay

## Explainer

### What you are looking at

Bounce a radar pulse off a planet on the far side of the Sun and the
echo comes back late, by up to a couple of hundred microseconds. The
light did not slow down locally; the spacetime it crossed is curved, so
the path is longer. This is the Shapiro delay, the fourth classical
test of general relativity, and the playground shows the extra
round-trip time grow as the ray grazes closer to the mass.

### The delay

For a signal passing a mass $M$ (geometric units $G=c=1$) at impact
parameter $b$, with emitter and receiver at distances $r_E, r_R$, the
extra time relative to flat space is, to leading order,

$$\delta t = 2M\ln\!\frac{4\,r_E\,r_R}{b^2},$$

and exactly (Schwarzschild)

$$\delta t = 2M\ln\!\frac{\big(r_E+\sqrt{r_E^2-b^2}\big)
  \big(r_R+\sqrt{r_R^2-b^2}\big)}{b^2}.$$

The key feature is the logarithm of $1/b^2$: the delay grows without
bound (logarithmically) as the ray passes closer to the mass, which is
why the effect is largest for a signal grazing the Sun's limb.

### Why it happens

In curved spacetime the coordinate speed of light is reduced near the
mass (equivalently, the spatial path is stretched). Integrating that
along the trajectory gives the logarithmic excess above. It is not a
force on the photon and not a frequency shift; it is pure geometry,
the same metric that bends starlight also delays radar. Irwin Shapiro
proposed and measured it (Venus radar, 1968), and today pulsar timing
uses the companion star's Shapiro delay to weigh neutron stars to high
precision. The playground varies $b$ and shows $\delta t$ rising as the
ray approaches the body.

### Things to try

- Decrease the impact parameter $b$ toward the body and watch the
  delay climb (logarithmically, the $\ln(1/b^2)$).
- Increase the mass $M$ and watch the whole delay scale linearly with
  it.
- Note the delay is largest for a grazing ray: the origin of the
  superior-conjunction radar experiments.

### Where this comes from

The leading-order PPN and exact Schwarzschild Shapiro-delay formulae
follow Will, *Theory and Experiment in Gravitational Physics*, and the
standard treatment in Hartle, *Gravity*, Chapter 10 (after Shapiro
1964).

## Physical setup

A light signal travels past a massive body (Schwarzschild M = 1 in
geometric units) at impact parameter b. The leading-order PPN time delay
relative to flat-space is

  delta t = 2 M ln(4 r_E r_R / b^2)

with r_E and r_R the emitter and receiver distances from the body. The
full Schwarzschild formula is

  delta t = 2 M ln((r_E + sqrt(r_E^2 - b^2)) (r_R + sqrt(r_R^2 - b^2)) / b^2).

## Governing equations

Above.

## Numerical method

None. Closed-form.

## Controls

- b / M: impact parameter, 1 to 100.
- r_E = r_R: emitter/receiver distance, 100 to 3000 M.
- speed: auto-sweep b.
- Reset / Pause / Play.

## Expected qualitative features

1. Delay decreases logarithmically with b.
2. Delay grows linearly with M.
3. Delay grows logarithmically with r.

## Invariants and acceptance thresholds

1. Leading-order matches full formula at b << r within 5 percent.
2. Decreases with b.
3. Increases with r.
4. Linear in M.
5. Full formula = 0 at b = r.
6. Leading-order formula manual match.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- b -> r: signal arrives nearly head-on, almost no extra delay.
- b -> 0: delay diverges (signal grazes the singularity).

## Visual fallback

Canvas2D only. Top: ray sketch with emitter, receiver, Sun, and b. Bottom:
delta t vs b curve with current-b cursor.

## Citations

- Schutz, A First Course in General Relativity 2e Ch. 11
  (`schutz-firstcourse`).
- Bertotti, Iess, Tortora 2003 Nature.

## Stretch goals

- Include solar radial dependence of refractive index.
- 2D photon trajectory in PPN field.
- PPN gamma parameter slider.

## Risk register

- Leading-order formula assumes b << r; near b = r it diverges from full.
