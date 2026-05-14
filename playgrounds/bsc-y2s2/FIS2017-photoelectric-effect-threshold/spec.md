---
title: Photoelectric Effect Threshold
slug: photoelectric-effect-threshold
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2017
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: eisberg-resnick
primary_chapter: 2
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [quantum, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Photoelectric effect: $KE_{max}$ vs photon frequency

## Physical setup

Monochromatic light of frequency $\nu$ illuminates a clean metal cathode with work function $\phi$. Einstein 1905: each photon delivers exactly $h\nu$ of energy to a bound electron. Electrons appear only if $h\nu \ge \phi$. The maximum kinetic energy of the ejected electron is
$$KE_{max} = h\nu - \phi, \qquad \nu > \nu_0 \equiv \phi / h.$$
Below threshold, no electrons are ejected, regardless of light intensity. The threshold is a sharp cutoff in frequency, not in intensity, which is the central quantum signature.

## Governing equations

For nu in PHz (= $10^{15}$ Hz) and energies in eV, $h \approx 4.136 \times 10^{-15}$ eV s gives $h \cdot 10^{15} = 4.136$ eV per PHz. The threshold wavelength is $\lambda_0 = hc/\phi$, with $hc \approx 1239.842$ eV nm.

## Numerical method

Closed-form. No time integration. The plot is drawn each rAF frame from the current $\nu$ slider and the selected metal's $\phi$.

## Controls

- Metal selector (8 options, $\phi$ from 2.14 eV to 6.35 eV).
- Photon frequency $\nu$ in PHz (0.1 to 2.5).

## Expected qualitative features

1. Eight parallel lines with slope $h$, intercepts at different $\nu_0 = \phi/h$.
2. The highlighted line is bold and full opacity; others are muted.
3. The vertical dashed marker shows the current $\nu$; a colored dot marks the highlighted metal's $KE_{max}$ at that frequency.
4. Cesium (lowest $\phi$) responds to red-visible light around $\nu_0 \approx 0.52$ PHz; platinum (highest $\phi$) needs deep UV around 1.5 PHz.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $KE_{max} = 0$ at $\nu_0 = \phi/h$ | exact (all 8 metals) | invariants test |
| $KE_{max} = 0$ for $\nu < \nu_0$ | exact (sharp cutoff) | invariants test |
| slope $dKE/d\nu = h$ | within $10^{-12}$ relative | invariants test |
| Cesium $\lambda_0 \approx 579.36$ nm | within 0.1 nm | invariants test |
| Platinum $\lambda_0 \approx 195.25$ nm | within 0.5 nm | invariants test |
| energy conservation $KE_{max} + \phi = h\nu$ | within $10^{-12}$ relative | invariants test |
| wavelength and frequency formulations agree | within $10^{-9}$ relative | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $\nu = \nu_0$: $KE_{max} = 0$ exactly.
- $\nu \gg \nu_0$: $KE_{max} \to h\nu$, asymptotic linearity dominates over work function.
- $\phi \to 0$ (idealized free electron): threshold disappears; every photon ejects an electron.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders remain functional and the figure caption still reads as a paper sentence.

## Citations

- Eisberg and Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles*, 2e, Ch. 2 (`eisberg-resnick`).
- Work-function values from canonical compilations; the spread (2.14 to 6.35 eV) covers Cs, K, Na, Ca, Zn, Ag, W, Pt.

## Stretch goals

- Add intensity slider showing photocurrent (number of electrons per second).
- Add stopping voltage axis to show how $V_s = KE_{max}/e$ is read off in Millikan's experiment.
- Switch between $\nu$ and $\lambda$ as the x-axis at a button click.

## Risk register

- The slope check is exact algebraically; any numerical residual is floating-point noise (verified $< 10^{-12}$).
- Slider range max set to 2.5 PHz so the deepest-UV platinum line is visible at threshold.
