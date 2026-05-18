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
hook: 'Fire particles one at a time at a double slit; the interference pattern that builds up has fringes set by lambda = h/p.'
one_paragraph: 'de Broglie duality made physical: a matter-wave double-slit experiment. Particles of the chosen species and kinetic energy are fired one at a time at a double slit and land stochastically with probability given by the two-slit intensity for lambda = h/p (from sim.js), so the interference pattern builds up dot by dot. A long-wavelength electron shows the textbook multi-fringe pattern; a proton, neutron, or carbon atom at the same energy has a far shorter lambda and the fringes collapse into a classical scatter. A compact lambda(T) log-log strip keeps the quantitative curve for all five species with the live marker and readouts. sim.js (deBroglieNm and the species table) is unchanged.'
tags: [quantum, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# de Broglie wavelength vs kinetic energy

## Explainer

### What you are looking at

Every particle has a wavelength. A slow electron has one comparable to
an atom (so it diffracts off crystals); a thrown baseball has one
absurdly tiny (so it never does). The playground plots that wavelength
against kinetic energy for five species on log-log axes, and shows the
double-slit pattern emerging dot by dot.

### The de Broglie relation

A particle of momentum $p$ has wavelength

$$\lambda = \frac{h}{p} = \frac{hc}{pc},
  \qquad pc = \sqrt{(T + mc^2)^2 - (mc^2)^2}.$$

The relativistic momentum is used so the formula is correct in both
limits:

- Non-relativistic ($T \ll mc^2$): $p \approx \sqrt{2mT}$, so
  $\lambda \propto T^{-1/2}$, a line of slope $-1/2$ on the log-log
  plot.
- Ultra-relativistic ($T \gg mc^2$): $\lambda \to hc/T$, the massless
  photon limit, slope $-1$.

The bend between the two regimes happens at $T \sim mc^2$, which is why
the electron (rest energy 0.511 MeV) and the proton (938 MeV) curves
turn over at very different energies.

### Why it is real

It is not a formal analogy: rejection-sampling incident particles
through a fixed double slit, the binned hits build up the interference
pattern $I(\theta) = \operatorname{sinc}^2(\pi a\sin\theta/\lambda)\,
\cos^2(\pi d\sin\theta/\lambda)$, the exact same fringes light makes.
Each particle lands as a single dot, yet the statistics trace out the
wave. That is the heart of wave-particle duality.

### Things to try

- Lower the electron energy and watch $\lambda$ grow up toward atomic
  scale (the regime electron microscopes and Davisson-Germer use).
- Compare the photon (massless, slope $-1$ everywhere) to the
  electron (slope $-1/2$ then bending to $-1$).
- Watch the slit pattern build stochastically from single hits.

### Where this comes from

The de Broglie relation, the relativistic momentum, and the
non-relativistic / photon limits follow Eisberg and Resnick,
*Quantum Physics*, 2nd ed., Chapter 3, after de Broglie (1924).

## Physical setup

A particle of rest mass $m$ and kinetic energy $T$ has a quantum wavelength

$$\lambda = h / p = hc / pc, \qquad pc = \sqrt{(T + mc^2)^2 - (mc^2)^2}.$$

The playground plots $\lambda$ versus $T$ on a log-log axis for five species: photon (massless), electron ($m c^2 = 0.511$ MeV), proton (938.3 MeV), neutron (939.6 MeV), and a $^{12}$C atom (about 11 GeV).

## Governing equations

Relativistic formula above is used throughout to guarantee correctness in both limits. For $T \ll mc^2$, this reduces to the non-relativistic $p = \sqrt{2 m T}$, giving $\lambda \propto T^{-1/2}$. For $T \gg mc^2$, it asymptotes to $\lambda = hc/T$, the photon limit. The transition between regimes happens around $T \sim mc^2$.

## Numerical method

Closed-form $\lambda(T)$ from sim.js (unchanged). The two-slit intensity $I(\theta) = \mathrm{sinc}^2(\pi a \sin\theta/\lambda)\,\cos^2(\pi d \sin\theta/\lambda)$ uses a fixed apparatus ($d$, $a$, angular range); each incident particle is rejection-sampled from $I$ and binned, so the pattern emerges stochastically. The $\lambda(T)$ strip samples 200 log-spaced points spanning $10^{-3}$ to $10^{12}$ eV.

## Controls

- Species selector (photon, electron, proton, neutron, C-12).
- $\log_{10}(T/\mathrm{eV})$ slider from $-3$ to $12$.

## Expected qualitative features

1. Single detections look random at first, then accumulate into a two-slit interference pattern under a single-slit envelope.
2. A long-$\lambda$ electron shows several clear fringes; raising $T$ or switching to a heavier species shortens $\lambda$ and tightens the fringes.
3. When $\lambda$ is far below the apparatus scale (proton, neutron, C-12 at the same $T$) the fringes are unresolvable and the screen reads as a classical scatter.
4. The $\lambda(T)$ strip stays slope $-1/2$ below $T \sim mc^2$, steepens to $-1$ above it, and all species converge to the photon line at high $T$.

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
