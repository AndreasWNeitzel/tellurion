---
title: Alpha Decay via Gamow Tunneling
slug: alpha-decay-gamow-tunneling
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3030
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: krane-nuclear
primary_chapter: 8
hook: 'An alpha wavefunction tunnels the Coulomb barrier; the nucleus emits alphas at the Geiger-Nuttall rate.'
one_paragraph: 'Gamow alpha decay shown as the process itself. An alpha wavefunction oscillates in the nuclear well, decays exponentially across the classically forbidden Coulomb-barrier region (WKB suppression set by the Gamow exponent), and leaks a small transmitted wave. A nuclear scene emits alpha particles at a cadence mapped from the Geiger-Nuttall half-life, so a high-Q nuclide visibly streams alphas with a narrow barrier while a low-Q one is nearly quiescent behind a wide barrier. A compact Geiger-Nuttall strip carries the log10 T vs Q^-1/2 line with the live (Z, Q) marker and the half-life read out. Reference: Krane, Introductory Nuclear Physics, Chapter 8; Gamow 1928.'
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
---
# Alpha decay: Gamow tunneling

## Explainer

### What you are looking at

An alpha particle is trapped inside a nucleus by a Coulomb barrier
taller than its own energy. Classically it can never get out. Quantum-
mechanically it tunnels, and because tunneling probability is
exponentially sensitive to the barrier, half-lives span 30 orders of
magnitude for a tiny change in decay energy. That extreme sensitivity
is the Geiger-Nuttall law, and the playground shows it.

### The barrier and the tunneling factor

A preformed alpha sits in the nuclear well and faces the Coulomb
barrier $V(r) = 1.44\,Z'/r$ MeV (with $Z'$ the daughter charge,
$r$ in fm). It escapes with energy $Q < V_\max$ only by tunneling. The
WKB (Gamow) penetration probability is $T = e^{-2G}$ with the Gamow
factor

$$G \;\propto\; \frac{Z'}{\sqrt Q},$$

obtained by integrating $\sqrt{2m(V-E)}$ across the classically
forbidden region. The decay constant is the barrier-assault frequency
times this exponentially tiny factor.

### The Geiger-Nuttall law

Taking the log turns the exponential into a straight line:

$$\log_{10} T_{1/2} \;=\; a + b\,\frac{Z}{\sqrt Q},$$

(textbook $a \approx -46.83$, $b \approx 1.61$ with $Q$ in MeV). The
$1/\sqrt Q$ in the exponent is the punchline: nudge the decay energy
$Q$ up by a little and the half-life plummets by many orders of
magnitude. That is why naturally occurring alpha emitters range from
microseconds to billions of years with $Q$ varying by only a few MeV.
The playground shows the schematic wavefunction (standing wave in the
well, exponential decay across the barrier, small transmitted wave) and
the Geiger-Nuttall line.

### Things to try

- Raise the decay energy $Q$ slightly and watch $\log_{10}T_{1/2}$
  drop steeply (the $Z/\sqrt Q$ exponent).
- Increase the daughter charge $Z'$ and watch the barrier thicken and
  the half-life lengthen enormously.
- Note the wavefunction: large in the well, exponentially suppressed
  through the barrier, tiny but nonzero outside, tunneling made
  visible.

### Where this comes from

The Gamow WKB penetration factor and the Geiger-Nuttall law follow
Krane, *Introductory Nuclear Physics*, Chapter 8 (after Gamow 1928).

## Physical setup

A preformed alpha particle is bound in the nuclear well and must tunnel the Coulomb barrier $V(r) = 1.44 Z'/r$ (MeV, fm) to escape with energy $Q$. The semiclassical penetration factor gives $\log_{10} T_{1/2} = a + b\,Z/\sqrt{Q}$, the Geiger-Nuttall law (textbook $a = -46.83$, $b = 1.61$ with $Z$ the daughter charge and $Q$ in MeV). Source: Krane Nuclear Physics Ch. 8.

## Numerical method

sim.js (unchanged) supplies `geigerNuttallLogT(Z, Q)` and the Gamow exponent. The wavefunction is a schematic: a standing wave in the well, a WKB-style exponential envelope across the forbidden region with total suppression $\exp(-G)$, and a small travelling transmitted wave. The emission cadence is $\propto 10^{\log_{10}T}$ compressed to a wide but finite visible band.

## Controls

- Daughter charge $Z$ (50 to 100) and decay energy $Q$ (1 to 12 MeV).
- Reset and Pause.

## Expected qualitative features

1. The forbidden tunneling region widens as $Q$ falls; the wavefunction inside is suppressed accordingly.
2. High-$Q$ (short-lived) nuclides stream alphas rapidly; low-$Q$ (long-lived) ones almost never emit.
3. The Geiger-Nuttall line is straight in $Q^{-1/2}$ with the live marker tracking the half-life.
