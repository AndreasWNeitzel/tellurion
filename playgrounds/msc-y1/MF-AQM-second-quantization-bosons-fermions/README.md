# Second Quantization: Fock States, Ladder Operators, (Anti)commutators

This playground is a single field mode in the occupation-number
representation. The top panel is the Fock ladder of number states
`|0>, |1>, |2>, ...`; the creation operator `a-dagger` adds a quantum
with amplitude `sqrt(n+1)` and the annihilation operator `a` removes
one with `sqrt(n)`. The lower-left panel applies the (anti)commutator
to the current state and overlays the result on the input to show it
is the identity; the lower-right panel is the occupation distribution.

Watch the pump climb the ladder: `a-dagger` applied repeatedly walks
the state `|0> -> |1> -> |2> -> ...` up the rungs. Switch the
statistics to fermion and the ladder collapses to just two rungs:
`a-dagger|1> = 0`, the Pauli exclusion ceiling, and the relation in
the second panel becomes the anticommutator `{a, a-dagger} = 1`
instead of the commutator. Choose the coherent state and the
distribution becomes Poissonian, the signature of the eigenstate of
`a` with `<N> = alpha^2`. The (anti)commutator panel always shows
`(a a-dagger -+ a-dagger a)|psi>` landing exactly back on `|psi>`,
eigenvalue one to machine precision.

`statistics` switches boson versus fermion (commutator vs
anticommutator, and the Pauli ceiling). `state` switches the
number-state pump and the bosonic coherent state. `coherent alpha`
sets the coherent amplitude. Reset returns to the boson pump.
Pause/Play stops or replays the sweep, and Copy URL shares the exact
state. The panels read without motion for `prefers-reduced-motion`.

## Reference

Primary citation: `dirac1927` (creation/annihilation operators); see
also `fetter-walecka1971` (Fock space, Pauli algebra) and
`sakurai2020`.

## Verification

- Strong invariant: `a|n> = sqrt(n)|n-1>` and `a-dagger|n> =
  sqrt(n+1)|n+1>`; bosonic `[a, a-dagger] = 1`, fermionic
  `{a, a-dagger} = 1` with `a-dagger|1> = 0`; the coherent state is a
  Poissonian eigenstate of `a`.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
