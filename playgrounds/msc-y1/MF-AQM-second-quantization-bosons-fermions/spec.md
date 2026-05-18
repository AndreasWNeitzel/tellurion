---
title: Second Quantization: Fock States, Ladder Operators, (Anti)commutators
slug: second-quantization-bosons-fermions
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-AQM
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: dirac1927
hook: 'In the occupation-number representation a field is built from one ladder: a-dagger adds a quantum (sqrt(n+1)), a removes one (sqrt(n)). Bosons obey [a, a-dagger] = 1 and climb without limit; fermions obey {a, a-dagger} = 1 so a-dagger|1> = 0 and the ladder has only two rungs. The operator algebra here is exact to machine precision.'
one_paragraph: 'An interactive single-mode Fock space (Dirac 1927; Fetter and Walecka 1971; Sakurai and Napolitano). A state is a coefficient vector over the number basis |0>, |1>, ...; the annihilation and creation operators act as a|n> = sqrt(n)|n-1>, a-dagger|n> = sqrt(n+1)|n+1> for bosons (with [a, a-dagger] = 1, N = a-dagger a), and as the Pauli-restricted a|1> = |0>, a|0> = 0, a-dagger|0> = |1>, a-dagger|1> = 0, a^2 = 0 for fermions (with {a, a-dagger} = 1, N in {0,1}). The ladder panel shows the rungs and the current amplitudes as a-dagger pumps the state up (bosons climb; fermions saturate at |1> by Pauli). A second panel verifies the (anti)commutator identity by acting with (a a-dagger -+ a-dagger a) on the state and overlaying the result on the input (eigenvalue 1). A third panel shows the occupation distribution, which is Poissonian for the bosonic coherent state. The numerics are the gate-tested sim.js: exact Fock-space linear algebra, deterministic, no RNG; the invariants check the sqrt(n) lowering and sqrt(n+1) raising, the bosonic commutator and number spectrum, the adjoint relation, the full fermionic Pauli algebra and anticommutator, the coherent state as a normalised Poissonian eigenstate of a, and the Pauli saturation of the pump.'
tags: [quantum-mechanics, second-quantization, fock-space, ladder-operators, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [stat, mode, alpha]
---

# Second Quantization: Fock States, Ladder Operators, (Anti)commutators

## Physical setup

A single field mode in the occupation-number (Fock) representation.
The number states |n> form the basis; the ladder operators add or
remove one quantum. Bosons can pile up arbitrarily many quanta in the
mode; fermions are limited to occupation 0 or 1 by the Pauli
principle. The bosonic coherent state, the eigenstate of the
annihilation operator, has a Poissonian occupation distribution.

## Governing equations

Bosons (Dirac 1927):

```math
a|n\rangle = \sqrt{n}\,|n-1\rangle,\quad
a^\dagger|n\rangle = \sqrt{n+1}\,|n+1\rangle,\quad
[a, a^\dagger] = 1,\quad N = a^\dagger a .
```

Fermions (Pauli; Fetter and Walecka 1971):

```math
a|1\rangle=|0\rangle,\ a|0\rangle=0,\ a^\dagger|0\rangle=|1\rangle,\
a^\dagger|1\rangle=0,\ a^2=0,\ \{a, a^\dagger\}=1,\ N\in\{0,1\}.
```

The bosonic coherent state
`|alpha> = e^{-|alpha|^2/2} sum alpha^n/sqrt(n!) |n>` satisfies
`a|alpha> = alpha|alpha>` and `|<n|alpha>|^2 = e^{-nbar} nbar^n/n!`
with `nbar = |alpha|^2`.

## Numerical method

States are real coefficient vectors over `|0>..|nMax|` (`nMax = 24`
bosons, `1` fermions); operators are exact sparse linear maps. The
sweep applies `a-dagger` step by step (the pump), kept within the
visible ladder; in coherent mode `alpha` ramps from 0 with the sweep.
The capture path maps capture fraction directly to the sweep
parameter, so reference frames are reproducible and frame-rate
independent. Deterministic, no RNG.

## Controls

- `statistics` (share key `stat`): boson (`[a, a-dagger] = 1`) or
  fermion (`{a, a-dagger} = 1`, Pauli).
- `state` (share key `mode`): number-state pump (apply `a-dagger`) or
  bosonic coherent state.
- `coherent alpha` (share key `alpha`): the coherent amplitude
  (`<N> = alpha^2`).
- Reset (boson, pump, `alpha = 2.4`), Pause/Play (the sweep), Copy
  URL.

## Expected qualitative features

- The pump climbs the boson ladder (`|0> -> |1> -> ...`); the
  amplitude bar moves up the rungs.
- Fermions show only `|0>, |1>` with a Pauli ceiling
  (`a-dagger|1> = 0`).
- `(a a-dagger -+ a-dagger a)|psi>` is identical to `|psi>`
  (eigenvalue 1): the (anti)commutator.
- The coherent-state occupation distribution is Poissonian, peaked
  near `nbar = alpha^2`.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (9 tests):

1. Boson lowering `a|n> = sqrt(n)|n-1>`, `a|0> = 0`.
2. Boson raising `a-dagger|n> = sqrt(n+1)|n+1>`.
3. Boson `[a, a-dagger] = 1`; `N = a-dagger a` has spectrum `n`.
4. `a-dagger` is the adjoint of `a`.
5. Fermion Pauli algebra: `a|1>=|0>`, `a|0>=0`,
   `a-dagger|0>=|1>`, `a-dagger|1>=0`, `a^2=0`, `(a-dagger)^2=0`.
6. Fermion anticommutator `{a, a-dagger}=1`, `N in {0,1}`.
7. The coherent state is a normalised Poissonian eigenstate of `a`
   (`a|alpha>=alpha|alpha>`, `<N>=alpha^2`).
8. The pump climbs for bosons but saturates at `|1>` for fermions.
9. Determinism.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `a|0> = 0` (no state below the vacuum); `a-dagger|1> = 0` for
  fermions (Pauli ceiling). Tests 1, 5.
- `alpha -> 0`: the coherent state `-> |0>` (vacuum). Test 7.
- `(a a-dagger -+ a-dagger a)` is the identity. Tests 3, 6.

## Visual fallback

Static three-panel Canvas2D: the ladder, the (anti)commutator
identity, and the occupation distribution are all readable without
animation; only the pump/coherent sweep advances.

## Citations

- Dirac, P. A. M., Proc. R. Soc. A 114, 243 (1927). `dirac1927`.
- Fetter, A. L. and Walecka, J. D., *Quantum Theory of Many-Particle
  Systems*, 1971. `fetter-walecka1971`.
- Sakurai, J. J. and Napolitano, J., *Modern Quantum Mechanics*.
  `sakurai2020`.

## Stretch goals

- Two-mode (anti)commutators `[a_i, a_j^dagger] = delta_ij`,
  including the fermion sign on mode exchange.
- Squeezed and cat states; their non-Poissonian statistics.
- The Bogoliubov transformation and quasiparticle vacua.

## Risk register

- Truncation at `nMax = 24` (bosons): the pump and coherent default
  stay well within it; the coherent norm/`<N>` invariant uses a
  larger basis to confirm negligible truncation.
- Coefficients are taken real (real `alpha`); the operator algebra
  and Poissonian statistics are unaffected, only complex phases are
  omitted (out of scope, noted).
- Switching a control restarts the sweep (ph = 0): intended, so a
  fresh statistic/mode starts from the vacuum.
