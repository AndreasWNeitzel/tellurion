---
title: Stellar Aberration of Light
slug: aberration-of-light-stellar
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3028
supporting_ucs: [AST2004]
curriculum_year: bsc-y3s2
primary_citation: jackson1998
primary_chapter: 11
hook: 'Run through vertical rain and you tilt your umbrella forward; move through starlight and every star shifts toward the direction you are heading.'
one_paragraph: 'Stellar aberration is the relativistic version of the tilted-umbrella effect: an observer moving at velocity beta c sees every star displaced toward the direction of motion, by an angle given by the Lorentz aberration formula. For Earth''s orbital motion (v around 30 km/s, beta around 1e-4) the maximum shift is about 20.5 arcseconds, the aberration Bradley discovered in 1728 and the first direct proof that Earth moves. The playground places stars at fixed rest-frame directions and sweeps the observer speed from planetary to ultrarelativistic, where the whole sky crushes into a forward spot. Reference: Griffiths, Introduction to Electrodynamics, Ch. 12.'
tags: [relativity, animation, live-readout]
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

# Stellar aberration of light

## Explainer

### What you are looking at

Move through a field of stars and they all shift toward the direction
you are heading, like rain slanting onto your windshield. The
playground places stars evenly in their rest frame and boosts the
observer, watching the whole sky bunch forward. For Earth's orbit the
shift is tiny (about 20 arcseconds), the effect Bradley used in 1728 to
prove the Earth moves.

### The aberration formula

A star at angle $\theta_\text{rest}$ from the direction of motion is
seen by an observer moving at $\beta = v/c$ at the angle

$$\cos\theta_\text{obs}
  = \frac{\cos\theta_\text{rest} + \beta}
  {1 + \beta\cos\theta_\text{rest}}.$$

It is a pure consequence of the relativistic velocity transformation
applied to the light ray's direction. Read it: stars ahead bunch only
slightly, stars to the side ($\theta=\pi/2$) shift the most, and the
maximum displacement is

$$\Delta\theta_\text{max} \approx \beta \quad(\text{small }\beta).$$

For Earth's $v = 29.8$ km/s, $\beta \approx 10^{-4}$ radian
$\approx 20.5''$, exactly the observed annual aberration ellipse.

### Why it is relativistic but visible classically

The leading $\beta$ term is the same as the naive "tilt your umbrella"
classical aberration; the relativistic content is the denominator,
which only matters at large $\beta$. Crank the speed toward $c$ in the
playground and the entire sky crushes into a tiny forward spot, the
relativistic headlight effect that brightens jets pointed at us
(see relativistic beaming). At everyday speeds it is just the small
forward lean of every star.

### Things to try

- Set $\beta = 10^{-4}$ (Earth) and note the $\sim20''$ maximum shift,
  largest for stars at $90^\circ$.
- Crank $\beta\to1$ and watch the whole star field collapse into a
  forward cone (the headlight effect).
- Reverse the motion and watch the bunching point flip to the other
  side.

### Where this comes from

The relativistic aberration formula and the annual stellar aberration
follow Griffiths, *Introduction to Electrodynamics*, 5th ed.,
Chapter 12, and Rindler, *Relativity: Special, General, and
Cosmological*.

## Physical setup

Stars at uniform angular positions in their rest frame; the observer moves at velocity $\beta c$ along $+x$. Lorentz aberration

$$\cos\theta_\text{obs} = \frac{\cos\theta_\text{rest} + \beta}{1 + \beta \cos\theta_\text{rest}}$$

pulls every observed direction toward the forward axis. For Earth's annual orbital motion ($v = 29.78$ km/s, $\beta \approx 10^{-4}$), the maximum aberration is the classical $\sim 20.5"$ at $\theta = \pi/2$.

## Numerical method

Closed-form. 18 stars sampled at uniform $\theta_\text{rest}$; both rest and observed positions plotted on a single polar diagram.

## Controls

- $\log_{10}\beta$ slider from -6 (planetary) to 0 (ultrarelativistic).

## Expected qualitative features

1. Forward and backward directions ($\theta = 0$ and $\pi$) are fixed under aberration.
2. Maximum shift occurs near $\theta = \pi/2$.
3. As $\beta \to 1$, the entire celestial sphere collapses toward the forward direction (relativistic beaming geometry).
4. At $\beta = 10^{-4}$, the maximum shift is $\sim 20.5"$, matching the constant of aberration measured by Bradley 1729.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| forward direction unchanged | within $10^{-12}$ | invariants test |
| backward direction unchanged | within $10^{-12}$ | invariants test |
| small-beta shift agrees with $\beta \sin\theta$ | within $10^{-3}$ | invariants test |
| Earth annual aberration at $\theta = \pi/2$ is $\approx 20.5"$ | within 1 percent | invariants test |
| high-beta beams light forward | strict $\theta_\text{obs} \lt \theta_\text{rest}$ | invariants test |
| inverse: $\theta_\text{rest}(\theta_\text{obs}(\theta)) = \theta$ | within $10^{-12}$ | invariants test |
| $\beta = 0$ gives no aberration | within $10^{-12}$ | invariants test |
| max shift at $\theta = \pi/2$ (small $\beta$) | strict | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- Bradley 1729: $\sim 20.5"$ annual aberration confirms Earth's motion and finite $c$ together.
- $\beta \to 1$: relativistic beaming squeezes all visible sources into the forward direction (the source of the Doppler beaming companion effect).

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Jackson, *Classical Electrodynamics*, 3e, Ch. 11.
- J. Bradley 1729: empirical discovery of annual aberration.

## Stretch goals

- Animate Earth's orbit to show the annual ellipse traced by each star.
- Add the relativistic-beaming companion (intensity transformation).
- Switch to galactic-frame coordinates and overlay the secular aberration from the solar motion.

## Risk register

- For $\beta$ very close to 1 the lines all converge near the forward axis and overlap; visually accepted because that is the actual physics.
