---
title: Nuclear Shell Model Magic Numbers
slug: nuclear-shell-model-magic-numbers
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3030
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: krane-nuclear
primary_chapter: 5
---

# Nuclear shell model and magic numbers

## Physical setup

Nucleons (protons and neutrons separately) fill single-particle levels of an average nuclear potential. The harmonic-oscillator-with-strong-spin-orbit model of Mayer and Jensen (1949) gives shell closures at $2, 8, 20, 28, 50, 82, 126$ that match the observed extra binding (Hartree-Fock confirmation came decades later).

## Numerical method

Static level table (Krane Ch. 5, fig 5.6). Each level $|nlj\rangle$ has occupancy $2j+1$. Fill from the bottom up to the requested $N$.

## Controls

- Nucleon count $N$ from 1 to 126.

## Expected qualitative features

1. Cumulative counts reach $2, 8, 20, 28, 50, 82, 126$ exactly at shell closures.
2. Magic-number levels are highlighted (accent color in the level diagram).
3. Without spin-orbit, only $2, 8, 20$ would be closures; observed $28, 50, 82, 126$ are due to the spin-orbit splitting reordering levels.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| MAGIC sequence is $2, 8, 20, 28, 50, 82, 126$ exact | strict | invariants test |
| occupancy = $2j + 1$ for every level | strict | invariants test |
| cumul grows monotonically | strict | invariants test |
| cumul = sum of occupancies up to that level | exact | invariants test |
| every magic number appears as a cumul | strict | invariants test |
| fillIndex(8) returns 1p1/2 | strict | invariants test |
| fillIndex(126) reaches 1i13/2 | strict | invariants test |
| isMagic identifies magic numbers exactly | strict | invariants test |
| levelEnergyMeV grows monotonically | strict | invariants test |

All confirmed in `invariants.test.mjs` (9 tests passing).

## Limiting cases for verification

- $N = 2$ (He-4 alpha particle nucleus): 1s1/2 closed.
- $N = 82$ (Pb-208 neutrons): closed shell.
- $N = 126$ (Pb-208 protons + neutrons): closed shell.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Krane, *Introductory Nuclear Physics*, Ch. 5 (`krane-nuclear`).
- Mayer 1949, Jensen 1949: original spin-orbit shell-model papers.

## Stretch goals

- Plot binding energy excess at magic numbers using SEMF + magic-number correction.
- Switch on / off the spin-orbit term to demonstrate which levels reorder.
- Pairing energy: highlight even-even, odd-odd, odd-A.

## Risk register

- Level ordering near $N = 50, 82, 126$ is sensitive to the choice of $W \cdot \ell \cdot s$ coefficient; this playground uses the textbook Krane figure.
