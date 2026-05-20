---
title: Davisson-Germer Electron Diffraction
slug: davisson-germer-diffraction
status: superseded
superseded_by: slit-experiment-legend-3d
audience: portfolio
created: 2026-05-13
primary_uc: FIS2017
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: eisberg-resnick
primary_chapter: 3
hook: 'Fire electrons at a nickel crystal and they diffract like waves; the angle of the bright spot pins down the de Broglie wavelength exactly.'
one_paragraph: 'Davisson and Germer scattered low-energy electrons off a nickel crystal and saw an interference maximum where particles alone should make none. The atomic rows act as a grating, with constructive interference at D sin theta = n lambda and the electron wavelength fixed by de Broglie, lambda = h / p. The playground sweeps the accelerating voltage and moves the diffraction angle accordingly, reproducing the 1927 result (54 V gives lambda about 0.167 nm and a peak near 51 degrees). It is the cleanest direct demonstration that matter has a wavelength. Reference: Eisberg and Resnick, Quantum Physics, Ch. 3.'
tags: [quantum, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Davisson-Germer electron diffraction

## Explainer

### What you are looking at

Fire electrons (particles) at a crystal and they come back in sharp
bright beams at specific angles, exactly the way X-rays diffract. That
1927 result by Davisson and Germer was the first direct proof that
matter has a wavelength. The playground reproduces their nickel
experiment and lets you dial the voltage.

### The de Broglie wavelength

An electron accelerated through voltage $V$ gains kinetic energy
$T = eV$ and therefore a momentum, and de Broglie says it has a
wavelength

$$\lambda = \frac{h}{p}, \qquad
  pc = \sqrt{T^2 + 2T\,m_e c^2}.$$

At $V = 54$ V this is about 0.167 nm, comparable to atomic spacings,
which is why a crystal can diffract it.

### The diffraction condition

The crystal surface is a grating of atomic rows spaced
$D = 0.215$ nm. Constructive interference (a bright beam) occurs when
the path difference between adjacent rows is a whole wavelength:

$$D\sin\theta = n\lambda.$$

For many parallel rows the intensity is the standard $N$-slit grating
pattern

$$I(\theta) = \left[\frac{\sin(N\phi)}{\sin\phi}\right]^2,
  \qquad \phi = \frac{\pi D\sin\theta}{\lambda},$$

with tall principal maxima of height $N^2$ at $\sin\theta_n =
n\lambda/D$. At $V = 54$ V the first maximum lands at
$\theta \approx 51^\circ$, exactly the angle Davisson and Germer
measured.

### Things to try

- Set $V = 54$ V and find the famous $\sim 51^\circ$ peak.
- Raise $V$: the electrons get more momentum, $\lambda$ shrinks, and
  the diffraction peaks move to smaller angles.
- Note the peaks are sharp and at grating angles, the signature of a
  wave, from particles.

### Where this comes from

The de Broglie relation, the relativistic momentum, and the grating
diffraction condition follow Eisberg and Resnick, *Quantum Physics*,
2nd ed., Chapter 3, after Davisson and Germer (1927).

## Physical setup

Electrons accelerated through a voltage $V$ are scattered off the (111) face of a nickel crystal. The atomic row spacing on that surface is $D = 0.215$ nm. Constructive interference appears at angle $\theta$ from the normal satisfying

$$D \sin\theta = n \lambda, \qquad \lambda = h c / pc, \qquad pc = \sqrt{T^2 + 2 T m_e c^2}.$$

For $V = 54$ V this gives $\lambda \approx 0.167$ nm and $\theta_1 \approx 51^\circ$, reproducing the 1927 Davisson-Germer maximum.

## Governing equations

The single-row condition $D \sin\theta = n \lambda$ governs angle. The intensity envelope for $N$ parallel rows is the standard N-slit grating

$$I(\theta) = \left[\frac{\sin(N \phi)}{\sin\phi}\right]^2, \qquad \phi = \pi D \sin\theta / \lambda,$$

which has principal-order maxima at $\sin\theta_n = n\lambda/D$ of height $N^2$, with secondary maxima between them.

## Numerical method

Closed-form. The intensity curve is sampled at 600 points over $\theta \in [0, \pi/2]$ and rendered as a normalized curve. Principal-order positions are computed analytically and drawn as dashed lines.

## Controls

- Accelerating voltage $V$ in volts (20 to 500).
- Number of rows $N$ (4 to 40): broadens or sharpens the principal peaks.

## Expected qualitative features

1. Increasing $V$ shrinks $\lambda$, pulling Bragg orders toward smaller $\theta$.
2. At $V = 54$ V the first-order peak sits at $\theta \approx 51^\circ$.
3. Increasing $N$ sharpens the peaks (full width $\propto 1/N$) without moving them.
4. Once $\lambda > D$ no principal-order peaks exist (electrons too slow to diffract).

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $V = 54$ V gives $\lambda \approx 0.167$ nm | within 0.001 nm | invariants test |
| $\theta_1 \approx 50.8^\circ$ at $V = 54$ V | within $1^\circ$ | invariants test |
| $\lambda > D$ gives NaN | strict | invariants test |
| non-rel and rel agree at $V = 10$ V | within $10^{-4}$ relative | invariants test |
| non-rel: $V \to 4V$ gives $\lambda \to \lambda/2$ | within $10^{-10}$ | invariants test |
| grating principal max equals $N^2$ at $\theta = 0$ | within $10^{-8}$ | invariants test |
| grating intensity small between maxima | $\ll N^2$ | invariants test |
| higher orders appear when $D > n\lambda$ | strict, $\theta_2 > \theta_1$ | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $V = 54$ V, Ni(111): canonical Davisson-Germer 1927 maximum.
- $N \to \infty$: peaks become delta functions, secondary maxima vanish.
- $D \to \infty$ (no crystal): peaks merge into the forward direction.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the figure caption still reads as a paper sentence and the controls remain operable.

## Citations

- Eisberg and Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles*, 2e, Ch. 3 (`eisberg-resnick`).
- C. Davisson and L. H. Germer, Phys. Rev. 30, 705 (1927): original electron-diffraction experiment.

## Stretch goals

- Switch to bulk Bragg geometry ($2d \sin\theta = n\lambda$) toggleable from a button.
- Show the polychromatic case where multiple voltages are present simultaneously.
- Add Debye-Waller temperature factor to attenuate peaks at high $T$.

## Risk register

- The intensity formula goes to $0/0$ when $\phi = 0$; the engine returns $N^2$ explicitly at $\sin\theta = 0$ to avoid the singularity.
- Beyond $V = 500$ V the de Broglie wavelength is small enough that all visible peaks crowd into the small-angle region; the plot still resolves them.
