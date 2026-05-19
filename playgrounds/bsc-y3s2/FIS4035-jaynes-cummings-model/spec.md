---
title: Jaynes-Cummings Model: Collapse and Revival
slug: jaynes-cummings-model
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: FIS4035
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: jaynes-cummings1963
hook: 'A two-level atom in a single quantised cavity mode does not Rabi-oscillate forever. With a coherent field the inversion collapses on a time set by the spread of quantum Rabi frequencies (independent of the photon number) and then spontaneously revives near t_r = 2 pi sqrt(nbar) / g, a pure interference effect with no classical analogue. The revival peak lands within 10% of 2 pi sqrt(nbar)/g and the collapse time is nbar-independent to better than 1%.'
one_paragraph: 'An interactive view of the resonant Jaynes-Cummings model (Jaynes and Cummings 1963; Shore and Knight 1993; Gerry and Knight 2005, Ch. 4): a two-level atom, initially excited, coupled to one quantised cavity mode in the rotating-wave approximation at exact resonance. Each photon-number doublet {|e,n>, |g,n+1>} oscillates at the quantum Rabi frequency Omega_n = 2 g sqrt(n+1), so for a field with photon distribution P(n) the atomic inversion is the exact closed-form sum W(t) = sum_n P(n) cos(2 g t sqrt(n+1)) with P_e + P_g = 1 by construction. For a coherent state the Poissonian spread of Rabi frequencies dephases the oscillation: it collapses on t_c ~ sqrt(2)/g (set by the frequency spread ~ g, hence independent of the mean photon number nbar) and then, because the frequencies are discrete, rephases into a revival near t_r = 2 pi sqrt(nbar) / g (Eberly, Narozhny and Sanchez-Mondragon 1980). The playground draws the full analytic W(t) over the window faint, with a bright sweep and playhead revealing it in time, alongside the Poissonian P(n) and the coherent-field Wigner blob in phase space. The collapse time is set by the spread of Rabi frequencies (of order g, hence independent of the mean photon number) and the revival by their discreteness, recurring near t_r = 2 pi sqrt(nbar)/g; this is the exact quantum result of the model, a direct signature of field quantisation. Reference: Gerry and Knight, Introductory Quantum Optics, Chapter 4; Eberly, Narozhny and Sanchez-Mondragon 1980.'
tags: [quantum-optics, cavity-qed, collapse-revival, rabi-oscillation, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [nbar, g]
---

# Jaynes-Cummings Model: Collapse and Revival

## Explainer

### What you are looking at

One atom, one quantized light mode, exchanging a single quantum of
energy. If the field were classical the atom would flip up and down
forever (Rabi flopping). Because the field is quantum, those
oscillations collapse to silence and then, remarkably, revive. That
collapse-and-revival is direct evidence the electromagnetic field is
quantized.

### The model

The Jaynes-Cummings Hamiltonian (rotating-wave approximation, exact
resonance) couples the atom to the cavity mode with strength $g$:

$$H = \hbar\omega\,a^\dagger a
  + \tfrac{\hbar\omega}{2}\sigma_z
  + \hbar g\,(a^\dagger\sigma_- + a\,\sigma_+).$$

For a definite photon number $n$ the excited-state probability
oscillates at the quantum Rabi frequency $\Omega_n = 2g\sqrt{n+1}$:
each photon number rings at its *own* speed.

### Collapse and revival

Start the atom excited and the field in a coherent state of mean
photon number $\bar n$ (a Poisson spread of photon numbers). The atomic
inversion $W = P_e - P_g$ is then a sum of many Rabi oscillations at
incommensurate frequencies $2g\sqrt{n+1}$:

$$W(t) = \sum_n P(n)\cos\!\big(2g\sqrt{n+1}\,t\big).$$

Early on they dephase and the oscillation *collapses* to near zero
(timescale set by the spread of $\sqrt{n}$). Much later the
discreteness of the photon ladder makes them rephase and the
oscillation *revives*, at $t_\text{rev}\approx 2\pi\sqrt{\bar n}/g$. A
classical field (continuous $n$) would never revive; the revival is a
purely quantum signature of field quantization, and it has been seen in
cavity-QED experiments. The playground evolves $W(t)$ and shows the
collapse and the later revival.

### Things to try

- Watch the inversion ring, collapse to flat, then revive as a beat
  packet much later.
- Increase $\bar n$ and watch the collapse get faster and the revival
  push out to later time ($\propto\sqrt{\bar n}$).
- Note a single Fock state ($P(n)=\delta$) gives clean unending Rabi
  flopping: the collapse needs the photon-number spread.

### Where this comes from

The Jaynes-Cummings Hamiltonian, the $2g\sqrt{n+1}$ Rabi frequencies,
and collapse-and-revival follow Gerry and Knight, *Introductory Quantum
Optics*, and Scully and Zubairy, *Quantum Optics*.

## Physical setup

A single two-level atom sits in a lossless optical cavity supporting
one quantised mode, on exact resonance (atomic transition frequency
equal to the mode frequency). The atom starts in its excited state and
the field starts in a coherent state of mean photon number `nbar`. The
atom and field exchange a single quantum of excitation coherently; the
observable is the atomic inversion `W = P_e - P_g`. Because the field
is a superposition of photon numbers, many Rabi oscillations at
different frequencies run at once and interfere, which is what produces
the collapse and the later revival.

## Governing equations

Jaynes-Cummings Hamiltonian, rotating-wave approximation, zero
detuning (Jaynes and Cummings 1963):

```math
H = \hbar\omega\, a^\dagger a + \tfrac{1}{2}\hbar\omega\,\sigma_z
  + \hbar g\,(a^\dagger \sigma_- + a\,\sigma_+).
```

The dynamics decouple into two-dimensional doublets
`{|e,n>, |g,n+1>}` with quantum Rabi frequency
`Omega_n = 2 g sqrt(n+1)`. For the atom initially excited and a field
with photon-number distribution `P(n)`, the inversion is exact:

```math
W(t) = \sum_{n} P(n)\,\cos\!\big(2 g t \sqrt{n+1}\big),
\qquad P_e = \tfrac{1+W}{2},\quad P_g = \tfrac{1-W}{2},
```

so `P_e + P_g = 1` identically. For a coherent state
`P(n) = e^{-\bar n}\,\bar n^{\,n}/n!`. Expanding `sqrt(n+1)` about
`nbar` gives a Gaussian collapse envelope `exp(-(g t)^2/2)`, hence a
collapse time `t_c ~ sqrt(2)/g` independent of `nbar`, and a first
revival when neighbouring phases realign, at
`t_r = 2 pi sqrt(nbar) / g` (Eberly, Narozhny and
Sanchez-Mondragon 1980; Gerry and Knight 2005, Eqs. 4.119-4.126).

## Numerical method

There is no time integration. `W(t)` is evaluated directly from the
closed-form sum, truncating the Poisson series where the tail is below
machine-relevant size (`n_max = nbar + 8 sqrt(nbar) + 20`), using a
stable log-space recurrence for `P(n)`. The analytic curve is sampled
on a fixed grid over a window `T = max(2.4 t_r, 24/g, 18)` chosen to
contain the collapse and at least the first full revival; the capture
path maps capture fraction directly to absolute time
(`t = f * T`), so reference frames are reproducible and
frame-rate independent. Deterministic, no RNG.

## Controls

- `mean photons nbar` (share key `nbar`): mean photon number of the
  coherent field; sets the revival time `2 pi sqrt(nbar)/g` and the
  width of `P(n)`. `nbar -> 0` is the vacuum Rabi limit.
- `coupling g` (share key `g`): atom-field coupling; sets the Rabi and
  collapse timescales.
- Reset (restores `nbar = 25`, `g = 1`), Pause/Play (Play replays the
  sweep once it reaches the end), Copy URL.

## Expected qualitative features

- Vacuum (`nbar -> 0`): a single undamped Rabi oscillation
  `W = cos(2 g t)`, no collapse.
- Coherent field: fast initial Rabi oscillation that collapses to
  `W ~ 0` on a few `1/g`, a quiet interval, then a revival packet near
  `t_r = 2 pi sqrt(nbar)/g`, followed by further broader, overlapping
  revivals.
- The collapse time does not move with `nbar`; the revival time grows
  as `sqrt(nbar)`.
- `P(n)` is a Poissonian peaked at `nbar` with variance `nbar`; the
  field Wigner function is a single minimum-uncertainty Gaussian at
  `x = sqrt(2 nbar)` on the real quadrature.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (7 tests):

1. Probability conservation: `P_e(t) + P_g(t) = 1` for all `t`, all
   `nbar` (12 digits).
2. A pure number state `|e,n>` gives `W(t) = cos(2 g t sqrt(n+1))`
   exactly (10 digits); `Omega_n = 2 g sqrt(n+1)`.
3. Vacuum (`nbar -> 0`): `W = cos(2 g t)` to 12 digits and the
   envelope stays above 0.999 at late time (no collapse).
4. Collapse then revival (Eberly): the envelope is `< 0.2` in the
   dead zone, `> 0.4` in the revival window, ratio `> 3`, and the
   revival peak is within 10% of `t_r = 2 pi sqrt(nbar)/g`.
5. The envelope collapse time is `O(sqrt(2)/g)` and `nbar`-independent
   (relative spread `< 1%` over `nbar` in `[10, 60]`).
6. The coherent `P(n)` is Poissonian: norm 1 (9 digits), mean `= nbar`
   (4 digits), variance `= nbar` (2 digits).
7. Determinism: identical inputs reproduce the series bit-for-bit.

Visual gate: SSIM > 0.92 against the five committed golden frames.

## Limiting cases for verification

- `nbar -> 0`: single-frequency limit, `W = cos(2 g t)`. Test 3.
- Number state: monochromatic Rabi flopping at `2 g sqrt(n+1)`.
  Test 2.
- Large `nbar`: collapse time stays `~ sqrt(2)/g` (test 5), revival
  time scales as `sqrt(nbar)` (test 4 at `nbar = 25` gives
  `t_r = 10 pi`).
- Probability is conserved at all times by construction. Test 1.

## Visual fallback

Static three-panel Canvas2D: the full analytic `W(t)` is always drawn
(faint), so the collapse and revival structure is visible without any
animation; the bright sweep and playhead only indicate the current
time. The photon-distribution and Wigner panels are time-independent.

## Citations

- Jaynes, E. T. and Cummings, F. W., Proc. IEEE 51, 89 (1963).
  `jaynes-cummings1963`.
- Eberly, J. H., Narozhny, N. B. and Sanchez-Mondragon, J. J., Phys.
  Rev. Lett. 44, 1323 (1980). `eberly-narozhny-sanchezmondragon1980`.
- Shore, B. W. and Knight, P. L., J. Mod. Opt. 40, 1195 (1993).
  `shore-knight1993`.
- Gerry, C. C. and Knight, P. L., *Introductory Quantum Optics*, CUP
  2005, Ch. 4. `gerry-knight2005`.

## Stretch goals

- Nonzero detuning (dispersive regime, Stark-shifted revivals).
- Field state choice: thermal vs Fock vs squeezed, contrasting
  collapse/revival signatures.
- Reduced-field Wigner under the entangling JC evolution (cat-state
  formation at half a revival).

## Risk register

- Poisson truncation too tight at large `nbar`: mitigated by the
  `nbar + 8 sqrt(nbar) + 20` cutoff and the norm/mean/variance
  invariant (test 6).
- Fast Rabi oscillation aliasing the sampled curve at large `nbar`:
  the window/sample count keeps several samples per Rabi period over
  the slider range; the physics shown is the envelope, which is well
  resolved.
- Revival-peak position is only asymptotically `2 pi sqrt(nbar)/g`:
  the invariant uses a 10% tolerance, which is honest for the
  finite-`nbar` shift rather than an over-tight fit.
