---
title: BTW Sandpile and Self-Organized Criticality
slug: abelian-sandpile-btw
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2014
primary_citation: newmanbarkema1999
supporting_ucs: [FIS2018, MAA-NM]
curriculum_year: bsc-y2s1
hook: 'Drop sand one grain at a time and the pile organizes itself onto a knife edge where a single grain can trigger an avalanche of any size.'
one_paragraph: 'The Bak-Tang-Wiesenfeld sandpile is the original model of self-organized criticality. Grains drop on a lattice; a site holding four or more topples, handing one grain to each neighbour and possibly toppling them in turn, while grains at the edge fall off. With no tuning at all, the pile drives itself to a critical state where avalanche sizes follow a power law P(s) ~ s^(-tau) with tau about 1.21 in 2D: scale-free, with no typical avalanche size. The playground runs the dynamics and builds the avalanche-size histogram live so the power law appears on its own. This is the prototype for earthquakes, forest fires, and neuronal cascades. Reference: Bak, Tang and Wiesenfeld 1987.'
tags: [thermodynamics, statistical-physics, animation, live-readout]
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
  - "Newman, Barkema, Monte Carlo Methods in Statistical Physics."
---

# BTW sandpile and self-organized criticality

## Explainer

### What you are looking at

Add sand one grain at a time to a pile and most grains do nothing,
but occasionally one triggers an avalanche, and those avalanches come
in all sizes with no typical scale. The system tunes itself to the
critical point with no parameter adjustment. The playground is the
Bak-Tang-Wiesenfeld sandpile, the original model of
self-organized criticality.

### The toppling rule

Each cell $i$ of a 2D lattice holds an integer height $z_i$. Drop a
grain on a random cell; if any cell reaches the threshold $z_c$ it
topples, redistributing $z_c$ grains to its $z_c$ neighbours:

$$\boxed{\;z_i \ge z_c \;\Longrightarrow\;
  z_i \to z_i - z_c,\quad
  z_j \to z_j + 1 \ \text{for each neighbour } j\,\text{of}\, i.\;}$$

On a square lattice with nearest-neighbour interaction, $z_c = 4$
(four neighbours). Grains that fall off the boundary leave the system
(open boundary condition, the way energy dissipates). Toppling can
push neighbours over threshold, which set off further topplings: one
grain dropped on a critical pile can trigger an avalanche of any size.

The rule is *abelian*: the final stable configuration is independent
of the order in which unstable cells are relaxed (Dhar 1990). This
makes the model algorithmically clean and exactly solvable in some
respects (the group structure of stable configurations is computable).

### The avalanche size distribution

Driven slowly (one grain at a time, after the pile has stabilised)
and dissipating at the boundary, the pile reaches a stationary state
in which the avalanche size $s$ (the number of topplings in one
event) follows a power law:

$$\boxed{\;P(s) \sim s^{-\tau}\,f(s / L^D),\;}$$

where $\tau \approx 1.27$ in 2D and $L^D$ is a finite-size cutoff
($D \approx 2.78$). On log-log axes the bulk of the distribution is
a straight line: most events are tiny, but events of every magnitude
up to system-spanning occur, and the distribution is scale-free. The
same scaling applies to the avalanche duration $T$ and to the area
$a$ covered.

### Self-organised criticality

This is fundamentally different from a tuned phase transition:
*nothing* sets the control parameter (no $T = T_c$ to dial in). The
dynamics finds the critical point itself. The mechanism is that the
driving rate is infinitely slower than the relaxation rate (separation
of time scales), and the average grain in equals the average grain
out by conservation.

Analogues invoked in the same framework: earthquakes (the
Gutenberg-Richter law $\log N(>M) = a - b M$), forest fires (Drossel
and Schwabl 1992), neuronal avalanches (Beggs and Plenz 2003),
landslides, solar flares, and stock-market crashes.

### Symbols, at a glance

- $z_i$, integer height at cell $i$.
- $z_c$, toppling threshold ($z_c = 4$ for the square lattice).
- $s$, avalanche size (number of topplings).
- $T$, avalanche duration; $a$, avalanche area.
- $\tau$, the avalanche-size exponent ($\tau \approx 1.27$ in 2D).
- $L$, linear size of the lattice; $L^D$ the finite-size cutoff.
- $P(s)$, the avalanche-size distribution.

### Things to try

- Drop grains and watch most do nothing while rare ones trigger
  large cascades.
- Build up the avalanche-size histogram and see it straighten into a
  power law on log-log.
- Note the pile self-tunes to criticality: you never set a
  parameter, it finds it.

### Bibliographic origin

The original model: Bak, Tang and Wiesenfeld, *Phys. Rev. Lett.* **59**
(1987) 381 (the seminal SOC paper), with the extended treatment in
*Phys. Rev. A* **38** (1988) 364. The abelian-group structure: Dhar,
*Phys. Rev. Lett.* **64** (1990) 1613. A modern textbook is Jensen,
*Self-Organized Criticality: Emergent Complex Behavior in Physical
and Biological Systems* (Cambridge 1998), Ch. 3, 4. The
forest-fire variant: Drossel and Schwabl, *Phys. Rev. Lett.* **69**
(1992) 1629. The neuronal-avalanche analogy: Beggs and Plenz, *J.
Neurosci.* **23** (2003) 11167.

## Physical setup

32 x 32 lattice of integer heights. Drop a grain at a random site;
topple when height >= 4. Boundary sites lose grains to the outside.
After enough drops the system settles into a critical state where
avalanche-size distribution is a power law P(s) ~ s^(-tau), tau ~ 1.21
in 2D.

## Governing equations

  z(x, y) -= 4   if z(x, y) >= 4
  z(x +/- 1, y), z(x, y +/- 1) += 1   (within lattice)
  Cascade until stable.

## Controls

- speed: drops per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Early: small isolated avalanches.
2. After many drops: system reaches critical density; large cascades
   occur intermittently.
3. Histogram develops a clear power-law tail.

## Invariants and acceptance thresholds

1. Heights bounded to [0, 3] at steady state.
2. Topple count non-negative.
3. Heavy-tailed: max avalanche > 10 after 10k drops.
4. Histogram populated.
5. L = 32 lattice exported.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- 1D BTW: tau = 1 exactly.
- Boundary loss: grains escape, preventing global infinity.

## Visual fallback

Canvas2D only. Lattice cells colored by height (0..3). Right panel:
log-log avalanche-size histogram with s^(-1.21) reference line.

## Citations

- Bak, Tang, Wiesenfeld 1987 PRL.
- Bak 1996, How Nature Works.

## Stretch goals

- Manna model variant.
- Forest fire model.
- Detailed scaling exponents (alpha for area, t for duration).

## Risk register

- Power-law tail is statistical; need ~ 10^4+ drops to see it cleanly.
