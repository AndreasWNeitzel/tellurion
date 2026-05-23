---
title: Addition of Two Angular Momenta
slug: addition-of-angular-momenta
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3029
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: sakurai-qm
primary_chapter: 3
hook: 'Couple two spins and the allowed totals run from their difference to their sum in integer steps; the dimensions always add up to the product.'
one_paragraph: 'Adding two angular momenta j1 and j2 quantum-mechanically gives a total j running from |j1 - j2| to j1 + j2 in integer steps, with the multiplicities summing to (2 j1 + 1)(2 j2 + 1). The playground shows the uncoupled product basis reorganizing into the coupled total-j multiplets and the Clebsch-Gordan weights that connect them. This is the bookkeeping behind atomic terms, nuclear spins, and particle multiplets. Reference: Sakurai, Modern Quantum Mechanics, Ch. 3.'
tags: [quantum, atomic-molecular, animation, live-readout]
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
# Adding two angular momenta
$j_1 \otimes j_2 = |j_1-j_2| \oplus \dots \oplus j_1+j_2$. Source: Sakurai QM Ch. 3.

## Explainer

### What you are looking at

Two quantum spins do not add like arrows. Combine $j_1$ and $j_2$ and
the total comes out as a discrete ladder of possible values, each
appearing exactly once, with the dimensions always matching. The
playground shows the uncoupled product states reorganizing into the
coupled total-$J$ multiplets.

### The Clebsch-Gordan series

Coupling angular momenta $j_1$ and $j_2$ gives total $J$ ranging in
integer steps,

$$j_1 \otimes j_2 = |j_1 - j_2| \;\oplus\; \dots \;\oplus\; (j_1+j_2),$$

the quantum "triangle rule". The bookkeeping is exact: the dimensions
must balance,

$$\sum_{J=|j_1-j_2|}^{j_1+j_2}(2J+1) = (2j_1+1)(2j_2+1).$$

So $\tfrac12\otimes\tfrac12 = 0\oplus1$ (a spin-0 singlet plus a spin-1
triplet, $1+3 = 4 = 2\times2$), $1\otimes\tfrac12 =
\tfrac12\oplus\tfrac32$, and so on.

### Two bases, one unitary change

There are two natural ways to label the states: the uncoupled basis
$|j_1 m_1\rangle|j_2 m_2\rangle$ (each spin's projection known) and the
coupled basis $|J M\rangle$ (total known). The Clebsch-Gordan
coefficients $\langle j_1 m_1\, j_2 m_2 | J M\rangle$ are the unitary
matrix between them; they vanish unless $M = m_1+m_2$ and the triangle
rule holds. This is exactly the machinery that builds atomic term
symbols, nuclear spins, and hadron multiplets, and the playground lets
you pick $j_1, j_2$ and read off the resulting ladder and coefficients.

### Things to try

- Set $j_1=j_2=\tfrac12$ and see the singlet ($J=0$) and triplet
  ($J=1$): the two-electron spin states.
- Change $j_2$ and watch the $J$ ladder lengthen, dimensions still
  summing to $(2j_1+1)(2j_2+1)$.
- Read a Clebsch-Gordan column and confirm it is a unit vector
  (the basis change is unitary).

### Where this comes from

The Clebsch-Gordan decomposition, the triangle and dimension rules,
and the coefficients follow Sakurai, *Modern Quantum Mechanics*,
Chapter 3.
