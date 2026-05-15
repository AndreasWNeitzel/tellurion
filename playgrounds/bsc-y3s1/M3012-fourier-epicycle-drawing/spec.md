---
title: "Fourier Epicycle Drawing"
slug: fourier-epicycle-drawing
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: M3012
supporting_ucs: []
curriculum_year: bsc-y3s1
hook: 'A chain of rotating circles, sorted largest to smallest, redraws any closed path through the discrete Fourier transform.'
one_paragraph: 'For N complex sample points, compute C_k via DFT and reconstruct z(t) = sum_k C_k exp(2 pi i k t / N). With M epicycles the reconstruction error decreases monotonically; full N/2 reproduces the path within float precision.'
tags: [numerics, waves, interactive-drag, animation]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [n_epicycles]
---

# Fourier Epicycle Drawing

A chain of rotating circles (epicycles) traces a target shape. Each circle rotates at a harmonic frequency with radius equal to the DFT coefficient magnitude; the tip of the last arm draws the curve. Sliding the epicycle count from 1 to N/2 visibly improves the fit; the RMS error vs the original path shrinks monotonically.

## Physical setup

For $N$ complex sample points $z_j = x_j + i y_j$ on the path, the DFT is
$$C_k = \frac{1}{N} \sum_{j=0}^{N-1} z_j e^{-2\pi i k j / N}.$$
The reconstruction $z(t) = \sum_k C_k e^{2\pi i k t / N}$ is animated by walking $t$ from $0$ to $N$. Coefficients sorted by $|C_k|$ place the largest circles innermost.

## Controls

- Epicycle-count slider (1 to $N/2$)
- Draw-mode toggle: click points to define a custom path
- Preset gallery: figure-8, heart, star, letter A, Earth outline

## Invariants

- Parseval: $\sum |C_k|^2 = (1/N) \sum |z_j|^2$ within $10^{-10}$.
- Full $N/2$ epicycles reconstruct the path within $10^{-6}$ px RMS.
- Adding more epicycles monotonically reduces RMS error.

## Citations

Folland, "Fourier Analysis and Its Applications" ch. 2 (`folland1992`).
