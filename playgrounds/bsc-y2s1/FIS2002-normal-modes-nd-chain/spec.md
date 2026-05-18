---
title: Normal Modes of a Mass-Spring Chain
slug: normal-modes-nd-chain
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Watch the chain breathe in one normal mode, then make it diatomic and a forbidden frequency gap tears the spectrum into an acoustic and an optical branch.'
one_paragraph: 'A fixed-end chain of N masses on springs oscillating in a chosen normal mode, with the dispersion relation alongside. The monatomic chain has exactly N modes at omega_n = 2 sqrt(K/m) sin(n pi / 2(N+1)), each a standing wave with n-1 internal nodes. Switching to a diatomic chain with two alternating spring constants splits the spectrum into an acoustic and an optical branch separated by a zone-boundary band gap that closes exactly when the springs are equal. The primary scene is the physical chain animating the selected mode; the side panel is omega(k) with the gap shaded, and clicking it picks a mode. The headless sim.js is gate-tested for the N analytic frequencies, the Verlet dynamics matching them, energy conservation, the diatomic branch endpoints, and the band gap closing at K1 = K2.'
tags: [waves, solid-state, normal-modes, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2002
share_state_keys: []
---

# Normal Modes of a Mass-Spring Chain

## Explainer

### What you are looking at

A row of masses linked by springs. Pluck it any way and the messy
motion is always a sum of a few clean standing-wave patterns, the
normal modes, each vibrating at its own fixed frequency. This is the
discrete ancestor of every continuous wave: a guitar string, a crystal
lattice, a phonon.

### The monatomic chain

For $N$ equal masses $m$ and springs $K$ with fixed ends, solving the
coupled equations gives exactly $N$ modes:

$$\omega_n = 2\sqrt{\frac{K}{m}}\,
  \sin\!\left(\frac{n\pi}{2(N+1)}\right),
  \qquad n = 1,\dots,N,$$

with sinusoidal shapes $A_i \propto \sin\!\big(i\,n\pi/(N+1)\big)$.
Long-wavelength modes (small $n$) have $\omega \propto n$: that linear
part is ordinary sound. Near the maximum $n$ the frequency saturates at
$2\sqrt{K/m}$, the lattice cannot vibrate faster than its springs
allow.

### The diatomic chain: a gap opens

Alternate two spring constants $K_1, K_2$ (a two-atom basis) and the
single branch splits in two:

$$\omega^2 = \frac{K_1+K_2}{m}
  \mp \frac{1}{m}\sqrt{K_1^2 + K_2^2 + 2K_1 K_2\cos(ka)}.$$

The lower sign is the acoustic branch (neighbors move together, ordinary
sound); the upper sign is the optical branch (neighbors move against
each other). Between them, at the zone boundary, sits a frequency gap
of width $\sqrt{2\max(K_1,K_2)/m} - \sqrt{2\min(K_1,K_2)/m}$, which
closes only when $K_1 = K_2$ (back to one atom per cell). This gap is
exactly why ionic crystals have a forbidden infrared band.

### Things to try

- Excite a single low-$n$ mode and watch a clean standing sine wave;
  excite a high-$n$ mode and see the rapid zigzag near the cutoff.
- Switch to the diatomic chain and watch the acoustic (in-phase) and
  optical (anti-phase) branches, with the gap between them.
- Set $K_1 = K_2$ and watch the gap close: the two-atom cell collapses
  back to one.

### Where this comes from

The monatomic and diatomic chain mode frequencies, the acoustic and
optical branches, and the zone-boundary gap follow Ashcroft and Mermin,
*Solid State Physics*, Chapter 22.

## Physical setup

A 1D chain of N point masses joined by springs with fixed ends. The
monatomic chain has one spring constant; the diatomic chain alternates
two spring constants along the chain (a two-atom basis).

## Governing equations

For the monatomic fixed-end chain the normal-mode frequencies are

`omega_n = 2 sqrt(K/m) sin( n pi / (2 (N+1)) ),  n = 1..N`,

with mode shape `A_i ~ sin(i n pi / (N+1))`. For the diatomic chain
(equal masses, alternating `K1, K2`, lattice constant `a`)

`omega^2 = (K1+K2)/m -/+ (1/m) sqrt(K1^2 + K2^2 + 2 K1 K2 cos(k a))`,

giving an acoustic branch (lower sign) and an optical branch (upper
sign). The zone-boundary gap is
`sqrt(2 max(K1,K2)/m) - sqrt(2 min(K1,K2)/m)`, zero iff `K1 = K2`.

## Numerical method

Closed-form mode shapes and frequencies for the animation; a
velocity-Verlet integration of the coupled chain is used in the
invariants to confirm the analytic frequencies dynamically. The
diatomic motion is the Bloch form with the acoustic (in-phase) or
optical (out-of-phase sublattice) pattern. Reference: Ashcroft and
Mermin, *Solid State Physics*, Ch. 22 (`ashcroft-mermin`).

## Controls

- lattice: monatomic, or diatomic with two spring constants.
- N masses; mode n (spans the acoustic then optical set in the
  diatomic case); spring ratio K2/K1.
- Click the dispersion panel to select a mode and branch.
- Reset, Pause.

## Expected qualitative features

- Each mode is a standing wave; mode n has n-1 internal nodes.
- The chain oscillates: maximum, through flat (all masses cross zero
  together), to the inverted maximum.
- Diatomic: a shaded band gap appears; the optical branch has
  neighbouring masses out of phase.
- Raising K2/K1 widens the gap; K2/K1 = 1 closes it (monatomic).

## Invariants and acceptance thresholds

- Exactly N distinct, ordered monatomic modes; `omega_n` matches the
  closed form within 0.1%.
- Mode shape vanishes at the walls and has exactly n-1 internal nodes.
- The Verlet chain oscillates at `omega_n` within 1%.
- An undamped chain conserves energy within 0.5%.
- Diatomic branch endpoints exact: acoustic 0 and optical
  `sqrt(2(K1+K2)/m)` at k=0; `sqrt(2 min/m)` and `sqrt(2 max/m)` at
  the zone boundary.
- A band gap exists, grows with the spring contrast, never lets the
  branches cross, and is zero (`< 1e-9`) at `K1 = K2`.

## Limiting cases for verification

- `K1 = K2`: the diatomic gap closes (the monatomic chain).
- `k -> 0`: the acoustic frequency vanishes (uniform translation).

Source: Ashcroft and Mermin, *Solid State Physics*, Ch. 22
(`ashcroft-mermin`).
