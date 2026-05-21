---
title: Bohr Hydrogen Spectrum
slug: bohr-hydrogen-spectrum
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: [FIS2017]
curriculum_year: bsc-y2s1
primary_citation: carroll-ostlie
primary_chapter: 5
hook: 'One quantization rule turns the smear of hydrogen light into a few clean ladders of lines: Lyman in the UV, Balmer in the visible, Paschen in the infrared.'
one_paragraph: 'Bohr''s single rule, that the electron''s angular momentum comes in integer units of hbar, forces it onto discrete orbits with energies E_n = -13.6 eV / n^2. Every downward jump from a higher level n_h to a lower n_l emits a photon whose wavelength follows the Rydberg formula. The playground lets you pick the transition and places the emitted line on a spectrum, grouped into the named series (Lyman to n=1, Balmer to n=2, Paschen to n=3, and on), each crowding toward its series limit. It connects one postulate directly to the bright lines a prism would actually show. Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 5.'
tags: [stellar, exoplanets, animation, live-readout]
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

# Bohr hydrogen energy levels and emission spectrum

## Explainer

### What you are looking at

Hydrogen does not glow in every color. It emits a few sharp lines at
fixed wavelengths, the barcode that lets us read the composition of
stars. Bohr's 1913 model explains exactly where those lines sit. The
playground draws the energy ladder and the resulting line spectrum.

### The quantization

Bohr's one bold assumption: the electron's angular momentum is
quantized, $L = n\hbar$ for integer $n \ge 1$. Feeding that into the
Coulomb orbit gives discrete energy levels

$$E_n = -\frac{E_R}{n^2}, \qquad E_R = 13.606\ \text{eV},$$

negative (bound), crowding together as $n$ grows, and converging to 0
(ionization) as $n\to\infty$.

### The spectral lines

The atom emits a photon only when the electron drops from a higher
level $n_h$ to a lower one $n_\ell$, and the photon carries exactly the
energy difference:

$$h\nu = E_R\left(\frac{1}{n_\ell^2} - \frac{1}{n_h^2}\right),
  \qquad \frac{1}{\lambda} = R_H\left(\frac{1}{n_\ell^2}
  - \frac{1}{n_h^2}\right).$$

Grouping by the lower level gives the named series: Lyman
($n_\ell=1$, ultraviolet), Balmer ($n_\ell=2$, the visible lines you
see in a hydrogen lamp), Paschen, Brackett, Pfund (infrared). Each
series piles up toward a series limit at $\lambda = n_\ell^2/R_H$ as
$n_h\to\infty$. The playground colors each series and marks its limit.

### Things to try

- Watch the Balmer lines fall in the visible band: this is the red
  H-alpha and blue-green H-beta of glowing hydrogen.
- Note each series crowds toward its limit, the levels getting closer
  as $1/n^2$.
- See that the same level spacing produces UV (Lyman) and IR
  (Paschen) lines from one simple formula.

### Where this comes from

The Bohr quantization, the $E_n = -E_R/n^2$ ladder, and the Rydberg
series formula follow Carroll and Ostlie, *An Introduction to Modern
Astrophysics*, 2nd ed., Chapter 5, with the fuller derivation in
Eisberg and Resnick, *Quantum Physics*, 2nd ed., Chapter 5.

## Physical setup

A single electron orbits a proton in a Coulomb potential. The Bohr quantization condition $L = n \hbar$ pins discrete orbits indexed by integer $n \ge 1$ with energies $E_n = -E_R / n^2$, where $E_R = 13.605693$ eV is the (infinite-mass) Rydberg energy. Transitions between levels emit photons of wavelength
$$\frac{1}{\lambda} = R_H \left( \frac{1}{n_\ell^2} - \frac{1}{n_h^2} \right)$$
with $R_H \approx 1.09678 \times 10^7$ m$^{-1}$ the hydrogen Rydberg constant (proton-mass corrected).

## Governing equations

For an emission $n_h \to n_\ell$ ($n_h > n_\ell$), the photon energy and wavelength are

$$h\nu = E_R \left( \frac{1}{n_\ell^2} - \frac{1}{n_h^2} \right), \qquad \lambda = \frac{hc}{h\nu}.$$

Series names: Lyman ($n_\ell = 1$, UV), Balmer ($n_\ell = 2$, visible), Paschen ($n_\ell = 3$, near IR), Brackett ($n_\ell = 4$, mid IR), Pfund ($n_\ell = 5$, far IR). Series limit ($n_h \to \infty$): $\lambda = n_\ell^2 / R_H$.

## Numerical method

Closed-form evaluation. The left panel shows the energy ladder with all $n \le n_{max}$ levels and the filtered set of transition arrows; the right panel shows the emission lines on a logarithmic wavelength axis from 50 nm to 50000 nm, with each series colored. Series limits are shown as dashed lines.

## Controls

- Series selector: Lyman, Balmer, Paschen, Brackett, Pfund, or all.
- Maximum quantum number $n_{max}$ (3 to 14): how many upper levels to include.
- Line slider: highlight one transition in the current filter set.

## Expected qualitative features

1. Lyman series (purple) sits below 121 nm; Balmer (cyan) covers 410 to 656 nm in the visible; Paschen onward is in IR.
2. Each series converges to a series limit (dashed vertical) given by $n_\ell^2 / R_H$.
3. The Balmer alpha line (H-alpha, 656.3 nm) falls in the red end of the visible band.
4. Energy ladder shows levels packing logarithmically toward $E = 0$ at large $n$.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| ground state $E_1$ | $-E_R$ exact | invariants test |
| Lyman alpha | within 0.05 nm of 121.567 nm | invariants test |
| Balmer alpha (H-alpha) | within 0.3 nm of 656.279 nm (Bohr level) | invariants test |
| Balmer series limit | within 0.3 nm of 364.6 nm | invariants test |
| Lyman series limit | within 0.05 nm of 91.176 nm | invariants test |
| series wavelength ordering | strict (Lyman < Balmer < Paschen < Brackett) | invariants test |
| $E_n \to 0$ as $n \to \infty$ | $|E_{1000}| < 10^{-4}$ eV | invariants test |
| $h\nu = hc / \lambda$ self-consistency | within 0.01 eV | invariants test |

All confirmed in `invariants.test.mjs` (9 tests passing). Bohr-level accuracy is ~3 parts in 1e4; the residual against the observed lines is the fine-structure correction (Dirac + QED), which the classical Bohr model cannot capture.

## Limiting cases for verification

- Series limit: $n_h \to \infty$ gives $\lambda \to n_\ell^2 / R_H$ exactly.
- High $n$: $E_n \to 0^-$ as $n \to \infty$.
- Lyman alpha experimental 121.567 nm vs Bohr+$R_H$ prediction 121.566 nm: 0.001 nm residual = Lamb shift level.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the figure caption still reads as a paper sentence and the controls remain operable.

## Citations

- Carroll and Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 5 (`carroll-ostlie`).
- Eisberg and Resnick, *Quantum Physics*, 2e, Ch. 5 (`eisberg-resnick`) for the deeper Bohr derivation.

## Stretch goals

- Fine structure: split each level by $j$ via Dirac eigenvalues.
- Lyman / Balmer absorption mode (cool gas absorbing a blackbody continuum).
- Hydrogen-like ions ($Z \ne 1$): scale energies as $Z^2$.

## Risk register

- $n_{max}$ very large clutters the ladder; the renderer skips arrow columns once they exceed the plot width.
- Series-limit dashed line collides with the highest line at high $n_h$; visually accepted because the limit really IS approached by the high-$n_h$ transitions.
