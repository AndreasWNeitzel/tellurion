---
title: q-state Potts Model on a 2D Square Lattice
slug: potts-q-state-transition
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2014
supporting_ucs: [FIS2018, MAA-NM]
curriculum_year: bsc-y2s1
hook: 'Generalize the Ising magnet to q colours and one dial flips the phase transition from a smooth second-order one to an abrupt first-order jump.'
one_paragraph: 'In the q-state Potts model each site picks one of q colours and a bond lowers the energy only when its two sites match. It generalizes the Ising model (q = 2) and orders below T_c = 1 / ln(1 + sqrt(q)). The character of the transition depends only on q: for q up to 4 it is continuous (second order), while for q of 5 or more it turns first order, with a latent-heat jump and coexisting phases. The playground runs Metropolis dynamics through T_c and shows the order parameter and energy, so the continuous-versus-abrupt distinction is visible as you change q. Reference: Wu 1982, Rev. Mod. Phys. 54, 235.'
tags: [thermodynamics, statistical-physics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# q-state Potts model on a 2D square lattice

## Explainer

### What you are looking at

The Ising model has two states per site; the Potts model generalizes
to $q$ states, and that one number changes the very nature of the
phase transition: continuous for small $q$, abruptly first-order for
large $q$. The playground runs the 2D Potts model and lets you watch
order appear, and the transition change character, as you vary $q$
and temperature.

### The model

Each site of a periodic square lattice carries a spin
$s_i\in\{0,\dots,q-1\}$. Neighbours that match lower the energy:

$$E = -J\sum_{\langle i j\rangle}\delta_{s_i,s_j},$$

with $\delta$ the Kronecker delta. It is simulated by Metropolis (or
Wolff-cluster) Monte Carlo at temperature $T$: at high $T$ entropy
wins and the lattice is a disordered rainbow; at low $T$ energy wins
and one colour takes over (spontaneous symmetry breaking among the
$q$ equivalent states).

### Why q changes the transition order

The 2D Potts model has an exactly known critical temperature

$$\frac{k_BT_c}{J} = \frac{1}{\ln(1+\sqrt{q})},$$

and, crucially, the order of the transition depends on $q$:

- $q\le 4$: a continuous (second-order) transition. The order
  parameter rises smoothly from zero; correlations diverge with
  universal critical exponents ($q=2$ is exactly the Ising
  universality class).
- $q\ge 5$: a first-order transition. The order parameter jumps
  discontinuously, ordered and disordered phases coexist at $T_c$
  with latent heat and metastable hysteresis, just like
  liquid-vapour.

So $q=4$ is the marginal boundary between two qualitatively different
kinds of phase transition, a clean, exactly-solvable laboratory for
the difference between continuous and first-order critical behaviour
(and the model behind grain growth, foams and image segmentation).
The playground sweeps $q$ and $T$ and shows the domains, the energy,
and the order parameter through $T_c$.

### Things to try

- Set $q=2$ and watch a smooth Ising-like continuous ordering as $T$
  drops through $T_c$.
- Set $q=10$ and watch the transition snap: coexisting ordered and
  disordered patches and hysteresis (first order).
- Read $T_c=J/\ln(1+\sqrt q)$ off the ordering temperature as you
  change $q$.

### Where this comes from

The Potts model, its exact $T_c$ and the $q=4$ order-of-transition
boundary follow Wu, Rev. Mod. Phys. 54, 235 (1982), and Binney et
al., *The Theory of Critical Phenomena*.

## Physical setup

Each site of an L x L periodic square lattice holds a discrete spin s in {0, 1, ..., q - 1}. Energy:
  E = -J sum_{<i, j>} delta(s_i, s_j) with J = 1.

The Potts model generalizes the Ising model (q = 2). It has a phase transition at T_c(q) = 1 / ln(1 + sqrt(q)) (Baxter / Wu 1982). For q in {2, 3, 4} the transition is second-order; for q >= 5 it is first-order with latent heat.

## Governing equations

Single-spin Metropolis update: at each step, pick a uniformly random site, propose a new spin uniformly random in {0, ..., q-1} \ {s_old}, accept with probability min(1, exp(-beta dE)) where dE = -(neighbors-matching-s_new) + (neighbors-matching-s_old).

Order parameter:
  M = (q n_max - N) / ((q - 1) N), in [0, 1]
with n_max the largest count of any single spin value and N = L^2.

## Numerical method

Pure JavaScript Int8Array spin grid. Single-spin Metropolis sweeps of L*L attempts each. PCG64 RNG seeded by URL ?seed parameter; defaults to 0xC0FFEE.

## Controls

- q: number of states, slider 2 - 10, default 3
- T/T_c: temperature in units of the critical temperature, slider 0.5 - 1.6, default 1.0
- speed: sweeps per render frame, 0.5 - 6.0, default 2
- Cold start: all spins = 0
- Hot start: uniform random spin draw

## Expected qualitative features

1. Cold (T < T_c) phase: large monochromatic patches; M -> 1 within a few sweeps.
2. Hot (T > T_c) phase: salt-and-pepper noise; M oscillates around 0.
3. Near-critical (T ~ T_c): scale-free domain structure with long correlations.
4. q >= 5: at exactly T = T_c, ordered and disordered phases can coexist (latent heat).

## Invariants and acceptance thresholds

- T_c(q) = 1 / ln(1 + sqrt(q)) (Baxter / Wu 1982) verified to 6 sig figs.
- T_c monotonically decreasing in q.
- Cold start at 0.5 T_c: M > 0.95 after 50 sweeps (q = 3).
- Hot start at 1.5 T_c: M < 0.10 after 600 sweeps (q = 3, q = 7).
- M in [0, 1] for all q, T tested.
- Cold-start energy at the lower bound -2 per site.
- Infinite-T energy approaches -2/q.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- q = 2: reduces to Ising with the delta-function-bond convention. T_c here is half the standard Ising T_c (which uses E = -J s_i s_j with s in {-1, +1}).
- T -> 0: ground state has all spins equal; q-fold degenerate.
- T -> infinity: independent uniform spins; M ~ O(N^{-1/2}).

## Visual fallback

Canvas2D only.

## Citations

- Wu 1982, "The Potts model", Rev. Mod. Phys. 54, 235 (`wu1982potts`).
- Newman and Barkema 1999, Monte Carlo Methods in Statistical Physics, Chapter 5 (`newmanbarkema1999`).

## Stretch goals

- Wolff cluster algorithm for faster equilibration near T_c.
- Histogram of n_max / N to visualize the first-order coexistence at q >= 5.

## Risk register

- Single-spin Metropolis is slow near T_c (long autocorrelation times). Acceptable for visualization, unsuitable for quantitative scaling.
- L = 96 + q = 10 gives 9216 sites; ~ 60 fps in Chrome on a mid-range laptop.
