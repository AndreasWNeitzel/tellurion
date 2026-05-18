---
title: Magnetic Hysteresis: Domains and the B-H Loop
slug: magnetic-hysteresis-bh-curve
status: verified
audience: portfolio
created: 2026-05-17
hook: 'The domains do not just follow the field, they remember where they have been. That memory is the area inside the loop.'
one_paragraph: 'A Jiles-Atherton hysteresis model driven by an oscillating field. The primary scene is a lattice of magnetic domains that flip toward the field but lag it; the secondary panel traces the B-H loop with a glowing pen and shades the per-cycle energy loss. Soft iron, hard steel and ferrite presets, with coercivity, saturation and drive sliders. The headless sim.js is gate-tested for remanence, coercivity and the soft-vs-hard ordering.'
tags: [electromagnetism, animation, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
share_state_keys: []
---

# Magnetic Hysteresis: Domains and the B-H Loop

## Explainer

### What you are looking at

Drive a ferromagnet with an oscillating magnetic field and its
magnetization does not simply follow: it lags, so plotting the response
$B$ against the drive $H$ traces a loop rather than a line. The lattice
of magnetic domains flips in a delayed wave, and the area inside the
loop is energy lost as heat every cycle. This is why transformer cores
warm up and why magnets remember.

### Why there is a loop (hysteresis)

Magnetic domains do not rotate freely; they are pinned by defects and
only flip once the field exceeds a local threshold. So the
magnetization at a given $H$ depends on the history, whether $H$ was
rising or falling. Sweeping $H$ up and back down therefore traces two
different branches: a loop with a remanence (magnetization left at
$H=0$) and a coercive field (the reverse $H$ needed to zero it).

### The model

The playground uses the Jiles-Atherton model. The ideal lossless
response is the anhysteretic curve

$$M_{\rm an} = M_s\left[\coth\!\frac{H_e}{a}
  - \frac{a}{H_e}\right], \qquad H_e = H + \alpha M,$$

a Langevin-type saturation ($M_s$ the saturation magnetization, $H_e$
the effective field including domain coupling $\alpha$). Pinning is
added through an irreversible component:

$$\frac{dM_{\rm irr}}{dH}
  = \frac{M_{\rm an} - M_{\rm irr}}
  {k\,\delta - \alpha\,(M_{\rm an} - M_{\rm irr})},$$

where $k$ sets the pinning strength and $\delta = \pm1$ is the sweep
direction (this $\delta$ is what makes the up and down branches
differ). The measured magnetization blends reversible and irreversible
parts, $M = (1-c)M_{\rm irr} + c\,M_{\rm an}$.

### The energy loss

Driving with $H = H_m\sin(\omega t)$ and tracing $B$ versus $H$ gives
the closed loop. The work dissipated per cycle per unit volume is the
enclosed area,

$$W = \oint H\,dB,$$

which is exactly the iron loss that heats a transformer core. A fat
loop (hard magnet) stores information; a thin loop (soft magnet) wastes
little energy.

### Things to try

- Watch the magnetization lag the field: the domain wave reverses
  after the drive, not with it.
- Increase the pinning $k$ and see the loop fatten, more remanence,
  more energy lost per cycle.
- Shrink the loop toward the single anhysteretic curve as pinning goes
  to zero (an ideal soft magnet).

### Where this comes from

Domain hysteresis, the B-H loop and its area as the per-cycle loss,
and the Jiles-Atherton model follow Jiles and Atherton (1986) and the
ferromagnetism treatment in Griffiths, *Introduction to
Electrodynamics*, 5th ed., Chapter 6.

## Physical setup

A ferromagnet under an oscillating applied field. The domain lattice
reverses as a threshold-ordered wave that lags the field (the
hysteresis); the B-H loop is traced alongside, its enclosed area the
energy dissipated per cycle.

## Governing equations

Jiles-Atherton: anhysteretic `M_an = Ms[coth(He/a) - a/He]`,
`He = H + alpha M`, irreversible
`dM_irr/dH = (M_an - M_irr)/(k delta - alpha(M_an - M_irr))`,
`M = (1-c) M_irr + c M_an`.

## Numerical method

Explicit integration of the J-A ODE as `H = Hm sin(wt)` sweeps; the
full loop is precomputed for the reference curve and the live point
is integrated each frame.

## Controls

- material selector (soft iron, hard steel, ferrite).
- coercivity `k`, saturation `Ms`, drive `Hm` sliders; Reset, Pause.

## Expected qualitative features

- Domains reverse in a wave that lags the field.
- Soft iron: thin loop, small loss; hard steel: broad square loop.
- Remanence at `H = 0`; sign change near `+-Hc`.

## Invariants and acceptance thresholds

- Langevin odd and saturating; `|M| <= Ms`.
- Open loop: ascending and descending branches differ.
- Positive remanence and a real coercive field.
- Hard material has larger loop area and coercivity than soft.
- Loop area (energy per cycle) strictly positive.
- Anhysteretic curve through the origin, saturating to `+-Ms`.

## Limiting cases for verification

- `k -> 0`: loop collapses toward the anhysteretic curve.
- Large `Hm`: full saturation, maximal remanence.

Source: Jiles and Atherton, *JMMM* 61, 48 (1986) (`jiles-atherton`);
Griffiths, *Introduction to Electrodynamics*, 4th ed., Sec. 6
(`griffithsem2017`).
