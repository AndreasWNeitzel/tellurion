---
title: Beta Decay - Fermi vs Gamow-Teller
slug: nuclear-beta-decay-fermi-vs-gt
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3030
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: krane-nuclear
primary_chapter: 9
hook: 'Beta decay comes in two flavors: Fermi transitions leave the nuclear spin alone, Gamow-Teller flips it, and a Kurie plot straightens the messy spectrum into a line.'
one_paragraph: 'In nuclear beta decay an electron and an antineutrino share the released energy, so the electron spectrum is continuous. Two channels contribute: Fermi transitions (electron and neutrino spins antiparallel, no nuclear spin change) and Gamow-Teller transitions (spins parallel, nuclear spin can change by one), each with its own selection rules. The playground shows the spectrum and the Kurie plot, a rescaling that turns the allowed spectrum into a straight line whose intercept is the endpoint energy and a probe of the neutrino mass. Reference: Krane, Introductory Nuclear Physics, Ch. 9.'
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
# Fermi vs Gamow-Teller beta decay
Selection rules and Kurie plot. Source: Krane Nuclear Physics Ch. 9 (`krane-nuclear`).

## Explainer

### What you are looking at

In beta decay a nucleus emits an electron and a (anti)neutrino that
share the released energy, so the electron energy spectrum is a smooth
continuous curve, not a line. The playground shows that spectrum, the
two decay channels (Fermi and Gamow-Teller), and the Kurie plot trick
that turns the messy curve into a straight line you can read.

### The continuous spectrum

The decay rate per electron energy follows Fermi's golden rule with
three-body phase space:

$$\frac{dN}{dE} \;\propto\; F(Z,E)\;p\,E\,(Q-E)^2,$$

where $p, E$ are the electron momentum and energy, $Q$ is the total
released energy (endpoint), and $F(Z,E)$ is the Coulomb (Fermi)
correction. The $(Q-E)^2$ factor is the neutrino phase space; it forces
the spectrum to zero at the endpoint $E=Q$.

### Fermi vs Gamow-Teller

Two ways the lepton pair can carry off angular momentum:

- Fermi: electron and neutrino spins antiparallel (singlet), they
  carry no spin. Selection rule $\Delta J = 0$, no parity change.
- Gamow-Teller: spins parallel (triplet), they carry one unit.
  Selection rule $\Delta J = 0, \pm1$ (not $0\to0$).

Which dominates depends on the nuclear states; most decays mix both.

### The Kurie plot

Rearrange the spectrum: plotting

$$\sqrt{\frac{dN/dE}{F(Z,E)\,p\,E}} \;\propto\; (Q - E)$$

gives a straight line that hits zero exactly at the endpoint $Q$. That
linearization is how the endpoint energy is measured precisely, and how
experiments bound the neutrino mass: a nonzero neutrino mass bends the
Kurie line down near the endpoint. The playground shows the spectrum
and its Kurie straight line, with the endpoint marked.

### Things to try

- Watch the spectrum rise then fall to zero at the endpoint $Q$ (the
  $(Q-E)^2$ neutrino phase space).
- Switch the Fermi/Gamow-Teller mix and see the selection rules change
  which transitions are allowed.
- Read the Kurie plot: a straight line whose x-intercept is $Q$.

### Where this comes from

The beta spectrum shape, the Fermi and Gamow-Teller selection rules,
and the Kurie plot follow Krane, *Introductory Nuclear Physics*,
Chapter 9.
