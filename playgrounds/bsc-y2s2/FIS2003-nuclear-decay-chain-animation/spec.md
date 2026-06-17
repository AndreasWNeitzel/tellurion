---
title: Radioactive Decay Chain
slug: nuclear-decay-chain-animation
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Watch uranium claw its way down to lead, shedding alpha clusters and flipping neutrons into protons, the half-life of each step set by the Gamow tunnelling law.'
one_paragraph: 'A heavy nucleus walks a decay series to stable lead. The primary scene is the physical nucleus, protons and neutrons packed and intermixed, transmuting each step: alpha decay sheds a He-4 cluster (Z-2, N-2), beta-minus turns a neutron into a proton (Z+1, N-1). The Q value comes from the Bethe-Weizsaecker semi-empirical mass formula and the alpha half-life from the Geiger-Nuttall law. The side panel is the Segre chart tracing the path from the parent to the stable endpoint (Pb-206 for U-238, Pb-208 for Th-232). Reference: Krane, Introductory Nuclear Physics, Chapters 3 and 6 to 8.'
tags: [nuclear, radioactivity, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2003
primary_citation: krane-nuclear
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
  - "Krane, Introductory Nuclear Physics."

---

# Radioactive Decay Chain

## Explainer

### What you are looking at

A heavy nucleus like uranium-238 is not stable. It sheds pieces step
by step, transmuting into a chain of daughter nuclides until it
reaches a stable lead isotope. The playground walks that chain and
shows why each step happens and how wildly the half-lives vary.

### Binding energy and why decay happens

How tightly a nucleus is bound is captured by the semi-empirical
(Bethe-Weizsaecker) mass formula for the binding energy of a nucleus
with $Z$ protons and mass number $A$:

$$B = a_V A - a_S A^{2/3} - a_C \frac{Z(Z-1)}{A^{1/3}}
      - a_A \frac{(A-2Z)^2}{A} + \delta,$$

a volume term minus surface, Coulomb and asymmetry penalties plus a
pairing term $\delta$. The binding energy per nucleon $B/A$ peaks near
iron, so heavy nuclei lower their energy by moving toward it. A decay
occurs only if its $Q$ value (the released energy, the difference of
parent and product rest energies) is positive.

### The two decay modes

- Alpha decay ejects a helium-4 cluster: $(Z,N)\to(Z-2,N-2)$.
- Beta-minus decay converts a neutron into a proton:
  $(Z,N)\to(Z+1,N-1)$, emitting an electron and an antineutrino.

The alpha half-life is set by quantum tunnelling through the Coulomb
barrier, the Geiger-Nuttall law,

$$\log_{10} t_{1/2} \approx \frac{1.72\,Z_d}{\sqrt{Q}} - 53.6,$$

so a small change in $Q$ swings the half-life over many orders of
magnitude.

### Things to try

- Step through U-238 and watch eight alpha and six beta decays land on
  stable Pb-206.
- Compare a high-$Q$ alpha step (fast) with a low-$Q$ one (slow) and
  read the Geiger-Nuttall trend.
- Switch to the Th-232 series and see it terminate on Pb-208.

### Where this comes from

The mass formula, the decay modes and the Geiger-Nuttall law follow
Krane, Introductory Nuclear Physics, Chapters 3 and 6 to 8.

## Physical setup

A radioactive parent nucleus decays through a chain of alpha and
beta-minus steps until it reaches a stable lead isotope. The nucleus
is drawn as a packed cluster of protons and neutrons; the Segre chart
records the path in the (N, Z) plane.

## Governing equations

Binding energy from Bethe-Weizsaecker (MeV):

`B = aV A - aS A^2/3 - aC Z(Z-1)/A^1/3 - aA (A-2Z)^2/A + delta`,

with `aV=15.75, aS=17.8, aC=0.711, aA=23.7`, pairing `aP=11.18`. Decay
shifts: alpha `(-2,-2)` plus He-4, beta-minus `(+1,-1)` plus
`e- nu`. Q values from the binding energies (and the neutron-hydrogen
mass difference for beta). Alpha half-life from Geiger-Nuttall
`log10(t_1/2) = 1.72 Z_d / sqrt(Q) - 53.6`.

## Numerical method

Closed-form SEMF and decay arithmetic; the U-238 and Th-232 series are
the canonical ordered mode sequences. The animation walks the chain
and shows the emitted particle; the chart traces the path. Reference:
Krane, *Introductory Nuclear Physics*, Ch. 3 (mass formula) and
Ch. 6-8 (alpha/beta/gamma).

## Controls

- decay series: U-238 (to Pb-206) or Th-232 (to Pb-208).
- decay step: scrub the chain (transmutes the nucleus and the path).
- Reset, Pause.

## Expected qualitative features

- Alpha decay shrinks the nucleus by four nucleons and jumps the chart
  diagonally; beta-minus flips a neutron to a proton (small up-left
  step).
- The Q value stays positive (spontaneous) and the alpha half-life
  swings over many orders of magnitude with Q.
- Both series end on a stable lead isotope.

## Invariants and acceptance thresholds

- Each mode shifts `(Z, N)` exactly; nucleon number and charge
  conserved; A drops 4 per alpha, unchanged per beta.
- SEMF `B/A` peaks for `45 < A < 75` at 8.4-9.2 MeV; Fe-56 within 3%.
- The U-238 chain is 8 alpha + 6 beta and ends at `(82, 124)`.
- Every alpha step has `Q > 0`; the net chain release is 30-70 MeV
  (SEMF underestimates the real ~52 MeV).
- At fixed daughter Z, `log10 t_1/2` falls monotonically as `Q_alpha`
  rises (Geiger-Nuttall).
- Beta-minus Q includes the `(m_n - m_H)` term.

## Limiting cases for verification

- Gamma: `(Z, N)` unchanged.
- Both series terminate on stable lead (`Z = 82`).

Source: Krane, *Introductory Nuclear Physics*, Ch. 3, 6-8.
