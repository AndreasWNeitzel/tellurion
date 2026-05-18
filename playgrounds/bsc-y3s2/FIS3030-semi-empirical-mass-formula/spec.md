---
title: Semi-Empirical Mass Formula
slug: semi-empirical-mass-formula
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3030
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: krane-nuclear
primary_chapter: 3
hook: 'Treat the nucleus as a charged liquid drop and five simple terms predict the binding energy of every nucleus, and which ones fission or fuse.'
one_paragraph: 'The semi-empirical mass formula models the nucleus as a charged liquid drop. The binding energy is a volume term (a_V A) minus a surface term (a_S A^2/3), minus Coulomb repulsion, minus a proton-neutron asymmetry term, plus a pairing term. Together they reproduce the binding-energy-per-nucleon curve that peaks near iron, which is why light nuclei release energy by fusion and heavy nuclei by fission. The playground sweeps Z and A and shows each term''s contribution to the total. Reference: Krane, Introductory Nuclear Physics, Ch. 3.'
tags: [nuclear-particle, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Semi-empirical mass formula (Bethe-Weizsacker)

## Explainer

### What you are looking at

Treat the nucleus as a charged liquid drop and five simple terms
predict the binding energy of every nucleus, why iron is the most
bound, why heavy nuclei fission and light ones fuse, and where the
stable isotopes lie. The playground sweeps $Z$ and $A$ and shows each
term's contribution.

### The Bethe-Weizsacker formula

The binding energy is

$$B(A,Z) = a_V A
  - a_S A^{2/3}
  - a_C\frac{Z(Z-1)}{A^{1/3}}
  - a_A\frac{(N-Z)^2}{A}
  \pm \frac{a_P}{\sqrt A},$$

with the Wapstra coefficients ($a_V=15.8$, $a_S=18.3$, $a_C=0.714$,
$a_A=23.2$, $a_P=12.0$ MeV). Each term is one piece of physics:

- Volume $+a_V A$: every nucleon bonds to its neighbors (short-range
  strong force), so binding grows with the number of nucleons.
- Surface $-a_S A^{2/3}$: surface nucleons have fewer neighbors, a
  deficit scaling with surface area.
- Coulomb $-a_C Z(Z-1)/A^{1/3}$: proton-proton electrostatic
  repulsion, growing with $Z^2$ and the more so for small nuclei.
- Asymmetry $-a_A(N-Z)^2/A$: the Pauli principle penalizes unequal
  proton and neutron numbers.
- Pairing $\pm a_P/\sqrt A$: like nucleons pair up, favoring
  even-even, disfavoring odd-odd.

### What it predicts

Binding energy per nucleon $B/A$ rises, peaks near $A\approx56$
(iron/nickel), then declines, which is exactly why fusing light nuclei
and fissioning heavy ones both release energy. At fixed $A$ the most
bound charge (the valley of stability) is

$$Z^* \approx \frac{A}{2 + \tfrac12 a_C A^{2/3}/a_A},$$

which bends below $Z=A/2$ for heavy nuclei because Coulomb repulsion
favors extra neutrons. The playground shows the $B/A$ curve and the
valley as you vary $Z, A$.

### Things to try

- Sweep $A$ and watch $B/A$ peak near iron: the master curve of
  nuclear energy.
- At fixed heavy $A$, vary $Z$ and find the valley minimum shifted
  neutron-rich (the Coulomb term at work).
- Toggle even-even vs odd-odd and see the pairing term shift the
  binding.

### Where this comes from

The liquid-drop terms, the Wapstra coefficients, and the valley of
stability follow Krane, *Introductory Nuclear Physics*, Chapter 3
(the Bethe-Weizsacker semi-empirical mass formula).

## Physical setup

The nuclear binding energy is the sum of five terms:

- Volume: $+a_V A$.
- Surface: $-a_S A^{2/3}$.
- Coulomb: $-a_C Z(Z-1) / A^{1/3}$.
- Asymmetry: $-a_A (N-Z)^2 / A$.
- Pairing: $\pm a_P / \sqrt{A}$ for even-even / odd-odd, 0 for odd $A$.

Wapstra (1995) coefficients: $a_V = 15.8$, $a_S = 18.3$, $a_C = 0.714$, $a_A = 23.2$, $a_P = 12.0$ MeV. The valley of stability is the $Z^*(A)$ that maximizes $B$ at fixed $A$; the closed-form $Z^* \approx A / (2 + 0.5 a_C A^{2/3} / a_A)$.

## Numerical method

Closed-form per nucleus; the trajectory line is $B/A$ evaluated at $(A, Z^*(A))$ for $A = 1$ to $250$.

## Controls

- Mass number $A$ from 4 to 240.

## Expected qualitative features

1. Curve rises from 1 to 60, peaks near iron at $B/A \approx 8.79$ MeV, falls slowly to U-238 at 7.6 MeV.
2. Fe-56 and Ni-62 sit in the peak region.
3. Term breakdown shows volume dominating from the start; surface losing weight as $A^{-1/3}$; Coulomb growing as $Z^2/A^{4/3}$ to dominate above iron; asymmetry contributing increasingly with neutron excess.
4. Pairing term flips sign with parity.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| peak of B/A in A = 50-80, height 8.4-9.0 MeV | strict | invariants test |
| Fe-56 binding per nucleon in 8.4-8.9 MeV | strict | invariants test |
| U-238 binding per nucleon in 7.3-7.8 MeV | strict | invariants test |
| Pb-208 binding per nucleon in 7.7-8.1 MeV | strict | invariants test |
| pairing sign: even-even > 0, odd-odd < 0, odd-A = 0 | strict | invariants test |
| optimal Z formula matches closed form | within $10^{-12}$ | invariants test |
| heavy nuclei: $Z^* < A/2$ | strict | invariants test |
| volume term dominates at A = 100 (ratio > 3) | strict | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- Light $A$: surface term dominates the negative side; binding per nucleon is low.
- A = 56: iron peak, fusion releases below, fission releases above.
- $A \to 240$: Coulomb term dominates; binding drops; eventually instability.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Krane, *Introductory Nuclear Physics*, Ch. 3 (`krane-nuclear`).
- Bethe and Weizsacker 1935 / 1936.

## Stretch goals

- Fit the coefficients to a measured B/A table.
- Add the shell-model magic numbers (2, 8, 20, 28, 50, 82, 126) where SEMF systematically under-predicts.
- Fission barrier estimate via the liquid-drop deformation.

## Risk register

- The Wapstra coefficients are one of several conventions; other compilations give slightly different values. The tests use 5 percent tolerance to absorb this.

## Planned upgrade (Phase 13 / Upgrade E)

Reframe as a fit-the-coefficients puzzle: five SEMF term sliders all start
at 0; user drags them to match an analytic B/A heatmap on the N-Z chart.
A "match" indicator lights when the fit is within 5% of the optimum. The
valley of stability emerges as the user approaches the correct parameters.
Status: planned, not yet implemented.
