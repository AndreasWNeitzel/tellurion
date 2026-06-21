---
title: The Double Slit and Which-Path
slug: double-slit-which-path
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: FIS2017
curriculum_year: bsc-y2s2
primary_citation: feynman3
primary_chapter: 1
hook: "Particles arrive one at a time and pile up into interference fringes, as if each went through both slits. Learn which slit each took and the fringes vanish: complementarity."
one_paragraph: "Sending particles one at a time at a double slit, each lands as a single dot, yet the dots accumulate into bright and dark fringes. The intensity is the single-slit envelope times the two-slit fringes, I = env (1 + V cos 2 alpha)/2 with alpha = pi d sin theta/lambda, and the fringe spacing is lambda L/d. Acquiring which-path information of distinguishability D destroys the fringes by the complementarity relation V = sqrt(1 - D^2), so V^2 + D^2 = 1: full path knowledge (D = 1) leaves only the smooth single-slit hump. The playground builds the pattern dot by dot by rejection-sampling the intensity, plots the profile against the detection histogram, and shows the visibility shrink as the which-path knob turns up."
tags: [modern-physics, quantum, interference, complementarity, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [d, lam, wp]
invariants:
  - key: comp
    label: the visibility and distinguishability obey V^2 + D^2 = 1
    tolerance: 1e-6
  - key: fringe
    label: the bright fringes are at alpha = k pi (spacing lambda L / d)
    tolerance: 1e-6
  - key: washout
    label: full which-path information leaves the smooth single-slit envelope (no fringe zeros)
    tolerance: 0.0
what_to_try:
  - Watch the screen fill dot by dot; the fringes emerge only after many particles arrive.
  - Turn up the which-path knob and the fringes fade to the single-slit hump as the visibility shrinks.
  - Widen the slit separation or shorten the wavelength to pack the fringes closer (spacing lambda L/d).
references:
  - "Feynman, Leighton and Sands, The Feynman Lectures on Physics, Vol. III, Ch. 1."
  - "Englert 1996, Phys. Rev. Lett. 77, 2154 (the fringe-visibility duality relation)."
---

# The double slit and which-path

## Physical setup

Particles of wavelength $\lambda$ pass two slits of separation $d$ and width $a$
and are detected on a screen at distance $L$, one at a time.

## Equations

The intensity on the screen is the single-slit envelope times the two-slit
fringes,

$$ I(\theta) = \left(\frac{\sin\beta}{\beta}\right)^2 \frac{1 + V\cos 2\alpha}{2}, \quad \alpha = \frac{\pi d\sin\theta}{\lambda}, \quad \beta = \frac{\pi a\sin\theta}{\lambda}, $$

with fringe spacing $\lambda L/d$ on the screen. The fringe visibility $V$ and the
which-path distinguishability $D$ obey the duality relation $V = \sqrt{1 - D^2}$,
so $V^2 + D^2 = 1$: $D = 0$ gives full fringes, $D = 1$ the bare envelope.

## Numerical method

No engine. Detections are drawn by rejection sampling from $I(\theta)$ and
accumulated into the screen pattern and a histogram; the closed-form intensity is
overlaid.

## Controls

- Slit separation $d$, wavelength $\lambda$, which-path information $D$; Reset and
  Pause.

## Expected qualitative features

1. The interference pattern emerges only after many single-particle detections.
2. Turning up the which-path information fades the fringes to the single-slit
   envelope.
3. Wider slits or shorter wavelength pack the fringes closer.

## Invariants and acceptance thresholds

- $V^2 + D^2 = 1$.
- Bright fringes at $\alpha = k\pi$, spacing $\lambda L/d$.
- Full which-path information leaves the smooth envelope.

## Citations

Feynman Lectures, Vol. III, Ch. 1. Englert 1996, PRL 77, 2154.
