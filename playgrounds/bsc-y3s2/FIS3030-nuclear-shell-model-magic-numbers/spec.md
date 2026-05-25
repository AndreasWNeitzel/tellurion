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
hook: 'Fill nuclear energy levels like atomic shells and a strong spin-orbit force produces the magic numbers 2, 8, 20, 28, 50, 82, 126 where nuclei are extra stable.'
one_paragraph: 'Nucleons occupy quantized single-particle levels of an average nuclear potential, protons and neutrons filling separately, each level holding 2j+1 of them. A plain oscillator potential gives the wrong shell closures; adding the strong spin-orbit term of Mayer and Jensen (1949) reorders the levels so the cumulative counts land exactly on the observed magic numbers 2, 8, 20, 28, 50, 82, 126, where nuclei show extra binding and stability. The playground fills levels up to a chosen nucleon count and highlights the closures. Reference: Krane, Introductory Nuclear Physics, Ch. 5.'
tags: [nuclear-particle, animation, live-readout]
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
references:
  - "Krane, Introductory Nuclear Physics, Ch. 5."
---

# Nuclear shell model and magic numbers

## Explainer

### What you are looking at

Nuclei with 2, 8, 20, 28, 50, 82, or 126 protons or neutrons are
unusually tightly bound and stable, the nuclear "magic numbers", the
analogue of noble-gas electron shells. They do not come out of a naive
potential; you need a strong spin-orbit force. The playground fills
nucleon levels and lights up the closures.

### Independent particles in an average well

Treat each nucleon as moving independently in the average potential of
all the others (a Woods-Saxon / harmonic-oscillator well). Solving it
gives single-particle levels $|n\ell j\rangle$, each holding $2j+1$
nucleons; protons and neutrons fill separately (they are distinct
fermions). Filling from the bottom, a closed shell occurs at a large
energy gap.

### Why plain shells give the wrong numbers

A pure harmonic-oscillator (or square) well predicts closures at
2, 8, 20, 40, 70, ..., which is right only up to 20 and then wrong.
Mayer and Jensen's fix (1949) was a strong spin-orbit term

$$H_\text{so} \propto -\,\xi(r)\,\boldsymbol\ell\cdot\mathbf s,$$

which splits each $\ell$ level into $j = \ell+\tfrac12$ and
$j = \ell-\tfrac12$, with the *higher-$j$* state pushed *down* a lot
(opposite sign and much larger than the atomic case). That depression
drops high-$j$ intruder levels into the shell below, opening big gaps
exactly at

$$2,\ 8,\ 20,\ 28,\ 50,\ 82,\ 126,$$

the observed magic numbers. The playground fills to a chosen nucleon
count and highlights when a cumulative total hits a closure, with the
spin-orbit-shifted level order.

### Things to try

- Fill toward 28, 50, 82: watch the big gap appear right at the magic
  number (a closed shell).
- Note the high-$j$ intruder levels dropping into the shell below,
  the spin-orbit signature that fixes 28, 50, 82, 126.
- Compare with the no-spin-orbit order (correct only up to 20).

### Where this comes from

The independent-particle shell model, the strong spin-orbit term, and
the magic numbers follow Krane, *Introductory Nuclear Physics*,
Chapter 5, after Mayer (1949) and Jensen (1949).

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

- Krane, *Introductory Nuclear Physics*, Ch. 5.
- Mayer 1949, Jensen 1949: original spin-orbit shell-model papers.

## Stretch goals

- Plot binding energy excess at magic numbers using SEMF + magic-number correction.
- Switch on / off the spin-orbit term to demonstrate which levels reorder.
- Pairing energy: highlight even-even, odd-odd, odd-A.

## Risk register

- Level ordering near $N = 50, 82, 126$ is sensitive to the choice of $W \cdot \ell \cdot s$ coefficient; this playground uses the textbook Krane figure.

## Planned upgrade (Phase 13 / Upgrade B)

Animated nucleon filling: Z and N sliders 0 to 126; each proton/neutron hops
onto the next shell-model level when the slider increments. At magic numbers
(2, 8, 20, 28, 50, 82, 126) the filled shell glows gold and the binding-energy
readout (SEMF-derived) shows the magic-number bump. Status: planned, not yet implemented.
