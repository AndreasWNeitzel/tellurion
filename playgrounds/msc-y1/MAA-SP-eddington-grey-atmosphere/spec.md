---
title: Eddington Grey Atmosphere
slug: eddington-grey-atmosphere
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-SP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: hansen-kawaler
primary_chapter: 3
hook: 'Starlight is not emitted from a surface but from a fuzzy layer where the gas goes from opaque to transparent; the simplest model of that layer predicts the photosphere and limb darkening.'
one_paragraph: 'Assuming a frequency-independent (grey) opacity and radiative equilibrium, the Eddington approximation closes the moment equations and gives the temperature run T^4(tau) = (3/4) T_eff^4 (tau + 2/3), so the effective temperature is reached at optical depth tau = 2/3 (the photosphere) rather than at tau = 0. Solving the transfer equation with the Eddington-Barbier relation yields the emergent intensity I(0, mu) proportional to (2/3 + mu): brighter looking straight down into the star (mu = 1, disk centre) and dimmer toward the limb (small mu), which is limb darkening. The playground shows the T(tau) profile and the angular intensity as T_eff is varied. Reference: Hansen and Kawaler, Stellar Interiors, Chapter 3.'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
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
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---

# Eddington grey atmosphere

## Explainer

### What you are looking at

The light leaving a star is not emitted from a surface but from a
fuzzy layer where the gas goes from opaque to transparent. The
Eddington grey atmosphere is the simplest model of that layer, and it
predicts where the photosphere is and why the spectrum looks slightly
hotter at the disk center than the edge (limb darkening). The
playground shows the temperature run and the emergent intensity.

### The grey assumption and the temperature law

"Grey" means the opacity is independent of wavelength, so a single
optical depth $\tau$ measures how far in you can see (the surface is
$\tau=0$; $\tau=1$ is roughly one mean free path deep). Solving
radiative transfer in this layer with the Eddington approximation
(treating the radiation as nearly isotropic) gives the temperature
structure

$$T^4(\tau) = \frac{3}{4}\,T_\mathrm{eff}^4
  \left(\tau + \tfrac{2}{3}\right),$$

with $T_\mathrm{eff}$ the effective temperature. A key consequence:
$T=T_\mathrm{eff}$ exactly at $\tau=2/3$, so the photosphere (the
layer we see) sits at optical depth $2/3$, not at $\tau=0$.

### Limb darkening

The emergent intensity at angle $\theta$ from the surface normal
($\mu=\cos\theta$) is the source function integrated along that line
of sight, giving the linear limb-darkening law

$$\frac{I(\mu)}{I(1)} = \frac{2 + 3\mu}{5}.$$

Looking at the disk center ($\mu=1$) you see deep, hot gas; looking
near the limb ($\mu\to0$) your slanted sightline only reaches
shallow, cooler gas, so the star fades toward its edge by a factor of
$2/5$. This is directly measured in eclipsing binaries and exoplanet
transits and is the standard check of stellar-atmosphere models. The
playground shows $T(\tau)$, the $\tau=2/3$ photosphere, and the
$I(\mu)$ limb-darkening curve.

### Things to try

- Confirm $T=T_\mathrm{eff}$ at $\tau=2/3$ (the photosphere is not
  the $\tau=0$ surface).
- Read the limb-darkening curve: center-to-edge intensity ratio
  $5:2$.
- Change $T_\mathrm{eff}$ and watch the whole temperature profile
  scale as $T^4\propto\tau+2/3$.

### Where this comes from

The grey-atmosphere temperature law and the linear limb-darkening
relation follow Mihalas, *Stellar Atmospheres*, Chapter 3, and
Rybicki and Lightman, *Radiative Processes in Astrophysics*,
Chapter 1.

## Physical setup

A grey (frequency-independent opacity) stellar atmosphere in radiative equilibrium. The temperature profile follows
$$T(\tau) = T_\text{eff} \left[\tfrac{3}{4} (\tau + \tfrac{2}{3})\right]^{1/4}.$$

The Eddington-Barbier limb darkening for a linear source function is $I(\mu)/I(1) = 0.4 + 0.6 \mu$ with $\mu = \cos\theta$ the cosine of the emission angle.

## Numerical method

Closed-form. Left panel plots $T(\tau)$ over $\tau \in [0, 5]$ with the photosphere marked at $\tau = 2/3$. Right panel renders the solar-disk limb darkening as a radial color gradient.

## Controls

- $T_\text{eff}$ from 2500 to 10000 K.

## Expected qualitative features

1. Photosphere at $\tau = 2/3$ where $T = T_\text{eff}$ exactly.
2. Boundary at $\tau = 0$: $T = T_\text{eff} / \sqrt[4]{2} \approx 0.841 T_\text{eff}$.
3. Asymptotic interior: $T \to T_\text{eff} (3\tau/4)^{1/4}$.
4. Solar disk visibly darker at the limb than at the center.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $T(2/3) = T_\text{eff}$ | within $10^{-9}$ | invariants test |
| $T(0) = T_\text{eff} (1/2)^{1/4}$ | within $10^{-9}$ | invariants test |
| $T(100) \to T_\text{eff} (3 \cdot 100 / 4)^{1/4}$ | within 1 percent | invariants test |
| $T$ monotonic increasing in $\tau$ | strict | invariants test |
| limb $I(1) = 1$ exact | within $10^{-12}$ | invariants test |
| limb $I(0) = 0.4$ exact | within $10^{-12}$ | invariants test |
| limb monotonic in $\mu$ | strict | invariants test |
| photosphere $\tau$ equals $2/3$ | exact | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $T_\text{eff} = T_\odot = 5778$ K: photosphere at $T = T_\odot$.
- $\tau \to \infty$: $T$ grows as $\tau^{1/4}$.
- $\mu = 1$ (disk center): full brightness; $\mu = 0$ (limb): 40 percent brightness.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Hansen-Kawaler-Trimble, *Stellar Interiors*, 2e, Ch. 3.
- Mihalas, *Stellar Atmospheres*, for the rigorous Eddington-Barbier derivation.

## Stretch goals

- Non-grey opacity: depart from the universal Eddington T(tau).
- Allow specifying limb-darkening coefficients (linear, quadratic, four-parameter Claret).
- Coupled atmosphere + stellar interior model.

## Risk register

- The right-panel disk uses a coarse RGB approximation for the limb-darkening color; the readout reports the canonical 0.4 ratio.
