---
title: de Broglie Wavelength
slug: de-broglie-wavelength
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2017
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: eisberg-resnick
primary_chapter: 3
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

# de Broglie wavelength vs kinetic energy

## Physical setup

A particle of rest mass $m$ and kinetic energy $T$ has a quantum wavelength

$$\lambda = h / p = hc / pc, \qquad pc = \sqrt{(T + mc^2)^2 - (mc^2)^2}.$$

The playground plots $\lambda$ versus $T$ on a log-log axis for five species: photon (massless), electron ($m c^2 = 0.511$ MeV), proton (938.3 MeV), neutron (939.6 MeV), and a $^{12}$C atom (about 11 GeV).

## Governing equations

Relativistic formula above is used throughout to guarantee correctness in both limits. For $T \ll mc^2$, this reduces to the non-relativistic $p = \sqrt{2 m T}$, giving $\lambda \propto T^{-1/2}$. For $T \gg mc^2$, it asymptotes to $\lambda = hc/T$, the photon limit. The transition between regimes happens around $T \sim mc^2$.

## Numerical method

Closed-form. $\lambda(T)$ is sampled at 200 logarithmically-spaced points spanning $10^{-3}$ to $10^{12}$ eV. Output rendered as $\log_{10}\lambda$ versus $\log_{10}T$.

## Controls

- Species selector (photon, electron, proton, neutron, C-12).
- $\log_{10}(T/\mathrm{eV})$ slider from $-3$ to $12$.

## Expected qualitative features

1. Below $T \sim mc^2$, each massive-particle line has slope $-1/2$ on the log-log plot.
2. Above $T \sim mc^2$, the slope steepens to $-1$ as the particle goes ultra-relativistic.
3. All massive-particle lines converge to the photon line at high $T$.
4. Reference dashed lines mark the atomic scale (0.1 nm) and the nuclear scale (1 fm). The crossings are physically meaningful: electrons need about 100 eV to probe atomic structure; protons need MeV to probe nuclear structure.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| photon: $\lambda = hc/E$ | exact | invariants test |
| non-rel agrees with rel at low T | within $10^{-4}$ relative (electron at 1 eV) | invariants test |
| 100 eV electron: $\lambda = 0.1227$ nm | within 0.001 nm | invariants test |
| 0.025 eV thermal neutron: $\lambda = 0.1808$ nm | within 0.001 nm | invariants test |
| rel diverges from non-rel at 1 MeV electron | $|\Delta \lambda / \lambda| > 0.1$ | invariants test |
| proton de Broglie at 1 MeV $<$ electron at same T | strict | invariants test |
| 300 K thermal electron: $\lambda$ in (3, 12) nm | strict | invariants test |
| PARTICLES list completeness | photon, electron, proton, neutron, C-12 | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- Photon: $\lambda = hc/E$ exactly, all $E$.
- Electron at 50 eV: 0.173 nm, matches Davisson-Germer.
- Electron at 1 MeV: relativistic; $\lambda \approx 0.00087$ nm.
- $T \to 0$: $\lambda \to \infty$ (massive particles).

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders remain functional and the figure caption still reads as a paper sentence.

## Citations

- Eisberg and Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles*, 2e, Ch. 3 (`eisberg-resnick`).
- de Broglie 1924 thesis: matter waves with $\lambda = h/p$.
- Davisson and Germer 1927: experimental confirmation via electron diffraction in nickel.

## Stretch goals

- Overlay the thermal de Broglie length $\lambda_{th} = h / \sqrt{2 \pi m k_B T}$ as a function of temperature.
- Add a quantum-degeneracy band where $\lambda > $ inter-particle spacing (Fermi gas / BEC threshold).
- Compton-wavelength reference line $h/mc$ for each species (relativistic asymptote).

## Risk register

- The high-energy end ($T \gtrsim 10^{12}$ eV) loses double-precision accuracy on $pc^2 = E^2 - m^2$; values are still finite for the species shown but the slope check should not be tightened past $10^{-12}$.
- The C-12 line begins very high in T and falls off the plot at low T; the curve renderer skips off-plot segments cleanly.
